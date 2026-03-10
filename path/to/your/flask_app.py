from flask import jsonify, request
from flask_sqlalchemy import SQLAlchemy

# 初始化 SQLAlchemy
db = SQLAlchemy()

# 定义工单模型
class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    priority = db.Column(db.String(50))
    status = db.Column(db.String(50))
    assignee_name = db.Column(db.String(50))
    create_time = db.Column(db.DateTime)

# 强化后端参数校验和异常处理
@app.route('/system/ticket/table', methods=['GET'])
def get_ticket_table():
    print(123)
    try:
        # 修改：增加参数类型和范围校验
        page_str = request.args.get('page', '1')
        limit_str = request.args.get('limit', '15')
        
        if not page_str.isdigit() or not limit_str.isdigit():
            return jsonify({
                "code": 400,
                "msg": "分页参数必须为数字"
            }), 400
            
        page = int(page_str)
        limit = int(limit_str)
        
        if page <= 0 or limit <= 0:
            return jsonify({
                "code": 400,
                "msg": "分页参数无效，page 和 limit 必须为正整数"
            }), 400

        # 修改：增加数据库连接检查
        if not db.engine.has_table('ticket'):
            return jsonify({
                "code": 500,
                "msg": "数据库表不存在"
            }), 500
            
        # 查询工单数据
        tickets = Ticket.query.paginate(page=page, per_page=limit, error_out=False)
        
        # 构造返回数据
        data = {
            "code": 0,  # 成功状态码
            "msg": "success",
            "count": tickets.total,  # 总记录数
            "data": [
                {
                    "id": ticket.id,
                    "title": ticket.title,
                    "priority": ticket.priority,
                    "status": ticket.status,
                    "assignee_name": ticket.assignee_name,
                    "create_time": ticket.create_time.strftime('%Y-%m-%d %H:%M:%S') if ticket.create_time else None
                }
                for ticket in tickets.items
            ]
        }
        return jsonify(data)
    except SQLAlchemyError as e:
        # 新增：数据库异常单独处理
        return jsonify({
            "code": 500,
            "msg": f"数据库操作异常: {str(e)}"
        }), 500
    except ValueError as e:
        # 新增：类型转换异常处理
        return jsonify({
            "code": 400,
            "msg": f"参数类型错误: {str(e)}"
        }), 400
    except Exception as e:
        # 捕获异常并返回详细错误信息
        return jsonify({
            "code": 500,
            "msg": f"服务器内部错误: {str(e)}"
        }), 500
