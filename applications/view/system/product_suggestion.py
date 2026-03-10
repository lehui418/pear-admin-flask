from flask import Blueprint, render_template, request, current_app, g, jsonify
from datetime import datetime, timedelta
import traceback
from flask_login import login_required, current_user
from sqlalchemy import desc, or_

from applications.common import curd
from applications.common.curd import enable_status, disable_status
from applications.common.utils.http import table_api, fail_api, success_api
from applications.common.utils.rights import authorize
from applications.common.utils.validate import str_escape
from applications.extensions import db
from applications.models import User, ProductSuggestion
from applications.common.script.admin import operation_log

bp = Blueprint('product_suggestion', __name__, url_prefix='/product_suggestion')

# 产品建议主页面
@bp.get('/')
@authorize("system:product_suggestion:main")
def main():
    return render_template('system/product_suggestion/main_new.html')

# 测试删除刷新
@bp.route('/test_delete_refresh')
@authorize("system:product_suggestion:main")
def test_delete_refresh():
    return render_template('test_delete_refresh.html')

# 强制刷新页面的接口
@bp.post('/force_refresh')
@authorize("system:product_suggestion:main")
def force_refresh():
    # 这个接口会强制前端刷新整个页面
    return success_api(msg="刷新成功", data={"action": "refresh"})

# 产品建议添加界面
@bp.get('/add')
@authorize("system:product_suggestion:add")
def add_view():
    users = User.query.all()
    return render_template('system/product_suggestion/add.html', users=users)

# 测试提交页面
@bp.get('/test_submit')
def test_submit():
    return render_template('test_submit.html')

# 产品建议数据列表
@bp.get('/table')
@authorize("system:product_suggestion:main")
def table_data():
    # 获取分页参数
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    
    # 构建查询
    query = ProductSuggestion.query
    
    # 建议标题搜索
    search_title = request.args.get('searchTitle', '').strip()
    current_app.logger.info(f"搜索标题参数: '{search_title}'")
    if search_title:
        query = query.filter(ProductSuggestion.title.like(f'%{search_title}%'))
        current_app.logger.info(f"应用标题搜索过滤: %{search_title}%")
    
    # 详细描述搜索（只匹配文本内容，不匹配图片URL）
    search_description = request.args.get('searchDescription', '').strip()
    if search_description:
        # 先用SQL获取可能包含搜索词的记录（提高效率）
        potential_matches = query.filter(ProductSuggestion.description.like(f'%{search_description}%')).all()
        
        # 在Python中清理描述内容并过滤有效ID
        import re
        valid_ids = []
        
        for suggestion in potential_matches:
            # 移除图片相关内容
            clean_description = suggestion.description
            # 移除Markdown图片语法 ![alt text](url)
            clean_description = re.sub(r'!\[.*?\]\(.*?\)', '', clean_description)
            # 移除HTML图片标签
            clean_description = re.sub(r'<img[^>]*>', '', clean_description)
            # 移除图片URL（匹配常见的图片扩展名）
            clean_description = re.sub(r'https?://[^\s]+\.(?:jpg|jpeg|png|gif|bmp|webp)', '', clean_description)
            clean_description = re.sub(r'/[^\s]*\.(?:jpg|jpeg|png|gif|bmp|webp)(?:\?[^\s]*)?(?:#id=\d+)?', '', clean_description)
            
            # 检查清理后的描述是否包含搜索词
            if search_description in clean_description:
                valid_ids.append(suggestion.id)
        
        # 重新构建查询，只包含过滤后的ID
        if valid_ids:
            query = query.filter(ProductSuggestion.id.in_(valid_ids))
        else:
            # 如果没有匹配的记录，返回空结果
            query = query.filter(ProductSuggestion.id == -1)
    
    # 创建时间搜索（单个日期）
    create_time = request.args.get('createTime', '').strip()
    if create_time:
        try:
            # 解析单个日期，格式：2025-11-17
            selected_date = datetime.strptime(create_time, '%Y-%m-%d')
            # 设置该日期的开始和结束时间（00:00:00 到 23:59:59）
            start_time = selected_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = selected_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(
                ProductSuggestion.create_time >= start_time,
                ProductSuggestion.create_time <= end_time
            )
        except Exception as e:
            current_app.logger.warning(f"创建时间解析失败: {e}")
    
    # 更新时间搜索（单个日期）
    update_time = request.args.get('updateTime', '').strip()
    if update_time:
        try:
            # 解析单个日期，格式：2025-11-17
            selected_date = datetime.strptime(update_time, '%Y-%m-%d')
            # 设置该日期的开始和结束时间（00:00:00 到 23:59:59）
            start_time = selected_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = selected_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(
                ProductSuggestion.update_time >= start_time,
                ProductSuggestion.update_time <= end_time
            )
        except Exception as e:
            current_app.logger.warning(f"更新时间解析失败: {e}")
    
    # 创建者搜索
    search_creator = request.args.get('searchCreator', '').strip()
    if search_creator:
        query = query.filter(ProductSuggestion.creator_name.like(f'%{search_creator}%'))
    
    # 优先级筛选
    search_priority = request.args.get('searchPriority', '').strip()
    if search_priority:
        query = query.filter(ProductSuggestion.priority == search_priority)
    
    # 状态筛选
    search_status = request.args.get('searchStatus', '').strip()
    if search_status:
        query = query.filter(ProductSuggestion.status == search_status)
    
    # 产品类型筛选
    product_type_level1 = request.args.get('product_type_level1', '').strip()
    if product_type_level1:
        query = query.filter(ProductSuggestion.product_type_level1 == product_type_level1)
    
    # 排序
    query = query.order_by(desc(ProductSuggestion.create_time))
    
    # 分页
    paginated_data = query.paginate(page=page, per_page=limit, error_out=False)
    
    # 构建返回数据
    data = []
    for suggestion in paginated_data.items:
        # 检查用户是否已认证
        is_admin = False
        is_owner = False
        if hasattr(current_user, 'is_authenticated') and current_user.is_authenticated:
            is_admin = current_user.username == 'admin'
            is_owner = suggestion.creator_id == current_user.id
        
        item = {
            'id': suggestion.id,
            'title': suggestion.title,
            'description': suggestion.description,
            'priority': suggestion.priority,
            'status': suggestion.status,
            'creator_name': suggestion.creator_name,
            'product_type_level1': suggestion.product_type_level1,
            'product_type_level2': suggestion.product_type_level2,
            'create_time': suggestion.create_time.strftime('%Y-%m-%d %H:%M:%S') if suggestion.create_time else '',
            'update_time': suggestion.update_time.strftime('%Y-%m-%d %H:%M:%S') if suggestion.update_time else '',
            'can_edit': is_admin or is_owner,  # 是否可以编辑
            'can_delete': is_admin or is_owner  # 是否可以删除
        }
        data.append(item)
    
    return table_api(
        msg="获取成功",
        data=data,
        count=paginated_data.total
    )

