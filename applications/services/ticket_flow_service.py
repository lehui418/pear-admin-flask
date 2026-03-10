from datetime import datetime

from flask import current_app

from applications.extensions import db
from applications.models import Dept, User
from applications.models.ticket import Ticket
from applications.models.ticket_flow import TicketFlow

class TicketFlowService:
    """工单流程服务类，用于管理工单状态变化和流程记录"""
    
    @staticmethod
    def create_initial_flow(ticket, flow_type, flow_mode, handler=None, user_dept=None):
        """创建工单初始流程记录"""
        current_app.logger.info(f"开始创建初始流程记录，ticket_id: {ticket.id}, flow_type: {flow_type}, flow_mode: {flow_mode}")
        
        # 获取部门信息，如果没有提供则默认为技术支持部门
        department = "技术支持部门"
        if user_dept:
            if hasattr(user_dept, 'dept_name'):
                department = user_dept.dept_name
            elif isinstance(user_dept, str):
                department = user_dept
        elif hasattr(ticket, 'user_id') and ticket.user_id:
            user = User.query.get(ticket.user_id)
            if user and user.dept_id:
                dept = Dept.query.get(user.dept_id)
                if dept and dept.dept_name:
                    department = dept.dept_name
        
        current_app.logger.info(f"部门信息: {department}")
        
        # 检查所有必填字段
        # 确保to_status不为None，提供默认值
        safe_to_status = ticket.status if ticket.status is not None else '创建/提交'
        
        current_app.logger.info(f"ticket_id: {ticket.id}, type: {type(ticket.id)}")
        current_app.logger.info(f"flow_type: {flow_type}, type: {type(flow_type)}")
        current_app.logger.info(f"flow_mode: {flow_mode}, type: {type(flow_mode)}")
        current_app.logger.info(f"to_status: {safe_to_status}, type: {type(safe_to_status)}")
        
        flow = TicketFlow(
            ticket_id=ticket.id,
            flow_type=flow_type,
            flow_mode=flow_mode,
            from_status=None,
            to_status=safe_to_status,
            handler=handler,
            department=department,
            description="",
            problem_classification_main=ticket.problem_classification_main,
            problem_classification_sub=ticket.problem_classification_sub,
            create_time=datetime.now()
        )
        current_app.logger.info("创建TicketFlow对象成功")
        db.session.add(flow)
        current_app.logger.info("添加到session成功")
        db.session.commit()
        current_app.logger.info("提交成功")
        return flow
    
    @staticmethod
    def add_flow_step_without_commit(ticket_id, from_status, to_status, handler=None, department=None, 
                      description=None, notes=None, is_temporary_solution=False):
        """添加工单流程步骤（不提交数据库）"""
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            raise ValueError(f"工单ID {ticket_id} 不存在")
        
        # 如果没有提供部门信息，尝试从处理人获取
        if not department and handler:
            user = User.query.filter_by(username=handler).first()
            if user and user.dept_id:
                dept = Dept.query.get(user.dept_id)
                if dept and dept.dept_name:
                    department = dept.dept_name
        
        # 确定流程类型和模式
        flow_type = ticket.flow_type if ticket.flow_type else "远程"  # 默认为远程处理
        flow_mode = ticket.flow_mode
        
        # 根据状态变化自动确定流程模式
        if to_status == "创建/提交":
            flow_mode = "创建/提交工单"
        elif to_status == "未完成-客户原因":
            flow_mode = "未完成-客户原因"
        elif to_status == "暂时规避":
            flow_mode = "临时解决方案"
        elif to_status == "已关闭":
            # 所有关闭状态的流程模式都设为"关闭工单"
            flow_mode = "关闭工单"
        elif "生产原因" in to_status:
            flow_mode = "转生产部门"
        elif "研发原因" in to_status:
            flow_mode = "转研发部门"
        elif to_status == "处理中":
            flow_mode = "工单处理中"
        elif to_status == "已解决":
            flow_mode = "工单已解决，仍须持续观察。"
        elif to_status == "未完成-售后原因":
            flow_mode = "售后处理中"
        
        flow = TicketFlow(
            ticket_id=ticket_id,
            flow_type=flow_type,
            flow_mode=flow_mode,
            from_status=from_status,
            to_status=to_status,
            handler=handler,
            department=department,
            description=description,
            notes=notes,
            is_temporary_solution=is_temporary_solution,
            problem_classification_main=ticket.problem_classification_main,
            problem_classification_sub=ticket.problem_classification_sub,
            create_time=datetime.now()
        )
        
        db.session.add(flow)
        # 不提交，由调用方统一提交
        return flow
    
    @staticmethod
    def add_flow_step(ticket_id, from_status, to_status, handler=None, department=None, 
                      description=None, notes=None, is_temporary_solution=False):
        """添加工单流程步骤"""
        # 调用不提交的方法，然后提交
        flow = TicketFlowService.add_flow_step_without_commit(
            ticket_id=ticket_id,
            from_status=from_status,
            to_status=to_status,
            handler=handler,
            department=department,
            description=description,
            notes=notes,
            is_temporary_solution=is_temporary_solution
        )
        
        # 计算超时信息
        TicketFlowService.calculate_flow_timeout(flow)
        
        db.session.commit()
        return flow
    
    @staticmethod
    def update_ticket_status(ticket_id, new_status, handler=None, department=None, 
                           description=None, notes=None, is_temporary_solution=False):
        """更新工单状态并记录流程"""
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            raise ValueError(f"工单ID {ticket_id} 不存在")
        
        old_status = ticket.status
        
        # 更新工单状态
        ticket.status = new_status
        
        # 如果是关闭状态，记录完成时间
        if new_status == "已关闭":
            ticket.completion_time = datetime.now()
        
        # 添加流程记录
        flow = TicketFlowService.add_flow_step(
            ticket_id=ticket_id,
            from_status=old_status,
            to_status=new_status,
            handler=handler,
            department=department,
            description=description,
            notes=notes,
            is_temporary_solution=is_temporary_solution
        )
        
        return flow
    
    @staticmethod
    def get_ticket_flow(ticket_id):
        """获取工单完整流程"""
        flows = TicketFlow.query.filter_by(ticket_id=ticket_id).order_by(TicketFlow.create_time.asc()).all()
        return flows
    
    @staticmethod
    def get_flow_statistics(ticket_id):
        """获取工单流程统计信息"""
        flows = TicketFlow.query.filter_by(ticket_id=ticket_id).all()
        
        if not flows:
            return None
        
        first_flow = flows[0]
        last_flow = flows[-1]
        
        # 计算总处理时间
        total_time = None
        if last_flow.completion_time:
            total_time = last_flow.completion_time - first_flow.create_time
        
        # 统计各部门处理次数
        department_counts = {}
        for flow in flows:
            dept = flow.department or "未知部门"
            department_counts[dept] = department_counts.get(dept, 0) + 1
        
        # 统计流程模式
        mode_counts = {}
        for flow in flows:
            mode = flow.flow_mode or "未知模式"
            mode_counts[mode] = mode_counts.get(mode, 0) + 1
        
        return {
            "total_steps": len(flows),
            "total_time": total_time,
            "first_flow": first_flow,
            "last_flow": last_flow,
            "department_counts": department_counts,
            "mode_counts": mode_counts,
            "is_completed": last_flow.to_status == "已关闭"
        }
    
    @staticmethod
    def determine_flow_type(service_method):
        """根据服务方式确定流程类型"""
        if service_method in ["电话", "微信", "远程"]:
            return service_method  # 直接返回具体的服务方式
        elif service_method == "上门处理":
            return "上门处理"
        else:
            return service_method  # 直接返回服务方式，而不是"未知类型"
    
    @staticmethod
    def determine_flow_mode(service_method, problem_type, status):
        """根据服务方式、问题类型和状态确定流程模式"""
        # 线上处理模式
        if service_method in ["电话", "微信", "远程"]:
            if status == "创建/提交":
                return "创建/提交工单"
            elif status == "未完成-客户原因":
                return "未完成-客户原因"
            elif status == "已关闭":
                return "直接解决"
            elif status == "暂时规避":
                return "暂时规避"
            elif "生产原因" in status:
                return "转生产部门"
            elif "研发原因" in status:
                return "转研发部门"
        
        # 上门处理模式
        elif service_method == "上门处理":
            if status == "创建/提交":
                return "创建/提交工单"
            elif status == "未完成-客户原因":
                return "未完成-客户原因"
            elif status == "已关闭":
                return "直接解决"
            elif "研发原因" in status:
                if "暂时规避" in status:
                    return "临时规避"
                else:
                    return "转研发部门"
        
        return "未知模式"
    
    @staticmethod
    def calculate_flow_timeout(flow):
        """计算流程步骤的超时信息（从工单创建开始累计计算总时间）"""
        try:
            # 获取关联的工单
            ticket = Ticket.query.get(flow.ticket_id)
            if not ticket:
                current_app.logger.warning(f"无法找到工单ID {flow.ticket_id}")
                return
            
            # 根据工单优先级确定SLA阈值
            priority_thresholds = {
                'P1': 8,  # 8小时
                'P2': 24,  # 24小时
                'P3': 48, # 48小时
                'P4': 72  # 72小时
            }
            sla_threshold = priority_thresholds.get(ticket.priority, 24)
            flow.sla_threshold = sla_threshold
            
            # 计算超时状态
            from datetime import datetime, timedelta
            now = datetime.now()
            
            # 从工单创建时间开始累计计算总时间
            if ticket.create_time:
                # 计算累计时间：从工单创建到当前时间的总时长
                cumulative_duration = now - ticket.create_time
                cumulative_hours = cumulative_duration.total_seconds() / 3600
                
                # 判断累计时间是否超过SLA阈值
                if cumulative_hours > sla_threshold:
                    flow.is_overdue = True
                    # 计算超时小时数（累计时间 - SLA阈值）
                    flow.overdue_hours = round(cumulative_hours - sla_threshold, 1)
                else:
                    flow.is_overdue = False
                    flow.overdue_hours = 0.0
                
                # 记录累计时间用于调试
                current_app.logger.info(f"流程超时计算 - 工单ID: {flow.ticket_id}, 流程ID: {flow.id}, "
                                      f"累计时间: {cumulative_hours:.1f}小时, SLA阈值: {sla_threshold}小时, "
                                      f"是否超时: {flow.is_overdue}, 超时小时数: {flow.overdue_hours}")
            
            current_app.logger.info(f"流程超时计算完成 - 工单ID: {flow.ticket_id}, 流程ID: {flow.id}, "
                                  f"是否超时: {flow.is_overdue}, 超时小时数: {flow.overdue_hours}")
            
        except Exception as e:
            current_app.logger.error(f"计算流程超时信息时出错: {e}")
            flow.is_overdue = False
            flow.overdue_hours = 0.0