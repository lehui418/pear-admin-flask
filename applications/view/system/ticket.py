import csv
import io
import json
import re
import traceback
from datetime import datetime, timedelta

from flask import (
    Blueprint,
    Response,
    current_app,
    g,
    jsonify,
    make_response,
    render_template,
    request,
    send_file,
)
from flask_login import current_user, login_required
from sqlalchemy import desc, inspect
from sqlalchemy.orm import joinedload

from applications.common import curd
from applications.common.curd import disable_status, enable_status, model_to_dicts
from applications.common.helper import ModelFilter
from applications.common.script.admin import operation_log
from applications.common.utils.http import fail_api, success_api, table_api
from applications.common.utils.rights import authorize
from applications.common.utils.validate import str_escape
from applications.common.utils.cache import CacheManager, CACHE_KEYS
from applications.extensions import db
from applications.models import Dept, Role, Ticket, User
from applications.models.ticket_flow import TicketFlow
from applications.schemas import TicketSchema
from applications.services.sla_service import SLAService
from applications.services.ticket_flow_service import TicketFlowService
from applications.common.utils.datetime_util import (
    format_datetime as fmt_datetime,
    parse_datetime_with_logging,
)

bp = Blueprint("ticket", __name__, url_prefix="/ticket")


def _format_datetime(value):
    """
    格式化日期时间字段

    :param value: 日期时间值
    :return: 格式化后的字符串或原值
    """
    return fmt_datetime(value)


def _build_ticket_query_filters(request_args: dict) -> ModelFilter:
    """
    构建工单查询过滤条件

    :param request_args: 请求参数字典
    :return: ModelFilter 实例
    """
    mf = ModelFilter()

    mf.exact("status", str_escape(request_args.get("status", "")))
    mf.exact("priority", str_escape(request_args.get("priority", "")))
    mf.exact("service_method", str_escape(request_args.get("service_method", "")))
    mf.exact("security_level", str_escape(request_args.get("security_level", "")))
    mf.exact("threat_type", str_escape(request_args.get("threat_type", "")))
    mf.exact("impact_scope", str_escape(request_args.get("impact_scope", "")))

    mf.vague("assignee_name", str_escape(request_args.get("assignee", "")))
    mf.vague("serial_number", str_escape(request_args.get("serial_number", "")))
    mf.vague("version_number", str_escape(request_args.get("version_number", "")))
    mf.vague(
        "product_type_level1", str_escape(request_args.get("product_type_level1", ""))
    )
    mf.vague(
        "product_type_level2", str_escape(request_args.get("product_type_level2", ""))
    )
    mf.vague(
        "problem_classification_main",
        str_escape(request_args.get("problem_classification_main", "")),
    )
    mf.vague(
        "customer_agent_name", str_escape(request_args.get("customer_agent_name", ""))
    )
    mf.vague("description", str_escape(request_args.get("description", "")))
    mf.vague("relatedinfo", str_escape(request_args.get("relatedinfo", "")))
    mf.vague("problem_tags", str_escape(request_args.get("problem_tags", "")))
    mf.vague("solution", str_escape(request_args.get("solution", "")))
    mf.vague("order_time", str_escape(request_args.get("order_time", "")))
    mf.vague("create_time", str_escape(request_args.get("create_time", "")))

    warranty = str_escape(request_args.get("warranty", ""))
    if warranty:
        is_out_of_warranty = warranty.lower() == "true"
        mf.exact("is_out_of_warranty", is_out_of_warranty)

    return mf


def _process_ticket_data(tickets: list) -> list:
    """
    处理工单数据：计算超时状态、格式化时间

    :param tickets: 工单字典列表
    :return: 处理后的工单列表
    """
    processed_data = []
    for ticket_dict in tickets:
        overdue_status = SLAService.calculate_ticket_overdue_status(ticket_dict)
        ticket_dict["is_overdue"] = overdue_status["is_overdue"]
        ticket_dict["overdue_hours"] = overdue_status["overdue_hours"]

        ticket_dict["create_time"] = _format_datetime(ticket_dict.get("create_time"))
        ticket_dict["update_time"] = _format_datetime(ticket_dict.get("update_time"))
        ticket_dict["completion_time"] = _format_datetime(
            ticket_dict.get("completion_time")
        )

        processed_data.append(ticket_dict)

    return processed_data


def _extract_photo_ids(image_references_str: str) -> str:
    """
    从图片引用字符串中提取图片ID

    :param image_references_str: 图片引用字符串
    :return: 图片ID的JSON字符串
    """
    if not image_references_str:
        return None
    try:
        photo_ids = []
        image_marks = image_references_str.strip().split("\n@@IMAGE_SEPARATOR@@\n")
        for mark in image_marks:
            if mark:
                match = re.search(r"#id=([^\)]+)", mark)
                if match:
                    photo_ids.append(match.group(1))
        return json.dumps(photo_ids) if photo_ids else None
    except Exception as e:
        current_app.logger.error(f"Error processing image_references_str: {e}")
        return None


def _combine_image_references(
    image_references_str_description: str,
    image_references_str_relatedinfo: str,
    image_references_str_solution: str,
) -> tuple:
    """
    合并多个图片引用字符串

    :param image_references_str_description: 描述中的图片引用
    :param image_references_str_relatedinfo: 相关信息中的图片引用
    :param image_references_str_solution: 解决方案中的图片引用
    :return: (合并后的图片引用字符串, 合并后的图片ID JSON字符串)
    """
    combined_image_references_str = ""
    if image_references_str_description:
        combined_image_references_str += (
            image_references_str_description + "\n@@IMAGE_SEPARATOR@@\n"
        )
    if image_references_str_relatedinfo:
        combined_image_references_str += (
            image_references_str_relatedinfo + "\n@@IMAGE_SEPARATOR@@\n"
        )
    if image_references_str_solution:
        combined_image_references_str += (
            image_references_str_solution + "\n@@IMAGE_SEPARATOR@@\n"
        )
    combined_image_references_str = combined_image_references_str.strip()

    all_photo_ids = []
    if image_references_str_description:
        all_photo_ids.extend(
            json.loads(_extract_photo_ids(image_references_str_description))
        )
    if image_references_str_relatedinfo:
        all_photo_ids.extend(
            json.loads(_extract_photo_ids(image_references_str_relatedinfo))
        )
    if image_references_str_solution:
        all_photo_ids.extend(
            json.loads(_extract_photo_ids(image_references_str_solution))
        )

    final_photo_ids_json = (
        json.dumps(list(set(all_photo_ids))) if all_photo_ids else None
    )
    return combined_image_references_str, final_photo_ids_json


def _process_datetime_field(date_str: str) -> datetime:
    """
    处理日期时间字段

    :param date_str: 日期字符串
    :return: datetime 对象或 None
    """
    return parse_datetime_with_logging(date_str, current_app.logger)


def _create_ticket_flow(
    ticket_id: int, flow_type: str, flow_mode: str, ticket_status: str, user_dept
) -> TicketFlow:
    """
    创建工单流程记录

    :param ticket_id: 工单ID
    :param flow_type: 流程类型
    :param flow_mode: 流程模式
    :param ticket_status: 工单状态
    :param user_dept: 用户部门
    :return: TicketFlow 对象
    """
    from applications.models.ticket_flow import TicketFlow

    flow = TicketFlow(
        ticket_id=ticket_id,
        flow_type=flow_type,
        flow_mode=flow_mode,
        from_status=None,
        to_status=ticket_status,
        handler=current_user.username if current_user.is_authenticated else None,
        department=user_dept.dept_name if user_dept else "技术支持部门",
        description="工单创建",
        create_time=datetime.now(),
    )
    db.session.add(flow)
    current_app.logger.info("初始流程记录创建成功")
    return flow


def _initialize_ticket_sla(ticket: Ticket) -> None:
    """
    初始化工单SLA

    :param ticket: 工单对象
    """
    try:
        SLAService.init_ticket_sla(ticket)
        db.session.add(ticket)
        db.session.commit()
        current_app.logger.info(f"工单SLA初始化成功: ID={ticket.id}")
    except Exception as sla_error:
        current_app.logger.error(f"工单SLA初始化失败: {str(sla_error)}")
        # SLA初始化失败不影响工单创建成功


# 工单管理
@bp.get("/")
@authorize("system:ticket:main")
@login_required
def main():
    is_rd_dept_member = False
    is_quality_dept_member = False
    if current_user.dept_id:
        user_dept = Dept.query.get(current_user.dept_id)
        if user_dept:
            if "研发" in user_dept.dept_name or "开发" in user_dept.dept_name:
                is_rd_dept_member = True
            if (
                "质量" in user_dept.dept_name
                or "质检" in user_dept.dept_name
                or "品控" in user_dept.dept_name
            ):
                is_quality_dept_member = True

    return render_template(
        "system/ticket/main.html",
        is_rd_dept_member=is_rd_dept_member,
        is_quality_dept_member=is_quality_dept_member,
    )


# 工单添加界面
@bp.get("/add")
@authorize("system:ticket:add")
def add_view():
    # 使用缓存获取用户列表，缓存5分钟
    cache_key = f"{CACHE_KEYS['USER_INFO']}:all_users"
    users = CacheManager.get_or_set(
        cache_key,
        lambda: User.query.all(),
        expired=300  # 5分钟
    )
    return render_template("system/ticket/add.html", users=users)