# 保存产品建议 (新增)
@bp.post('/save')
@authorize("system:product_suggestion:add")
@operation_log(lambda: f'新增产品建议 -> ID: {g.suggestion_id}, 标题: {g.suggestion_title}')
def save():
    req_json = request.get_json(force=True)
    
    # 添加详细的调试日志
    current_app.logger.info(f"收到产品建议保存请求: {req_json}")
    current_app.logger.info(f"当前用户: {current_user}, 认证状态: {current_user.is_authenticated if hasattr(current_user, 'is_authenticated') else 'N/A'}")
    
    if not current_user.is_authenticated:
        current_app.logger.warning("用户未认证，拒绝创建产品建议")
        return fail_api(msg="您需要登录才能创建产品建议")
    
    try:
        # 获取表单数据
        title = str_escape(req_json.get('title'))
        description = str_escape(req_json.get('description'))
        priority = str_escape(req_json.get('priority', 'Medium'))
        status = str_escape(req_json.get('status', 'Open'))
        product_type_level1 = str_escape(req_json.get('product_type_level1'))
        product_type_level2 = str_escape(req_json.get('product_type_level2'))
        
        current_app.logger.info(f"提取的数据: title={title}, description={description}, priority={priority}, status={status}")
        current_app.logger.info(f"当前用户信息: id={current_user.id}, username={current_user.username}")
        
        # 验证必填字段
        if not title:
            current_app.logger.warning("产品建议标题为空")
            return fail_api(msg="产品建议标题不能为空")
        
        # 检查是否在短时间内提交了相同标题的建议（防重复提交）
        from datetime import datetime, timedelta
        time_threshold = datetime.now() - timedelta(seconds=5)  # 5秒内重复检查
        
        existing_suggestion = ProductSuggestion.query.filter(
            ProductSuggestion.title == title,
            ProductSuggestion.creator_id == current_user.id,
            ProductSuggestion.create_time >= time_threshold
        ).first()
        
        if existing_suggestion:
            current_app.logger.warning(f"检测到重复提交: 用户{current_user.id}在5秒内提交了相同标题的建议")
            return fail_api(msg="请勿重复提交相同的产品建议，请稍后再试")
        
        # 创建新产品建议
        current_app.logger.info("开始创建ProductSuggestion对象")
        new_suggestion = ProductSuggestion(
            title=title,
            description=description,
            priority=priority,
            status=status,
            creator_id=current_user.id,
            creator_name=current_user.username,
            product_type_level1=product_type_level1,
            product_type_level2=product_type_level2
        )
        
        current_app.logger.info(f"ProductSuggestion对象创建成功: {new_suggestion}")
        current_app.logger.info("开始添加到数据库会话")
        db.session.add(new_suggestion)
        current_app.logger.info("开始提交数据库事务")
        db.session.commit()
        current_app.logger.info(f"数据库提交成功，新建议ID: {new_suggestion.id}")
        
        # 记录日志所需信息
        g.suggestion_id = new_suggestion.id
        g.suggestion_title = new_suggestion.title
        
        return success_api(msg="产品建议创建成功")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"创建产品建议失败: {str(e)}")
        current_app.logger.error(f"异常类型: {type(e)}")
        current_app.logger.error(f"异常详情: {e.__dict__ if hasattr(e, '__dict__') else '无额外信息'}")
        import traceback
        current_app.logger.error(f"堆栈跟踪: {traceback.format_exc()}")
        return fail_api(msg=f"创建产品建议失败: {str(e)}")