# 工单数据
@bp.get("/table")
@authorize("system:ticket:main")
def table_data():
    query = Ticket.query.with_entities(
        Ticket.id,
        Ticket.title,
        Ticket.description,
        Ticket.priority,
        Ticket.status,
        Ticket.assignee_name,
        Ticket.photo_ids,
        Ticket.image_references_str,
        Ticket.impact_scope,
        Ticket.relatedinfo,
        Ticket.solution,
        Ticket.security_level,
        Ticket.threat_type,
        Ticket.attack_source,
        Ticket.attack_target,
        Ticket.vulnerability_name,
        Ticket.cvss_score,
        Ticket.ioc_indicators,
        Ticket.containment_measures,
        Ticket.eradication_measures,
        Ticket.recovery_measures,
        Ticket.lessons_learned,
        Ticket.compliance_requirements,
        Ticket.is_gdpr_compliant,
        Ticket.is_ccpa_compliant,
        Ticket.other_compliance,
        Ticket.service_method,
        Ticket.appointment_time,
        Ticket.engineer_id,
        Ticket.product_type_level1,
        Ticket.product_type_level2,
        Ticket.version_number,
        Ticket.serial_number,
        Ticket.is_out_of_warranty,
        Ticket.order_time,
        Ticket.completion_time,
        Ticket.problem_classification_main,
        Ticket.problem_classification_sub,
        Ticket.problem_classification_tags,
        Ticket.problem_tags,
        Ticket.create_time,
        Ticket.update_time,
        Ticket.customer_agent_name,
    )

    keyword = str_escape(request.args.get("keyword", ""))
    if keyword:
        try:
            ticket_id = int(keyword)
            query = query.filter(Ticket.id == ticket_id)
        except ValueError:
            query = query.filter(Ticket.title.like(f"%{keyword}%"))

    mf = _build_ticket_query_filters(request.args)
    query = query.filter(mf.get_filter(Ticket))

    data, count, page, limit = query.order_by(
        desc(Ticket.create_time)
    ).layui_paginate_db_json()

    processed_data = _process_ticket_data(data)

    return table_api(data=processed_data, count=count)


# 保存工单 (新增)
@bp.post("/save")
@authorize("system:ticket:add")
@operation_log(lambda: f"新增工单 -> ID: {g.ticket_id}, 标题: {g.ticket_title}")
def save():
    # 添加详细日志记录
    current_app.logger.info(f"接收到工单保存请求")
    current_app.logger.info(f"请求方法: {request.method}")
    current_app.logger.info(f"请求URL: {request.url}")

    # 检查用户认证状态
    if current_user.is_authenticated:
        current_app.logger.info(
            f"当前用户已认证: {current_user.username}, ID: {current_user.id}"
        )
    else:
        current_app.logger.warning("当前用户未认证")

    try:
        req_json = request.get_json(force=True)
        current_app.logger.info(f"请求数据: {req_json}")
    except Exception as e:
        current_app.logger.error(f"解析请求数据失败: {str(e)}")
        current_app.logger.error(f"原始请求数据: {request.get_data(as_text=True)}")
        return fail_api(msg="请求数据格式错误")

    # 处理图片信息
    image_references_str_description = req_json.get("image_references_str_description")
    image_references_str_relatedinfo = req_json.get("image_references_str_relatedinfo")
    image_references_str_solution = req_json.get("image_references_str_solution")

    # 使用辅助函数提取图片ID
    photo_ids_json_description = _extract_photo_ids(image_references_str_description)
    photo_ids_json_relatedinfo = _extract_photo_ids(image_references_str_relatedinfo)
    photo_ids_json_solution = _extract_photo_ids(image_references_str_solution)

    # Logging for debugging
    current_app.logger.info(f"Photo IDs for description: {photo_ids_json_description}")
    current_app.logger.info(f"Photo IDs for relatedinfo: {photo_ids_json_relatedinfo}")
    current_app.logger.info(f"Photo IDs for solution: {photo_ids_json_solution}")

    # 使用辅助函数合并图片引用和图片ID
    combined_image_references_str, final_photo_ids_json = _combine_image_references(
        image_references_str_description,
        image_references_str_relatedinfo,
        image_references_str_solution,
    )

    current_app.logger.info(
        f"Final combined photo_ids for new ticket: {final_photo_ids_json}"
    )

    try:
        # 检查必要字段
        required_fields = ["title", "description", "priority"]
        missing_fields = [
            field
            for field in required_fields
            if field not in req_json or not req_json[field]
        ]
        if missing_fields:
            current_app.logger.warning(f"缺少必要字段: {missing_fields}")

        # 获取服务方式并确定流程类型和模式
        service_method = str_escape(req_json.get("service_method"))

        # 如果没有提供service_method，设置默认值为"远程"
        if not service_method:
            service_method = "远程"
            current_app.logger.warning(
                f"工单未提供service_method，使用默认值: {service_method}"
            )

        current_app.logger.info(
            f"工单标题: {req_json.get('title')}, 工单状态: {req_json.get('status', '创建/提交')}"
        )
        current_app.logger.info(f"服务方式: {service_method}")

        flow_type = TicketFlowService.determine_flow_type(service_method)
        current_app.logger.info(f"确定的流程类型: {flow_type}")

        # 获取工单状态，默认为'创建/提交'
        ticket_status = str_escape(req_json.get("status", "创建/提交"))
        # 如果str_escape返回None（空字符串情况），使用默认值
        if ticket_status is None:
            ticket_status = "创建/提交"
            current_app.logger.warning(f"工单状态为None，使用默认值: {ticket_status}")
        flow_mode = TicketFlowService.determine_flow_mode(
            service_method, None, ticket_status
        )
        current_app.logger.info(f"确定的流程模式: {flow_mode}")

        # 确定业务恢复状态：如果状态为"已解决"或"已关闭"，则默认为已恢复
        business_recovered = req_json.get("business_recovered")
        if business_recovered is None or business_recovered == "":
            # 如果前端未传递business_recovered字段，根据状态自动设置
            business_recovered = ticket_status == "已解决" or ticket_status == "已关闭"
        else:
            # 如果前端传递了business_recovered字段，转换为布尔值
            business_recovered = (
                business_recovered == True
                or business_recovered == "on"
                or business_recovered == "true"
            )
        current_app.logger.info(f"业务恢复状态: {business_recovered}")

        # 确保flow_mode不为空
        if not flow_mode or flow_mode == "未知模式":
            flow_mode = "创建/提交工单"  # 设置默认的流程模式
            current_app.logger.warning(
                f"Setting default flow_mode: {flow_mode} for service_method: {service_method}"
            )

        # 创建新工单，包含所有字段
        current_app.logger.info("开始创建工单对象")
        new_ticket = Ticket(
            # 基本字段
            title=str_escape(req_json.get("title")),
            description=req_json.get("description"),
            priority=str_escape(req_json.get("priority")),
            status=ticket_status,  # 从表单获取status，默认为'创建/提交'
            assignee_name=str_escape(
                req_json.get("assignee_name")
            ),  # 从表单获取assignee_name
            business_recovered=business_recovered,  # 业务恢复状态
            photo_ids=final_photo_ids_json,  # 存储合并后的图片ID
            image_references_str=combined_image_references_str,  # Store the combined raw string
            image_references_str_description=image_references_str_description,
            image_references_str_relatedinfo=image_references_str_relatedinfo,
            image_references_str_solution=image_references_str_solution,
            # 服务方式相关字段
            service_method=service_method,
            flow_type=flow_type,
            flow_mode=flow_mode,
            appointment_time=_process_datetime_field(req_json.get("appointment_time")),
            engineer_id=str_escape(req_json.get("engineer_id")),
            # 产品信息字段
            product_type_level1=str_escape(req_json.get("product_type_level1")),
            product_type_level2=str_escape(req_json.get("product_type_level2")),
            version_number=str_escape(req_json.get("version_number")),
            serial_number=str_escape(req_json.get("serial_number")),
            customer_agent_name=str_escape(req_json.get("customer_agent_name")),
            # 保修和时间字段
            is_out_of_warranty=req_json.get("is_out_of_warranty") == "on"
            or req_json.get("is_out_of_warranty") == True,
            order_time=_process_datetime_field(req_json.get("order_time"))
            or datetime.now(),
            completion_time=_process_datetime_field(req_json.get("completion_time")),
            # 问题分类字段
            problem_classification_main=str_escape(
                req_json.get("problem_classification_main")
            ),
            problem_classification_sub=str_escape(
                req_json.get("problem_classification_sub")
            ),
            problem_classification_tags=str_escape(
                req_json.get("problem_tags")
            ),  # 使用正确的字段名
            problem_tags=str_escape(
                req_json.get("problem_tags")
            ),  # 保留旧字段名以确保兼容性
            user_id=current_user.id
            if current_user.is_authenticated
            else None,  # 记录创建者ID
        )
        try:
            # 获取当前用户的部门信息
            user_dept = None
            if (
                current_user.is_authenticated
                and hasattr(current_user, "dept_id")
                and current_user.dept_id
            ):
                user_dept = Dept.query.get(current_user.dept_id)

            # 先保存工单到数据库，确保获取到ID
            db.session.add(new_ticket)
            db.session.flush()  # 获取ID但不提交整个事务
            current_app.logger.info(
                f"工单保存成功: ID={new_ticket.id}, Title={new_ticket.title}"
            )

            # 创建初始流程记录
            current_app.logger.info(
                f"创建初始流程记录，工单ID: {new_ticket.id}, 流程类型: {flow_type}, 流程模式: {flow_mode}"
            )
            _create_ticket_flow(
                new_ticket.id, flow_type, flow_mode, ticket_status, user_dept
            )

            # 提交工单
            db.session.commit()

            # 初始化工单SLA时间
            _initialize_ticket_sla(new_ticket)

            g.ticket_id = new_ticket.id  # 将新工单ID存入g对象
            g.ticket_title = new_ticket.title  # 将新工单标题存入g对象
            current_app.logger.info(
                f"Ticket created successfully: ID={new_ticket.id}, Title={new_ticket.title}"
            )
            return success_api(msg="新增工单成功")
        except Exception as e:
            current_app.logger.error(f"保存工单时发生错误: {str(e)}")
            import traceback

            current_app.logger.error(traceback.format_exc())
            db.session.rollback()
            # 返回更详细的错误信息，但不泄露敏感信息
            return fail_api(msg=f"新增工单失败: {str(e)}")
    except Exception as e:
        current_app.logger.error(f"保存工单时发生错误: {str(e)}")
        import traceback

        current_app.logger.error(traceback.format_exc())
        db.session.rollback()
        # 返回更详细的错误信息，但不泄露敏感信息
        return fail_api(msg=f"新增工单失败: {str(e)}")