# 查看产品建议详情界面
@bp.get('/view/<int:suggestion_id>')
@authorize("system:product_suggestion:main")
def view_view(suggestion_id):
    suggestion = db.session.get(ProductSuggestion, suggestion_id)
    if not suggestion:
        return render_template('errors/404.html'), 404
    
    # 格式化时间，精确到秒
    if suggestion.create_time:
        suggestion.formatted_create_time = suggestion.create_time.strftime('%Y-%m-%d %H:%M:%S')
    else:
        suggestion.formatted_create_time = ''
    
    if suggestion.update_time:
        suggestion.formatted_update_time = suggestion.update_time.strftime('%Y-%m-%d %H:%M:%S')
    else:
        suggestion.formatted_update_time = ''
    
    return render_template('system/product_suggestion/view.html', suggestion=suggestion)

# 编辑产品建议界面
@bp.get('/edit/<int:suggestion_id>')
@authorize("system:product_suggestion:edit")
def edit_view(suggestion_id):
    suggestion = db.session.get(ProductSuggestion, suggestion_id)
    if not suggestion:
        return render_template('errors/404.html'), 404
    
    # 权限检查：管理员可以编辑任何产品建议，普通用户只能编辑自己创建的产品建议
    if current_user.username == 'admin':
        # 管理员可以编辑任何产品建议
        pass
    elif suggestion.creator_id == current_user.id:
        # 用户可以编辑自己创建的产品建议
        pass
    else:
        current_app.logger.warning(f"User {current_user.username} attempted to edit product suggestion ID {suggestion_id} without permission")
        # 返回带提示的页面，使用layui的弹出提示
        return render_template('system/product_suggestion/edit.html', 
                               suggestion=suggestion, 
                               no_permission=True,
                               permission_msg="暂无权限编辑他人创建的产品建议")
    
    return render_template('system/product_suggestion/edit.html', suggestion=suggestion)

# 更新产品建议
@bp.post('/update')
@authorize("system:product_suggestion:edit")
@operation_log(lambda: f'更新产品建议 -> ID: {g.suggestion_id}, 标题: {g.suggestion_title}')
def update():
    try:
        current_app.logger.info(f"开始更新产品建议，请求方法: {request.method}, 内容类型: {request.content_type}")
        
        # 支持表单数据和JSON数据两种格式
        if request.is_json:
            req_data = request.json
            current_app.logger.info("接收到JSON格式数据")
        else:
            req_data = request.form
            current_app.logger.info("接收到表单格式数据")
        
        current_app.logger.info(f"接收到的数据: {dict(req_data)}")
        
        if not req_data:
            current_app.logger.error("请求参数为空")
            return fail_api(msg="请求参数不能为空")
        
        suggestion_id = req_data.get('id')
        if not suggestion_id:
            current_app.logger.error("产品建议ID缺失")
            return fail_api(msg="产品建议ID缺失")
        
        current_app.logger.info(f"正在查询产品建议ID: {suggestion_id}")
        suggestion = ProductSuggestion.query.get_or_404(suggestion_id)
        current_app.logger.info(f"找到产品建议: {suggestion.title}")
        
        # 权限检查：管理员可以编辑所有产品建议，普通用户只能编辑自己创建的产品建议
        current_app.logger.info(f"当前用户: {current_user.username}, 创建者: {suggestion.creator_name}")
        if current_user.username == 'admin':
            current_app.logger.info("管理员权限验证通过")
            pass  # 管理员有全部权限
        elif suggestion.creator_id == current_user.id:
            current_app.logger.info("用户权限验证通过")
            pass  # 用户可以编辑自己创建的产品建议
        else:
            current_app.logger.warning(f"权限不足：用户 {current_user.username} 尝试编辑产品建议 {suggestion_id}")
            return fail_api(msg="权限不足：您只能编辑自己创建的产品建议")
        
        # 记录日志所需信息
        g.suggestion_id = suggestion.id
        g.suggestion_title = suggestion.title
        
        # 更新字段
        current_app.logger.info("开始更新字段")
        suggestion.title = str_escape(req_data.get('title', suggestion.title))
        suggestion.description = str_escape(req_data.get('description', suggestion.description))
        suggestion.priority = str_escape(req_data.get('priority', suggestion.priority))
        suggestion.status = str_escape(req_data.get('status', suggestion.status))
        suggestion.product_type_level1 = str_escape(req_data.get('product_type_level1', suggestion.product_type_level1))
        suggestion.product_type_level2 = str_escape(req_data.get('product_type_level2', suggestion.product_type_level2))
        
        current_app.logger.info("开始提交数据库事务")
        db.session.commit()
        current_app.logger.info("产品建议更新成功")
        return success_api(msg="产品建议更新成功")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新产品建议失败: {str(e)}")
        current_app.logger.error(f"异常类型: {type(e)}")
        import traceback
        current_app.logger.error(f"堆栈跟踪: {traceback.format_exc()}")
        return fail_api(msg=f"更新产品建议失败: {str(e)}")

# 删除产品建议
@bp.post('/delete')
@authorize("system:product_suggestion:delete")
@operation_log(lambda: f'删除产品建议 -> ID: {g.suggestion_id}, 标题: {g.suggestion_title}')
def delete():
    suggestion_id = request.form.get('id')
    if not suggestion_id:
        return fail_api(msg="缺少产品建议ID")
    
    suggestion = db.session.get(ProductSuggestion, int(suggestion_id))
    if not suggestion:
        return fail_api(msg="产品建议不存在")
    
    # 在删除前，将产品建议信息存入g对象，用于日志记录
    g.suggestion_id = suggestion.id
    g.suggestion_title = suggestion.title
    
    # 权限检查：管理员可以删除任何产品建议，普通用户只能删除自己创建的产品建议
    if not current_user.is_authenticated:
        return fail_api(msg="您需要登录才能删除产品建议")
    
    if current_user.username == 'admin':
        # 管理员可以删除任何产品建议
        pass
    elif suggestion.creator_id == current_user.id:
        # 用户可以删除自己创建的产品建议
        pass
    else:
        current_app.logger.warning(f"User {current_user.username} attempted to delete product suggestion ID {suggestion_id} without permission")
        return fail_api(msg="您没有权限删除此产品建议")
    
    try:
        db.session.delete(suggestion)
        db.session.commit()
        return success_api(msg="删除产品建议成功")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"删除产品建议失败: {str(e)}")
        return fail_api(msg="删除产品建议失败")

# 批量删除产品建议
@bp.post('/batchDelete')
@authorize("system:product_suggestion:delete")
@operation_log(lambda: f'批量删除产品建议 -> ID: {g.suggestion_ids}')
def batch_delete():
    ids = request.form.getlist('ids[]')
    if not ids:
        return fail_api(msg="未提供任何产品建议ID")
    
    # 检查用户权限
    if not current_user.is_authenticated:
        return fail_api(msg="您需要登录才能删除产品建议")
    
    # 在删除前，将产品建议ID列表存入g对象，用于日志记录
    g.suggestion_ids = ids
    
    deleted_count = 0
    try:
        for suggestion_id_str in ids:
            try:
                suggestion_id = int(suggestion_id_str)
                
                # 先查询产品建议信息，检查权限
                suggestion = db.session.get(ProductSuggestion, suggestion_id)
                if not suggestion:
                    current_app.logger.warning(f"No product suggestion found with ID {suggestion_id}")
                    continue
                
                # 权限检查：管理员可以删除任何产品建议，其他用户只能删除自己创建的产品建议
                if current_user.username == 'admin':
                    # 管理员可以删除任何产品建议
                    db.session.delete(suggestion)
                    deleted_count += 1
                    current_app.logger.info(f"Admin deleted product suggestion ID {suggestion_id}")
                elif suggestion.creator_id == current_user.id:
                    # 用户可以删除自己创建的产品建议
                    db.session.delete(suggestion)
                    deleted_count += 1
                    current_app.logger.info(f"User {current_user.username} deleted own product suggestion ID {suggestion_id}")
                else:
                    current_app.logger.warning(f"User {current_user.username} attempted to delete product suggestion ID {suggestion_id} without permission")
            except ValueError:
                current_app.logger.warning(f"Invalid product suggestion ID in batch delete: {suggestion_id_str}")
                continue
        
        if deleted_count > 0:
            db.session.commit()
        return success_api(msg=f"成功删除 {deleted_count} 条产品建议")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"批量删除产品建议失败: {str(e)}")
        return fail_api(msg="批量删除产品建议失败")