# 查看工单详情界面
@bp.get("/view/<int:ticket_id>")
def view_view(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return render_template("errors/404.html"), 404

    if ticket:
        try:
            # 手动计算 is_overdue 和 overdue_hours
            ticket.is_overdue = False
            ticket.overdue_hours = 0
            if ticket.create_time and ticket.status not in ["已关闭", "已解决"]:
                try:
                    # 确保 create_time 是 datetime 对象
                    dt_create_time = ticket.create_time
                    # 检查创建时间是否在过去
                    if dt_create_time <= datetime.now():
                        time_difference = datetime.now() - dt_create_time
                        if time_difference > timedelta(days=1):
                            ticket.is_overdue = True
                            ticket.overdue_hours = int(
                                time_difference.total_seconds() / 3600
                            )
                except Exception as e:
                    current_app.logger.error(
                        f"Error calculating overdue status for ticket {ticket.id} in view_view: {e}"
                    )
        except Exception as e:
            current_app.logger.error(
                f"Error calculating overdue status for ticket {ticket.id} in view_view: {e}"
            )

    return render_template("system/ticket/view.html", ticket=ticket)


# 编辑工单界面
@bp.get("/edit/<int:ticket_id>")
@authorize("system:ticket:edit")
def edit_view(ticket_id):
    ticket = db.session.get(
        Ticket, ticket_id
    )  # 使用 db.session.get 替代 get_one_by_id 如果适用
    if not ticket:
        # return fail_api(msg="工单不存在") # This would return JSON, but template expects HTML
        return render_template("errors/404.html"), 404  # Or a specific error page

    # 手动计算 is_overdue 和 overdue_hours for edit_view
    ticket.is_overdue = False
    ticket.overdue_hours = 0
    if ticket.create_time and ticket.status not in ["已关闭", "已解决"]:
        try:
            # 确保 create_time 是 datetime 对象
            dt_create_time = ticket.create_time
            # 检查创建时间是否在过去
            if dt_create_time <= datetime.now():
                time_difference = datetime.now() - dt_create_time
                if time_difference > timedelta(days=1):
                    ticket.is_overdue = True
                    ticket.overdue_hours = int(time_difference.total_seconds() / 3600)
        except Exception as e:
            current_app.logger.error(
                f"Error calculating overdue status for ticket {ticket.id} in edit_view: {e}"
            )

    # 检查是否为负责人标志
    is_assignee = request.args.get("is_assignee") == "true"

    # 权限检查：管理员可以编辑任何工单，其他用户只能编辑自己创建的工单或自己负责的工单
    # 如果工单状态为"未完成-研发原因"，研发部门成员也可以编辑
    is_rd_dept_member = False
    is_quality_dept_member = False
    if current_user.dept_id:
        from applications.models import Dept

        user_dept = Dept.query.get(current_user.dept_id)
        if user_dept:
            if "研发" in user_dept.dept_name or "开发" in user_dept.dept_name:
                is_rd_dept_member = True
            if (
                "质量" in user_dept.dept_name
                or "质检" in user_dept.dept_name
                or "品控" in user_dept.dept_name
            ):
                is_quality_dept_member = True

    if current_user.username == "admin":
        # 管理员可以编辑任何工单
        pass  # 允许继续执行
    # 用户可以编辑自己创建的工单
    elif (
        hasattr(ticket, "user_id")
        and ticket.user_id
        and ticket.user_id == current_user.id
    ):
        pass  # 允许继续执行
    # 用户可以编辑自己负责的工单
    elif (
        hasattr(ticket, "assignee_name")
        and ticket.assignee_name
        and ticket.assignee_name == current_user.username
    ):
        pass  # 允许继续执行
    # 检查前端传递的是否为负责人标志
    elif is_assignee:
        # 前端已确认用户是负责人，允许编辑
        current_app.logger.info(
            f"User {current_user.username} viewing edit page for ticket ID {ticket_id} as assignee"
        )
        pass  # 允许继续执行
    # 研发部门成员可以编辑状态为"未完成-研发原因"的工单
    elif is_rd_dept_member and ticket.status == "未完成-研发原因":
        current_app.logger.info(
            f"R&D department member {current_user.username} viewing edit page for ticket ID {ticket_id} with status '未完成-研发原因'"
        )
        pass  # 允许继续执行
    # 研发部门成员可以编辑状态为"暂时规避"且问题分类为特定类型的工单
    elif (
        is_rd_dept_member
        and ticket.status == "暂时规避"
        and ticket.problem_classification_main
    ):
        # 检查问题分类是否包含研发相关的关键词
        problem_classification = ticket.problem_classification_main
        if isinstance(problem_classification, str):
            problem_classification_lower = problem_classification.lower()
        else:
            problem_classification_lower = str(problem_classification).lower()

        # 定义研发相关的问题分类关键词
        rd_keywords = ["软件bug-新bug需研发提供升级包", "bug开发中", "死机问题"]
        is_rd_related = any(
            keyword in problem_classification_lower for keyword in rd_keywords
        )

        if is_rd_related:
            current_app.logger.info(
                f"R&D department member {current_user.username} viewing edit page for ticket ID {ticket_id} with status '暂时规避' and R&D related problem classification: {problem_classification}"
            )
            pass  # 允许继续执行
        else:
            current_app.logger.warning(
                f"R&D department member {current_user.username} attempted to edit ticket ID {ticket_id} with status '暂时规避' but problem classification is not R&D related: {problem_classification}"
            )
            try:
                return render_template("errors/403.html"), 403
            except:
                return (
                    "<h1>403 Forbidden</h1><p>您没有权限编辑此工单（暂时规避状态的工单需要问题分类为研发相关类型）</p>",
                    403,
                )
    # 质量部权限：检查是否在业务恢复阶段且状态为"未完成-生产原因"，或在彻底修复阶段且问题分类符合质量部责任
    elif is_quality_dept_member and (
        (ticket.status == "未完成-生产原因")
        or (
            ticket.problem_classification_main
            and (
                "软件bug-需寄回升级包" in ticket.problem_classification_main
                or "硬件" in ticket.problem_classification_main
            )
        )
    ):
        current_app.logger.info(
            f"Quality department member {current_user.username} viewing edit page for ticket ID {ticket_id}"
        )
        pass  # 允许继续执行
    else:
        current_app.logger.warning(
            f"User {current_user.username} attempted to edit ticket ID {ticket_id} without permission"
        )
        # 检查403页面是否存在，如果不存在则返回简单的错误信息
        try:
            return render_template("errors/403.html"), 403
        except:
            return "<h1>403 Forbidden</h1><p>您没有权限编辑此工单</p>", 403

    users = User.query.all()

    if ticket:
        # 手动计算 is_overdue 和 overdue_hours
        ticket.is_overdue = False
        ticket.overdue_hours = 0
        if ticket.create_time and ticket.status not in ["已关闭", "已解决"]:
            try:
                # 确保 create_time 是 datetime 对象
                dt_create_time = ticket.create_time
                # 检查创建时间是否在过去
                if dt_create_time <= datetime.now():
                    time_difference = datetime.now() - dt_create_time
                    if time_difference > timedelta(days=1):
                        ticket.is_overdue = True
                        ticket.overdue_hours = int(
                            time_difference.total_seconds() / 3600
                        )
            except Exception as e:
                current_app.logger.error(
                    f"Error calculating overdue status for ticket {ticket.id} in edit_view: {e}"
                )

    # 将ticket对象转换为字典，以便在模板中使用
    # ticket_data 现在会包含 is_overdue 和 overdue_hours (如果 TicketSchema 配置了序列化这些字段)
    # 但模板 edit.html 直接使用 ticket.is_overdue 和 ticket.overdue_hours，所以上面的动态添加是关键
    ticket_data = {}
    if ticket:
        # 重新 dump 以便 ticket_data_json 也可能包含这些（取决于 schema）
        ticket_schema = TicketSchema()
        ticket_data = ticket_schema.dump(ticket)

        # 处理日期字段，将ISO格式转换为常规格式
        date_fields = [
            "appointment_time",
            "order_time",
            "completion_time",
            "create_time",
            "update_time",
        ]
        for field in date_fields:
            if (
                field in ticket_data
                and ticket_data[field]
                and isinstance(ticket_data[field], str)
            ):
                if "T" in ticket_data[field]:
                    ticket_data[field] = (
                        ticket_data[field].replace("T", " ").split(".")[0]
                    )  # 去除可能的毫秒部分

    return render_template(
        "system/ticket/edit.html",
        ticket=ticket,
        ticket_data_json=ticket_data,
        users=users,
    )


# 从add.html加载数据到edit.html
@bp.post("/load_add_data_to_edit")
@authorize("system:ticket:add")
def load_add_data_to_edit():
    # 获取add.html提交的表单数据
    add_form_data = request.get_json(force=True)

    # 处理日期字段，将ISO格式转换为常规格式
    date_fields = ["appointment_time", "order_time", "completion_time"]
    for field in date_fields:
        if (
            field in add_form_data
            and add_form_data[field]
            and isinstance(add_form_data[field], str)
        ):
            if "T" in add_form_data[field]:
                add_form_data[field] = (
                    add_form_data[field].replace("T", " ").split(".")[0]
                )  # 去除可能的毫秒部分

    # 创建一个新的工单对象，但不保存到数据库
    ticket = None

    # 将表单数据传递给edit.html模板
    return render_template(
        "system/ticket/edit.html", ticket=ticket, add_form_data=add_form_data
    )


# 更新工单
@bp.post("/update")  # 通常使用 PUT，但前端 AJAX 使用 POST
@authorize("system:ticket:edit")
@operation_log(
    lambda: (
        f"更新工单 -> ID: {g.ticket_id}, 标题: {g.ticket_title}\n变更内容: {g.change_info}"
    )
)
def update():
    """更新工单"""
    req_json = request.json
    if not req_json:
        return fail_api(msg="请求参数不能为空")

    ticket_id = req_json.get("id")
    if not ticket_id:
        return fail_api(msg="工单ID缺失")

    ticket = Ticket.query.get_or_404(ticket_id)

    # 检查用户是否有权限编辑此工单
    # 管理员可以编辑所有工单
    if current_user.username == "admin":
        pass  # 管理员有全部权限
    # 普通用户只能编辑自己创建的工单或自己负责的工单
    elif (ticket.user_id and ticket.user_id == current_user.id) or (
        ticket.assignee_name and ticket.assignee_name == current_user.username
    ):
        pass  # 用户有权限编辑自己的工单或负责的工单
    # 研发部门成员可以编辑状态为"未完成-研发原因"的工单
    elif ticket.status == "未完成-研发原因":
        # 检查用户是否属于研发部门
        is_rd_dept_member = False
        if current_user.dept_id:
            from applications.models import Dept

            dept = Dept.query.get(current_user.dept_id)
            if dept and ("研发" in dept.dept_name or "开发" in dept.dept_name):
                is_rd_dept_member = True

        if not is_rd_dept_member:
            return fail_api(
                msg="权限不足：只有研发部门成员可以编辑状态为'未完成-研发原因'的工单"
            )
    # 研发部门成员可以编辑状态为"暂时规避"且问题分类为特定类型的工单
    elif ticket.status == "暂时规避" and ticket.problem_classification_main:
        # 检查用户是否属于研发部门
        is_rd_dept_member = False
        if current_user.dept_id:
            from applications.models import Dept

            dept = Dept.query.get(current_user.dept_id)
            if dept and ("研发" in dept.dept_name or "开发" in dept.dept_name):
                is_rd_dept_member = True

        if not is_rd_dept_member:
            return fail_api(
                msg="权限不足：只有研发部门成员可以编辑状态为'暂时规避'的工单"
            )

        # 检查问题分类是否包含研发相关的关键词
        problem_classification = ticket.problem_classification_main
        if isinstance(problem_classification, str):
            problem_classification_lower = problem_classification.lower()
        else:
            problem_classification_lower = str(problem_classification).lower()

        # 定义研发相关的问题分类关键词
        rd_keywords = ["软件bug-新bug需研发提供升级包", "bug开发中", "死机问题"]
        is_rd_related = any(
            keyword in problem_classification_lower for keyword in rd_keywords
        )

        if not is_rd_related:
            return fail_api(
                msg="权限不足：暂时规避状态的工单需要问题分类为研发相关类型（软件bug-新bug需研发提供升级包、bug开发中、死机问题）"
            )
    # 质量部权限：检查是否在业务恢复阶段且状态为"未完成-生产原因"，或在彻底修复阶段且问题分类符合质量部责任
    elif (ticket.status == "未完成-生产原因") or (
        ticket.problem_classification_main
        and (
            "软件bug-需寄回升级包" in ticket.problem_classification_main
            or "硬件" in ticket.problem_classification_main
        )
    ):
        # 检查用户是否属于质量部门
        is_quality_dept_member = False
        if current_user.dept_id:
            from applications.models import Dept

            dept = Dept.query.get(current_user.dept_id)
            if dept and (
                "质量" in dept.dept_name
                or "质检" in dept.dept_name
                or "品控" in dept.dept_name
            ):
                is_quality_dept_member = True

        if not is_quality_dept_member:
            return fail_api(msg="权限不足：只有质量部门成员可以编辑此类工单")
    else:
        return fail_api(msg="权限不足：您只能编辑自己创建的工单或自己负责的工单")

    # --- 开始记录变更 ---
    # 字段名到中文标签的映射
    field_to_label = {
        "title": "标题",
        "priority": "优先级",
        "description": "详细描述",
        "status": "工单状态",
        "assignee_name": "负责人",
        "service_method": "响应方式",
        "appointment_time": "预约时间",
        "engineer_id": "工程师ID",
        "product_type_level1": "产品类型",
        "product_type_level2": "产品二级分类",
        "version_number": "版本号",
        "serial_number": "序列号",
        "customer_agent_name": "客户/代理商名称",
        "is_out_of_warranty": "是否过保",
        "order_time": "接单时间",
        "completion_time": "完成时间",
        "problem_classification_main": "问题分类",
        "problem_classification_sub": "问题子分类",
        "problem_tags": "问题标签",
        "relatedinfo": "处理记录",
        "solution": "处理方案",
        "impact_scope": "影响范围",
        "security_level": "安全级别",
        "threat_type": "威胁类型",
        "attack_source": "攻击来源",
        "attack_target": "攻击目标",
        "vulnerability_name": "漏洞名称",
        "cvss_score": "CVSS评分",
        "ioc_indicators": "IOC指标",
        "containment_measures": "遏制措施",
        "eradication_measures": "根除措施",
        "recovery_measures": "恢复措施",
        "lessons_learned": "经验总结",
    }

    mapper = inspect(Ticket)
    change_info = []
    # 存储原始值，用于比较
    original_data = {c.key: getattr(ticket, c.key) for c in mapper.attrs}

    # 逐个比较字段
    for key, new_value in req_json.items():
        # 跳过id和无需比较的字段
        if key in [
            "id",
            "image_references_str_description",
            "image_references_str_relatedinfo",
            "image_references_str_solution",
        ]:
            continue

        old_value = original_data.get(key)

        # 对日期等特殊字段进行格式化以正确比较
        if isinstance(old_value, datetime):
            old_value = old_value.strftime("%Y-%m-%d %H:%M:%S")

        # 如果新旧值一个是None另一个是空字符串，则认为它们相等，不记录变更
        if (old_value is None and new_value == "") or (
            old_value == "" and new_value is None
        ):
            continue

        # 如果值不同，记录变更
        if str(old_value) != str(new_value):
            label = field_to_label.get(
                key, key
            )  # 获取中文标签，如果不存在则使用原字段名
            change_info.append(f"字段[{label}]:'{old_value}' -> '{new_value}'")

    # 将变更信息存入g对象
    g.ticket_id = ticket.id
    g.ticket_title = ticket.title
    g.change_info = "\n".join(change_info) if change_info else "无内容变更"
    # --- 变更记录结束 ---

    # 后端验证：完成时间不能早于接单时间
    order_time_str = req_json.get("order_time")
    completion_time_str = req_json.get("completion_time")

    if order_time_str and completion_time_str:
        try:
            order_time = datetime.strptime(order_time_str, "%Y-%m-%d %H:%M:%S")
            completion_time = datetime.strptime(
                completion_time_str, "%Y-%m-%d %H:%M:%S"
            )
            if completion_time < order_time:
                return fail_api(msg="保存失败：完成时间不能早于接单时间")
        except ValueError:
            return fail_api(msg="日期格式不正确，应为 YYYY-MM-DD HH:MM:SS")

    # 定义一个内部函数来处理图片ID的提取
    def extract_photo_ids(image_references_str):
        if not image_references_str:
            return []
        try:
            photo_ids = []
            image_marks = image_references_str.strip().split("\n@@IMAGE_SEPARATOR@@\n")
            for mark in image_marks:
                if mark:
                    match = re.search(r"#id=([^\)]+)", mark)
                    if match:
                        photo_ids.append(match.group(1))
            return photo_ids
        except Exception as e:
            current_app.logger.error(
                f"Error processing image_references_str for update: {e}"
            )
            return []

    # 处理图片信息
    image_references_str_description = req_json.get(
        "image_references_str_description",
        ticket.image_references_str_description
        if hasattr(ticket, "image_references_str_description")
        else None,
    )
    image_references_str_relatedinfo = req_json.get(
        "image_references_str_relatedinfo",
        ticket.image_references_str_relatedinfo
        if hasattr(ticket, "image_references_str_relatedinfo")
        else None,
    )
    image_references_str_solution = req_json.get(
        "image_references_str_solution",
        ticket.image_references_str_solution
        if hasattr(ticket, "image_references_str_solution")
        else None,
    )

    photo_ids_description = extract_photo_ids(image_references_str_description)
    photo_ids_relatedinfo = extract_photo_ids(image_references_str_relatedinfo)
    photo_ids_solution = extract_photo_ids(image_references_str_solution)

    all_photo_ids_update = []
    all_photo_ids_update.extend(photo_ids_description)
    all_photo_ids_update.extend(photo_ids_relatedinfo)
    all_photo_ids_update.extend(photo_ids_solution)

    if all_photo_ids_update:
        ticket.photo_ids = json.dumps(list(set(all_photo_ids_update)))
        current_app.logger.info(f"Updated combined photo IDs: {ticket.photo_ids}")
    else:
        ticket.photo_ids = None

    # Update the individual reference string fields
    ticket.image_references_str_description = image_references_str_description
    ticket.image_references_str_relatedinfo = image_references_str_relatedinfo
    ticket.image_references_str_solution = image_references_str_solution

    # Combine them for the old `image_references_str` field if it's still used or for backward compatibility
    combined_image_references_str_update = ""
    if image_references_str_description:
        combined_image_references_str_update += (
            image_references_str_description + "\n@@IMAGE_SEPARATOR@@\n"
        )
    if image_references_str_relatedinfo:
        combined_image_references_str_update += (
            image_references_str_relatedinfo + "\n@@IMAGE_SEPARATOR@@\n"
        )
    if image_references_str_solution:
        combined_image_references_str_update += (
            image_references_str_solution + "\n@@IMAGE_SEPARATOR@@\n"
        )
    ticket.image_references_str = combined_image_references_str_update.strip()

    try:
        # 更新基本字段
        # 在update方法中添加客户/代理商名称处理
        ticket.customer_agent_name = str_escape(
            req_json.get(
                "customer_agent_name",
                ticket.customer_agent_name
                if hasattr(ticket, "customer_agent_name")
                else "",
            )
        )

        # 添加标题和优先级的更新逻辑（新增代码）
        ticket.title = str_escape(req_json.get("title", ticket.title))
        ticket.priority = str_escape(req_json.get("priority", ticket.priority))

        # 获取旧状态和新状态
        old_status = ticket.status
        new_status = str_escape(req_json.get("status", ticket.status))
        ticket.status = new_status  # 更新工单状态

        # 处理业务恢复状态：如果状态为"已解决"或"已关闭"，则默认为已恢复
        business_recovered = req_json.get("business_recovered")
        if business_recovered is None or business_recovered == "":
            # 如果前端未传递business_recovered字段，根据状态自动设置
            business_recovered = new_status == "已解决" or new_status == "已关闭"
        else:
            # 如果前端传递了business_recovered字段，转换为布尔值
            business_recovered = (
                business_recovered == True
                or business_recovered == "on"
                or business_recovered == "true"
            )
        ticket.business_recovered = business_recovered
        current_app.logger.info(
            f"更新工单 - 状态: {old_status} -> {new_status}, 业务恢复: {business_recovered}"
        )

        ticket.assignee_name = str_escape(
            req_json.get("assignee_name", ticket.assignee_name)
        )

        # 更新服务方式相关字段
        ticket.service_method = str_escape(
            req_json.get(
                "service_method",
                ticket.service_method if hasattr(ticket, "service_method") else None,
            )
        )

        # 如果服务方式发生变化，更新流程类型和模式
        if ticket.service_method != req_json.get("service_method"):
            ticket.flow_type = TicketFlowService.determine_flow_type(
                ticket.service_method
            )
            ticket.flow_mode = TicketFlowService.determine_flow_mode(
                ticket.service_method, None, new_status
            )

        raw_appointment_time = req_json.get("appointment_time")
        ticket.appointment_time = (
            datetime.strptime(raw_appointment_time, "%Y-%m-%d %H:%M:%S")
            if raw_appointment_time
            else (
                ticket.appointment_time if hasattr(ticket, "appointment_time") else None
            )
        )
        ticket.engineer_id = str_escape(
            req_json.get(
                "engineer_id",
                ticket.engineer_id if hasattr(ticket, "engineer_id") else None,
            )
        )
        # 更新产品信息字段
        ticket.product_type_level1 = str_escape(
            req_json.get(
                "product_type_level1",
                ticket.product_type_level1
                if hasattr(ticket, "product_type_level1")
                else None,
            )
        )
        ticket.product_type_level2 = str_escape(
            req_json.get(
                "product_type_level2",
                ticket.product_type_level2
                if hasattr(ticket, "product_type_level2")
                else None,
            )
        )
        ticket.version_number = str_escape(
            req_json.get(
                "version_number",
                ticket.version_number if hasattr(ticket, "version_number") else None,
            )
        )
        ticket.serial_number = str_escape(
            req_json.get(
                "serial_number",
                ticket.serial_number if hasattr(ticket, "serial_number") else None,
            )
        )
        ticket.product_name = str_escape(
            req_json.get(
                "product_name",
                ticket.product_name if hasattr(ticket, "product_name") else None,
            )
        )

        # 更新保修和时间字段
        is_out_of_warranty_val = req_json.get("is_out_of_warranty")
        ticket.is_out_of_warranty = (
            is_out_of_warranty_val == "on"
            or is_out_of_warranty_val == True
            or is_out_of_warranty_val == "true"
        )

        raw_order_time = req_json.get("order_time")
        ticket.order_time = (
            datetime.strptime(raw_order_time, "%Y-%m-%d %H:%M:%S")
            if raw_order_time
            else (ticket.order_time if hasattr(ticket, "order_time") else None)
        )

        raw_completion_time = req_json.get("completion_time")
        # 只有当状态从其他状态变更为"已关闭"时，才自动更新完成时间为当前时间
        if old_status != "已关闭" and new_status == "已关闭":
            ticket.completion_time = datetime.now()
        # 如果状态从"已关闭"变更为其他状态，则清空完成时间
        elif old_status == "已关闭" and new_status != "已关闭":
            ticket.completion_time = None
        else:
            ticket.completion_time = (
                datetime.strptime(raw_completion_time, "%Y-%m-%d %H:%M:%S")
                if raw_completion_time
                else (
                    ticket.completion_time
                    if hasattr(ticket, "completion_time")
                    else None
                )
            )

        # 更新问题分类字段
        ticket.problem_classification_main = str_escape(
            req_json.get(
                "problem_classification_main",
                ticket.problem_classification_main
                if hasattr(ticket, "problem_classification_main")
                else None,
            )
        )
        ticket.problem_classification_sub = str_escape(
            req_json.get(
                "problem_classification_sub",
                ticket.problem_classification_sub
                if hasattr(ticket, "problem_classification_sub")
                else None,
            )
        )
        ticket.problem_classification_tags = str_escape(
            req_json.get(
                "problem_classification_tags",
                ticket.problem_classification_tags
                if hasattr(ticket, "problem_classification_tags")
                else None,
            )
        )
        ticket.problem_tags = req_json.get(
            "problem_tags",
            ticket.problem_tags if hasattr(ticket, "problem_tags") else None,
        )

        # 更新问题分析与处理过程字段
        ticket.relatedinfo = req_json.get(
            "relatedinfo",
            ticket.relatedinfo if hasattr(ticket, "relatedinfo") else None,
        )
        ticket.solution = req_json.get(
            "solution", ticket.solution if hasattr(ticket, "solution") else None
        )
        ticket.impact_scope = req_json.get(
            "impact_scope",
            ticket.impact_scope if hasattr(ticket, "impact_scope") else None,
        )
        ticket.security_level = req_json.get(
            "security_level",
            ticket.security_level if hasattr(ticket, "security_level") else None,
        )
        ticket.threat_type = req_json.get(
            "threat_type",
            ticket.threat_type if hasattr(ticket, "threat_type") else None,
        )
        ticket.attack_source = req_json.get(
            "attack_source",
            ticket.attack_source if hasattr(ticket, "attack_source") else None,
        )
        ticket.attack_target = req_json.get(
            "attack_target",
            ticket.attack_target if hasattr(ticket, "attack_target") else None,
        )
        ticket.vulnerability_name = str_escape(
            req_json.get(
                "vulnerability_name",
                ticket.vulnerability_name
                if hasattr(ticket, "vulnerability_name")
                else None,
            )
        )
        ticket.cvss_score = req_json.get(
            "cvss_score", ticket.cvss_score if hasattr(ticket, "cvss_score") else None
        )
        ticket.ioc_indicators = str_escape(
            req_json.get(
                "ioc_indicators",
                ticket.ioc_indicators if hasattr(ticket, "ioc_indicators") else None,
            )
        )
        ticket.containment_measures = str_escape(
            req_json.get(
                "containment_measures",
                ticket.containment_measures
                if hasattr(ticket, "containment_measures")
                else None,
            )
        )
        ticket.eradication_measures = str_escape(
            req_json.get(
                "eradication_measures",
                ticket.eradication_measures
                if hasattr(ticket, "eradication_measures")
                else None,
            )
        )
        ticket.recovery_measures = req_json.get(
            "recovery_measures",
            ticket.recovery_measures if hasattr(ticket, "recovery_measures") else None,
        )
        ticket.lessons_learned = req_json.get(
            "lessons_learned",
            ticket.lessons_learned if hasattr(ticket, "lessons_learned") else None,
        )
        # 更新详细记录字段
        ticket.description = req_json.get(
            "description",
            ticket.description if hasattr(ticket, "description") else None,
        )

        # 统一处理所有流程记录更新，避免重复创建多个节点
        # 检查是否有任何字段更新需要创建流程记录
        has_status_change = old_status != new_status

        # 检查问题分类是否发生变化
        old_problem_classification_main = (
            original_data.get("problem_classification_main", "") or ""
        )
        new_problem_classification_main = (
            req_json.get("problem_classification_main", "") or ""
        )
        old_problem_classification_sub = (
            original_data.get("problem_classification_sub", "") or ""
        )
        new_problem_classification_sub = (
            req_json.get("problem_classification_sub", "") or ""
        )

        problem_classification_changed = (
            old_problem_classification_main != new_problem_classification_main
            or old_problem_classification_sub != new_problem_classification_sub
        )

        if problem_classification_changed:
            current_app.logger.info(
                f"问题分类变化 - 主分类: '{old_problem_classification_main}' -> '{new_problem_classification_main}', 子分类: '{old_problem_classification_sub}' -> '{new_problem_classification_sub}'"
            )

        # 处理记录字段更新判断：只有当字段值真正发生变化时才认为更新
        relatedinfo_updated = False
        old_relatedinfo_value = ""
        new_relatedinfo_value = ""
        if "relatedinfo" in req_json:
            old_relatedinfo_value = original_data.get("relatedinfo", "") or ""
            new_relatedinfo_value = req_json["relatedinfo"] or ""
            relatedinfo_updated = old_relatedinfo_value != new_relatedinfo_value

        # 处置方案字段更新判断：只有当字段值真正发生变化时才认为更新
        solution_updated = False
        old_solution_value = ""
        new_solution_value = ""
        if "solution" in req_json:
            old_solution_value = original_data.get("solution", "") or ""
            new_solution_value = req_json["solution"] or ""
            solution_updated = old_solution_value != new_solution_value

        current_app.logger.info(f"Ticket object after update: {ticket.__dict__}")

        # 添加详细的流程节点创建判断日志
        current_app.logger.info(
            f"流程节点创建判断 - 状态变更: {has_status_change}, 处理记录更新: {relatedinfo_updated}, 处置方案更新: {solution_updated}"
        )
        if "relatedinfo" in req_json:
            current_app.logger.info(
                f"处理记录对比 - 原值: '{old_relatedinfo_value}', 新值: '{new_relatedinfo_value}', 是否变化: {relatedinfo_updated}"
            )
        if "solution" in req_json:
            current_app.logger.info(
                f"处置方案对比 - 原值: '{old_solution_value}', 新值: '{new_solution_value}', 是否变化: {solution_updated}"
            )

        # 先提交工单基本信息的更新
        # 先保存工单状态更新
        db.session.add(ticket)

        # 处理SLA状态变更逻辑
        if has_status_change:
            try:
                # 更新SLA时间计算
                SLAService.update_status_sla(ticket, old_status, new_status)
                current_app.logger.info(
                    f"工单SLA状态更新: ID={ticket_id}, 原状态={old_status}, 新状态={new_status}"
                )
            except Exception as sla_error:
                current_app.logger.error(f"工单SLA状态更新失败: {str(sla_error)}")
                # SLA更新失败不影响工单状态更新

        security_fields_updated = []
        security_fields = [
            "containment_measures",
            "eradication_measures",
            "recovery_measures",
        ]
        for field in security_fields:
            if field in req_json and req_json[field] != original_data.get(field):
                security_fields_updated.append(field)

        # 只有当工单状态、处理记录、处置方案、问题分类发生改变时才创建流程节点
        # 只监控这四个关键字段的变化
        if (
            has_status_change
            or relatedinfo_updated
            or solution_updated
            or problem_classification_changed
        ):
            try:
                # 后端防护：检查短时间内是否已有相同的更新记录
                # 防止重复提交导致的多条流程记录
                recent_flow = TicketFlow.query.filter(
                    TicketFlow.ticket_id == ticket_id,
                    TicketFlow.create_time >= datetime.now() - timedelta(seconds=10),
                    TicketFlow.handler == current_user.username,
                ).first()

                if not recent_flow:
                    # 获取当前用户的部门信息
                    handler_dept = None
                    if (
                        current_user
                        and hasattr(current_user, "dept_id")
                        and current_user.dept_id
                    ):
                        from applications.models import Dept

                        dept = Dept.query.get(current_user.dept_id)
                        if dept and hasattr(dept, "dept_name"):
                            handler_dept = dept.dept_name

                    # 构建备注信息，包含所有更新的内容
                    notes_parts = []

                    # 每次更新流程都显示处理记录和处置方案的当前内容
                    # 处理记录：显示当前值
                    current_relatedinfo = ticket.relatedinfo or ""
                    if current_relatedinfo:
                        notes_parts.append(f"处理记录: {current_relatedinfo}")
                    else:
                        notes_parts.append("处理记录: 无")

                    # 处置方案：显示当前值
                    current_solution = ticket.solution or ""
                    if current_solution:
                        notes_parts.append(f"处置方案: {current_solution}")
                    else:
                        notes_parts.append("处置方案: 无")

                    # 影响范围（已移除，不显示在流程记录中）
                    # if impact_scope_updated:
                    #     if req_json['impact_scope']:
                    #         notes_parts.append(f"影响范围: {req_json['impact_scope'][:100]}{'...' if len(req_json['impact_scope']) > 100 else ''}")
                    #     else:
                    #         notes_parts.append("影响范围: 无")

                    # 安全措施不再在流程记录中显示，只在字段更新时记录到变更日志

                    # 构建最终备注信息
                    final_notes = "\n".join(notes_parts) if notes_parts else ""

                    # 确定描述信息
                    if has_status_change:
                        description = "状态变更"
                    elif problem_classification_changed:
                        description = "问题分类变更"
                    elif relatedinfo_updated and solution_updated:
                        description = "处理记录和处置方案更新"
                    elif relatedinfo_updated:
                        description = "处理记录更新"
                    elif solution_updated:
                        description = "处置方案更新"
                    else:
                        description = "工单更新"

                    # 如果问题分类发生变化，添加到备注中
                    if problem_classification_changed:
                        classification_parts = []
                        if (
                            old_problem_classification_main
                            != new_problem_classification_main
                        ):
                            classification_parts.append(
                                f"主分类: {old_problem_classification_main or '无'} → {new_problem_classification_main or '无'}"
                            )
                        if (
                            old_problem_classification_sub
                            != new_problem_classification_sub
                        ):
                            classification_parts.append(
                                f"子分类: {old_problem_classification_sub or '无'} → {new_problem_classification_sub or '无'}"
                            )
                        classification_note = "问题分类变更: " + ", ".join(
                            classification_parts
                        )
                        if final_notes:
                            final_notes = classification_note + "\n" + final_notes
                        else:
                            final_notes = classification_note

                    TicketFlowService.add_flow_step_without_commit(
                        ticket_id=ticket.id,
                        from_status=old_status if has_status_change else new_status,
                        to_status=new_status,
                        handler=current_user.username,
                        department=handler_dept,
                        description=description,
                        notes=final_notes,
                    )

                    current_app.logger.info(
                        f"创建流程记录: 工单 {ticket_id} - {description}"
                    )
                else:
                    current_app.logger.warning(
                        f"避免重复创建流程记录: 工单 {ticket_id} 在10秒内已有更新记录"
                    )
            except Exception as flow_error:
                current_app.logger.error(
                    f"Error adding unified flow record for ticket {ticket_id}: {flow_error}"
                )

        # 一次性提交所有更改
        db.session.commit()

        current_app.logger.info(f"Ticket with ID {ticket_id} updated successfully.")
        return success_api(msg="更新工单成功")
    except Exception as e:
        # 只有在工单基本信息提交之前才需要回滚
        # 如果是在添加流程记录时出错，不需要回滚，因为工单基本信息已经提交成功
        current_app.logger.error(f"Error updating ticket {ticket_id}: {e}")
        return fail_api(msg="更新工单失败，请查看日志")


# 获取工单流程记录
@bp.get("/flow/<int:ticket_id>")
@authorize("system:ticket:main")
def get_ticket_flow(ticket_id):
    """获取工单的完整流程记录"""
    try:
        # 获取工单流程记录
        flows = TicketFlowService.get_ticket_flow(ticket_id)

        # 获取流程统计信息
        statistics = TicketFlowService.get_flow_statistics(ticket_id)

        # 获取关联的工单
        ticket = Ticket.query.get(ticket_id)

        # 先收集所有流程数据（不计算超时）
        flow_data = []
        has_temporary_solution = False

        for flow in flows:
            # 检查当前节点是否是暂时规避
            is_current_temporary_solution = flow.to_status == "暂时规避" or (
                flow.flow_mode and "临时" in flow.flow_mode
            )

            # 判断阶段
            if has_temporary_solution or is_current_temporary_solution:
                is_business_recovery_stage = False
                is_complete_fix_stage = True
            else:
                is_business_recovery_stage = flow.to_status in [
                    "未完成-客户原因",
                    "未完成-研发原因",
                    "未完成-生产原因",
                    "未完成-售后原因",
                    "处理中",
                ]
                is_complete_fix_stage = flow.to_status in ["已恢复", "已解决", "已关闭"]

            # 根据阶段确定SLA阈值
            if is_business_recovery_stage:
                priority_thresholds = {"P1": 8, "P2": 24, "P3": 48, "P4": 72}
                overdue_stage = "业务恢复阶段"
            elif is_complete_fix_stage:
                priority_thresholds = {"P1": 24, "P2": 72, "P3": 120, "P4": 168}
                overdue_stage = "彻底修复阶段"
            else:
                priority_thresholds = {"P1": 8, "P2": 24, "P3": 48, "P4": 72}
                overdue_stage = "业务恢复阶段"

            sla_threshold = (
                priority_thresholds.get(ticket.priority, 24) if ticket else 24
            )

            flow_item = {
                "id": flow.id,
                "flow_type": flow.flow_type,
                "flow_mode": flow.flow_mode,
                "from_status": flow.from_status,
                "to_status": flow.to_status,
                "handler": flow.handler,
                "department": flow.department,
                "description": flow.description,
                "notes": flow.notes,
                "is_temporary_solution": flow.is_temporary_solution,
                "create_time": flow.create_time,
                "create_time_str": flow.create_time.strftime("%Y-%m-%d %H:%M:%S")
                if flow.create_time
                else None,
                "problem_classification_main": flow.problem_classification_main,
                "problem_classification_sub": flow.problem_classification_sub,
                # 阶段信息
                "is_business_recovery_stage": is_business_recovery_stage,
                "is_complete_fix_stage": is_complete_fix_stage,
                "overdue_stage": overdue_stage,
                "sla_threshold": sla_threshold,
                # 超时信息（稍后计算）
                "is_overdue": False,
                "overdue_hours": 0.0,
                "overdue_reason": "",
                "responsible_department": "",
                "priority": ticket.priority if ticket else "P4",
            }
            flow_data.append(flow_item)

            # 更新标记
            if is_current_temporary_solution:
                has_temporary_solution = True

        # 现在计算每个节点的超时（从工单创建开始累计计算总时间）
        from datetime import datetime, timedelta

        now = datetime.now()

        # 获取工单创建时间作为累计计算的起点
        ticket_create_time = (
            ticket.create_time
            if ticket and ticket.create_time
            else (flow_data[0]["create_time"] if flow_data else now)
        )

        # 累计时间计算：从工单创建开始累计计算总时间
        # 两个阶段使用独立的累计超时计数器
        prev_business_overdue = 0  # 业务恢复阶段的累计超时
        prev_complete_overdue = 0  # 彻底修复阶段的累计超时
        in_complete_fix_stage = False  # 是否已进入彻底修复阶段

        for i, flow_item in enumerate(flow_data):
            # 确定结束时间：下一个节点的创建时间，或者当前时间
            if i < len(flow_data) - 1:
                end_time = flow_data[i + 1]["create_time"]
            else:
                end_time = now

            start_time = flow_item["create_time"]
            sla_threshold = flow_item["sla_threshold"]

            # 检查是否进入彻底修复阶段
            if flow_item["is_complete_fix_stage"]:
                in_complete_fix_stage = True

            if start_time and end_time and ticket_create_time:
                # 计算从工单创建到当前节点结束时间的累计时间
                cumulative_time = end_time - ticket_create_time
                cumulative_hours = cumulative_time.total_seconds() / 3600

                # 判断累计时间是否超过SLA阈值
                if cumulative_hours > sla_threshold:
                    flow_item["is_overdue"] = True
                    # 计算当前节点的累计超时时间
                    current_cumulative_overdue = cumulative_hours - sla_threshold

                    # 根据阶段选择对应的累计超时计数器
                    if in_complete_fix_stage:
                        # 彻底修复阶段
                        node_overdue_hours = (
                            current_cumulative_overdue - prev_complete_overdue
                        )
                        prev_complete_overdue = current_cumulative_overdue
                    else:
                        # 业务恢复阶段
                        node_overdue_hours = (
                            current_cumulative_overdue - prev_business_overdue
                        )
                        prev_business_overdue = current_cumulative_overdue

                    # 如果节点超时时间小于0（说明该节点没有新增超时），设为0
                    if node_overdue_hours < 0:
                        node_overdue_hours = 0

                    flow_item["overdue_hours"] = round(node_overdue_hours, 1)
                    flow_item["cumulative_overdue_hours"] = round(
                        current_cumulative_overdue, 1
                    )  # 累计超时时间
                    flow_item["cumulative_hours"] = round(
                        cumulative_hours, 1
                    )  # 累计时间

                    # 确定责任部门
                    is_initial_node = flow_item["to_status"] in ["创建/提交"] or (
                        flow_item["from_status"] in [None, "None"]
                        and flow_item["description"] == "工单创建"
                    )

                    if is_initial_node:
                        flow_item["responsible_department"] = "技术支持部"
                        flow_item["overdue_reason"] = "技术支持部原因导致超时"
                    elif flow_item["is_business_recovery_stage"]:
                        # 业务恢复阶段使用 to_status 判断责任部门
                        if flow_item["to_status"] in ["未完成-客户原因"]:
                            flow_item["responsible_department"] = "客户"
                        elif flow_item["to_status"] in ["未完成-研发原因"]:
                            flow_item["responsible_department"] = "研发部"
                        elif flow_item["to_status"] in ["未完成-生产原因"]:
                            flow_item["responsible_department"] = "质量部"
                        elif flow_item["to_status"] in [
                            "未完成-售后原因",
                            "处理中",
                            "创建/提交",
                        ]:
                            flow_item["responsible_department"] = "技术支持部"
                        else:
                            flow_item["responsible_department"] = "技术支持部"
                    elif flow_item["is_complete_fix_stage"]:
                        problem_classification = (
                            flow_item["problem_classification_sub"]
                            or flow_item["problem_classification_main"]
                            or ""
                        )

                        if (
                            "软件bug-新bug需研发提供升级包" in problem_classification
                            or "bug开发中" in problem_classification
                            or "死机问题" in problem_classification
                        ):
                            flow_item["responsible_department"] = "研发部"
                        elif "软件bug-需寄回升级包" in problem_classification or any(
                            keyword in problem_classification for keyword in ["硬件"]
                        ):
                            flow_item["responsible_department"] = "质量部"
                        elif "环境类-客户环境问题" in problem_classification:
                            flow_item["responsible_department"] = "客户"
                        elif "新需求" in problem_classification:
                            flow_item["is_overdue"] = False
                            flow_item["overdue_hours"] = 0.0
                        else:
                            flow_item["responsible_department"] = "技术支持部"
                else:
                    # 未超时，但记录累计时间
                    flow_item["cumulative_hours"] = round(cumulative_hours, 1)

            # 转换时间格式
            flow_item["create_time"] = flow_item["create_time_str"]
            del flow_item["create_time_str"]

        # 在最后一个流程节点添加累计超时信息
        if flow_data and ticket:
            # 简化累计超时计算：直接使用单个节点超时数据累加
            business_recovery_department_overdue = {}
            complete_fix_department_overdue = {}

            for flow_item in flow_data:
                if flow_item["is_overdue"] and flow_item["overdue_hours"] > 0:
                    dept = flow_item["responsible_department"]
                    stage = flow_item["overdue_stage"]
                    hours = flow_item["overdue_hours"]

                    if dept:
                        if stage == "业务恢复阶段":
                            if dept not in business_recovery_department_overdue:
                                business_recovery_department_overdue[dept] = 0.0
                            business_recovery_department_overdue[dept] += hours
                        elif stage == "彻底修复阶段":
                            if dept not in complete_fix_department_overdue:
                                complete_fix_department_overdue[dept] = 0.0
                            complete_fix_department_overdue[dept] += hours

            # 过滤掉小于0.01小时的部门
            business_recovery_department_overdue = {
                k: round(v, 1)
                for k, v in business_recovery_department_overdue.items()
                if v > 0.05
            }
            complete_fix_department_overdue = {
                k: round(v, 1)
                for k, v in complete_fix_department_overdue.items()
                if v > 0.05
            }

            # 计算总超时时间
            business_recovery_overdue = round(
                sum(business_recovery_department_overdue.values()), 1
            )
            complete_fix_overdue = round(
                sum(complete_fix_department_overdue.values()), 1
            )

            # 为最后一个流程节点添加累计超时信息
            if flow_data:
                flow_data[-1]["cumulative_overdue"] = {
                    "business_recovery_hours": business_recovery_overdue,
                    "complete_fix_hours": complete_fix_overdue,
                    "business_recovery_department_overdue": business_recovery_department_overdue,
                    "complete_fix_department_overdue": complete_fix_department_overdue,
                }

        # 返回结果
        return jsonify(
            {
                "code": 200,
                "msg": "获取工单流程成功",
                "data": {
                    "flows": flow_data,
                    "statistics": {
                        "total_steps": statistics["total_steps"] if statistics else 0,
                        "is_completed": statistics["is_completed"]
                        if statistics
                        else False,
                        "department_counts": statistics["department_counts"]
                        if statistics
                        else {},
                        "mode_counts": statistics["mode_counts"] if statistics else {},
                    },
                },
            }
        )
    except Exception as e:
        current_app.logger.error(
            f"Error getting ticket flow for ticket {ticket_id}: {e}"
        )
        return jsonify({"code": 500, "msg": "获取工单流程失败", "data": None}), 500


# 删除工单
@bp.post("/delete")  # 前端使用 POST, 也可以是 DELETE /<int:id>
@authorize("system:ticket:delete")
@operation_log(lambda: f"删除工单 -> ID: {g.ticket_id}, 标题: {g.ticket_title}")
def delete():
    ticket_id = request.form.get("id")  # 前端 AJAX data: { id: obj.data['id'] }
    if not ticket_id:
        return fail_api(msg="缺少工单ID")

    ticket = db.session.get(Ticket, int(ticket_id))  # Ensure ticket_id is int
    if not ticket:
        return fail_api(msg="工单不存在")

    # 在删除前，将工单信息存入g对象，用于日志记录
    g.ticket_id = ticket.id
    g.ticket_title = ticket.title

    # Permission check
    # 只允许管理员删除所有工单，其他用户只能删除自己创建的工单
    if not current_user.is_authenticated:
        return fail_api(msg="您需要登录才能删除工单")

    # 权限检查：管理员可以删除任何工单，其他用户只能删除自己创建的工单或自己负责的工单
    if current_user.username == "admin":
        # 管理员可以删除任何工单
        pass  # 允许继续执行
    # 用户可以删除自己创建的工单
    elif (
        hasattr(ticket, "user_id")
        and ticket.user_id
        and ticket.user_id == current_user.id
    ):
        pass  # 允许继续执行
    # 用户可以删除自己负责的工单
    elif (
        hasattr(ticket, "assignee_name")
        and ticket.assignee_name
        and ticket.assignee_name == current_user.username
    ):
        pass  # 允许继续执行
    # 检查前端传递的是否为负责人标志
    elif request.form.get("is_assignee") == "true":
        # 前端已确认用户是负责人，允许删除
        current_app.logger.info(
            f"User {current_user.username} deleting ticket ID {ticket_id} as assignee"
        )
        pass  # 允许继续执行
    else:
        current_app.logger.warning(
            f"User {current_user.username} attempted to delete ticket ID {ticket_id} without permission"
        )
        return fail_api(msg="您没有权限删除此工单")

    try:
        # 首先删除相关的工单流程记录（解决外键约束问题）
        from applications.models.ticket_flow import TicketFlow

        TicketFlow.query.filter_by(ticket_id=ticket.id).delete()

        # 然后删除工单本身
        db.session.delete(ticket)
        db.session.commit()
        return success_api(msg="删除工单成功")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting ticket {ticket_id}: {e}")
        return fail_api(msg="删除工单失败")


# 批量删除工单
@bp.post("/batchDelete")
@authorize("system:ticket:delete")
@operation_log(lambda: f"批量删除工单 -> ID: {g.ticket_ids}")
def batch_delete():
    ids = request.form.getlist("ids[]")
    if not ids:
        return fail_api(msg="未提供任何工单ID")

    # 检查用户权限
    if not current_user.is_authenticated:
        return fail_api(msg="您需要登录才能删除工单")

    # 在删除前，将工单ID列表存入g对象，用于日志记录
    g.ticket_ids = ids

    deleted_count = 0
    try:
        # 首先删除相关的工单流程记录（解决外键约束问题）
        from applications.models.ticket_flow import TicketFlow

        for ticket_id_str in ids:
            try:
                ticket_id = int(ticket_id_str)

                # 先查询工单信息，检查权限
                ticket = db.session.get(Ticket, ticket_id)
                if not ticket:
                    current_app.logger.warning(f"No ticket found with ID {ticket_id}")
                    continue

                # 权限检查：管理员可以删除任何工单，其他用户只能删除自己创建的工单或自己负责的工单
                if current_user.username == "admin":
                    # 管理员可以删除任何工单
                    # 先删除相关的流程记录
                    TicketFlow.query.filter_by(ticket_id=ticket.id).delete()
                    db.session.delete(ticket)
                    deleted_count += 1
                    current_app.logger.info(f"Admin deleted ticket ID {ticket_id}")
                elif (
                    hasattr(ticket, "user_id")
                    and ticket.user_id
                    and ticket.user_id == current_user.id
                ):
                    # 用户可以删除自己创建的工单
                    # 先删除相关的流程记录
                    TicketFlow.query.filter_by(ticket_id=ticket.id).delete()
                    db.session.delete(ticket)
                    deleted_count += 1
                    current_app.logger.info(
                        f"User {current_user.username} deleted own ticket ID {ticket_id}"
                    )
                elif (
                    hasattr(ticket, "assignee_name")
                    and ticket.assignee_name
                    and ticket.assignee_name == current_user.username
                ):
                    # 用户可以删除自己负责的工单
                    # 先删除相关的流程记录
                    TicketFlow.query.filter_by(ticket_id=ticket.id).delete()
                    db.session.delete(ticket)
                    deleted_count += 1
                    current_app.logger.info(
                        f"User {current_user.username} deleted ticket ID {ticket_id} as assignee"
                    )
                else:
                    current_app.logger.warning(
                        f"User {current_user.username} attempted to delete ticket ID {ticket_id} without permission"
                    )
            except ValueError:
                current_app.logger.warning(
                    f"Invalid ticket ID in batch delete: {ticket_id_str}"
                )
                continue  # Skip non-integer IDs
        if deleted_count > 0:
            db.session.commit()
        return success_api(msg=f"成功删除 {deleted_count} 条工单")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error batch deleting tickets: {e}")
        return fail_api(msg="批量删除工单失败")


# 导出所有工单数据（不分页）
@bp.get("/export")
@authorize("system:ticket:main")
def export_tickets():
    try:
        query = Ticket.query.with_entities(
            Ticket.id,
            Ticket.title,
            Ticket.description,
            Ticket.priority,
            Ticket.status,
            Ticket.assignee_name,
            Ticket.photo_ids,
            Ticket.image_references_str,
            Ticket.impact_scope,
            Ticket.relatedinfo,
            Ticket.solution,
            Ticket.security_level,
            Ticket.threat_type,
            Ticket.attack_source,
            Ticket.attack_target,
            Ticket.vulnerability_name,
            Ticket.cvss_score,
            Ticket.ioc_indicators,
            Ticket.containment_measures,
            Ticket.eradication_measures,
            Ticket.recovery_measures,
            Ticket.lessons_learned,
            Ticket.compliance_requirements,
            Ticket.is_gdpr_compliant,
            Ticket.is_ccpa_compliant,
            Ticket.other_compliance,
            Ticket.service_method,
            Ticket.appointment_time,
            Ticket.engineer_id,
            Ticket.product_type_level1,
            Ticket.product_type_level2,
            Ticket.version_number,
            Ticket.serial_number,
            Ticket.is_out_of_warranty,
            Ticket.order_time,
            Ticket.completion_time,
            Ticket.problem_classification_main,
            Ticket.problem_classification_sub,
            Ticket.problem_classification_tags,
            Ticket.problem_tags,
            Ticket.create_time,
            Ticket.update_time,
            Ticket.customer_agent_name,
        )

        keyword = str_escape(request.args.get("keyword", ""))
        if keyword:
            try:
                ticket_id = int(keyword)
                query = query.filter(Ticket.id == ticket_id)
            except ValueError:
                query = query.filter(Ticket.title.like(f"%{keyword}%"))

        status = str_escape(request.args.get("status", ""))
        priority = str_escape(request.args.get("priority", ""))
        assignee = str_escape(request.args.get("assignee", ""))
        service_method = str_escape(request.args.get("service_method", ""))
        product_type = str_escape(request.args.get("product_type", ""))
        engineer_id = str_escape(request.args.get("engineer_id", ""))
        serial_number = str_escape(request.args.get("serial_number", ""))
        version_number = str_escape(request.args.get("version_number", ""))
        problem_main = str_escape(request.args.get("problem_main", ""))
        relatedinfo = str_escape(request.args.get("relatedinfo", ""))
        warranty = str_escape(request.args.get("warranty", ""))
        description = str_escape(request.args.get("description", ""))
        product_type_level1 = str_escape(request.args.get("product_type_level1", ""))
        product_type_level2 = str_escape(request.args.get("product_type_level2", ""))
        customer_agent_name = str_escape(request.args.get("customer_agent_name", ""))
        problem_classification_main = str_escape(
            request.args.get("problem_classification_main", "")
        )
        problem_tags = str_escape(request.args.get("problem_tags", ""))
        solution = str_escape(request.args.get("solution", ""))
        order_time = str_escape(request.args.get("order_time", ""))
        create_time = str_escape(request.args.get("create_time", ""))
        security_level = str_escape(request.args.get("security_level", ""))
        threat_type = str_escape(request.args.get("threat_type", ""))
        impact_scope = str_escape(request.args.get("impact_scope", ""))

        if status:
            query = query.filter(Ticket.status == status)
        if priority:
            query = query.filter(Ticket.priority == priority)
        if assignee:
            query = query.filter(Ticket.assignee_name.like(f"%{assignee}%"))
        if service_method:
            query = query.filter(Ticket.service_method == service_method)
        if order_time:
            query = query.filter(Ticket.order_time.like(f"%{order_time}%"))
        if create_time:
            query = query.filter(Ticket.create_time.like(f"%{create_time}%"))
        if problem_tags:
            query = query.filter(Ticket.problem_tags.like(f"%{problem_tags}%"))
        if solution:
            query = query.filter(Ticket.solution.like(f"%{solution}%"))
        if serial_number:
            query = query.filter(Ticket.serial_number.like(f"%{serial_number}%"))
        if version_number:
            query = query.filter(Ticket.version_number.like(f"%{version_number}%"))
        if product_type_level1:
            query = query.filter(
                Ticket.product_type_level1.like(f"%{product_type_level1}%")
            )
        if product_type_level2:
            query = query.filter(
                Ticket.product_type_level2.like(f"%{product_type_level2}%")
            )
        if problem_classification_main:
            query = query.filter(
                Ticket.problem_classification_main.like(
                    f"%{problem_classification_main}%"
                )
            )
        if customer_agent_name:
            query = query.filter(
                Ticket.customer_agent_name.like(f"%{customer_agent_name}%")
            )
        if description:
            query = query.filter(Ticket.description.like(f"%{description}%"))
        if relatedinfo:
            query = query.filter(Ticket.relatedinfo.like(f"%{relatedinfo}%"))
        if warranty:
            is_out_of_warranty = warranty.lower() == "true"
            query = query.filter(Ticket.is_out_of_warranty == is_out_of_warranty)
        if security_level:
            query = query.filter(Ticket.security_level == security_level)
        if threat_type:
            query = query.filter(Ticket.threat_type == threat_type)
        if impact_scope:
            query = query.filter(Ticket.impact_scope == impact_scope)

        data = query.order_by(desc(Ticket.create_time)).all()

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(
            [
                "ID",
                "标题",
                "描述",
                "优先级",
                "状态",
                "负责人",
                "照片ID",
                "图片引用",
                "影响范围",
                "处理记录",
                "解决方案",
                "服务方式",
                "预约时间",
                "工程师ID",
                "一级产品类型",
                "二级产品类型",
                "版本号",
                "序列号",
                "是否过保",
                "下单时间",
                "完成时间",
                "主要问题分类",
                "次要问题分类",
                "问题分类标签",
                "问题标签",
                "创建时间",
                "更新时间",
                "客户名称",
            ]
        )

        for ticket in data:
            writer.writerow(
                [
                    ticket.id,
                    ticket.title,
                    ticket.description,
                    ticket.priority,
                    ticket.status,
                    ticket.assignee_name,
                    ticket.photo_ids,
                    ticket.image_references_str,
                    ticket.impact_scope,
                    ticket.relatedinfo,
                    ticket.solution,
                    ticket.service_method,
                    ticket.appointment_time,
                    ticket.engineer_id,
                    ticket.product_type_level1,
                    ticket.product_type_level2,
                    ticket.version_number,
                    ticket.serial_number,
                    ticket.is_out_of_warranty,
                    ticket.order_time,
                    ticket.completion_time,
                    ticket.problem_classification_main,
                    ticket.problem_classification_sub,
                    ticket.problem_classification_tags,
                    ticket.problem_tags,
                    ticket.create_time,
                    ticket.update_time,
                    ticket.customer_agent_name,
                ]
            )

        output.seek(0)

        response = Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=tickets_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            },
        )
        return response

    except Exception as e:
        current_app.logger.error(f"Error exporting tickets: {e}")
        return fail_api(msg="导出失败")
