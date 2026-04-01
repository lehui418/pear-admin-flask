"""
公众号客户免登录提交工单API
"""
from flask import Blueprint, request, jsonify, session, render_template
from applications.extensions import db
from applications.models.ticket import Ticket
from applications.common.utils.upload import upload_one
from datetime import datetime
import random
import string
from PIL import Image, ImageDraw, ImageFont
import io
import base64

# 创建蓝图
public_ticket_bp = Blueprint('public_ticket', __name__, url_prefix='/api/public')

# 验证码存储（使用session）
def generate_captcha():
    """生成图形验证码"""
    # 生成4位随机验证码
    captcha_text = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    session['captcha'] = captcha_text
    session['captcha_time'] = datetime.now().timestamp()
    
    # 创建图片
    width, height = 120, 44
    image = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    
    # 添加干扰线
    for i in range(5):
        x1 = random.randint(0, width)
        y1 = random.randint(0, height)
        x2 = random.randint(0, width)
        y2 = random.randint(0, height)
        draw.line([(x1, y1), (x2, y2)], fill=(200, 200, 200), width=1)
    
    # 添加干扰点
    for i in range(50):
        x = random.randint(0, width)
        y = random.randint(0, height)
        draw.point((x, y), fill=(150, 150, 150))
    
    # 绘制文字
    try:
        font = ImageFont.truetype("arial.ttf", 28)
    except:
        font = ImageFont.load_default()
    
    for i, char in enumerate(captcha_text):
        x = 20 + i * 25
        y = random.randint(5, 15)
        color = (random.randint(50, 150), random.randint(50, 150), random.randint(50, 150))
        draw.text((x, y), char, font=font, fill=color)
    
    # 转换为base64
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    
    return image_base64

@public_ticket_bp.route('/captcha')
def get_captcha():
    """获取验证码图片"""
    # 生成验证码并存储到session
    captcha_text = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    session['captcha'] = captcha_text
    session['captcha_time'] = datetime.now().timestamp()
    
    # 创建图片
    width, height = 120, 44
    image = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    
    # 添加干扰线
    for i in range(5):
        x1 = random.randint(0, width)
        y1 = random.randint(0, height)
        x2 = random.randint(0, width)
        y2 = random.randint(0, height)
        draw.line([(x1, y1), (x2, y2)], fill=(200, 200, 200), width=1)
    
    # 添加干扰点
    for i in range(50):
        x = random.randint(0, width)
        y = random.randint(0, height)
        draw.point((x, y), fill=(150, 150, 150))
    
    # 绘制文字
    try:
        font = ImageFont.truetype("arial.ttf", 28)
    except:
        font = ImageFont.load_default()
    
    for i, char in enumerate(captcha_text):
        x = 20 + i * 25
        y = random.randint(5, 15)
        color = (random.randint(50, 150), random.randint(50, 150), random.randint(50, 150))
        draw.text((x, y), char, font=font, fill=color)
    
    # 保存到内存并返回
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)
    
    from flask import send_file
    return send_file(buffer, mimetype='image/png')

def verify_captcha(captcha_text):
    """验证验证码"""
    stored_captcha = session.get('captcha')
    captcha_time = session.get('captcha_time')
    
    if not stored_captcha or not captcha_time:
        return False
    
    # 验证码5分钟过期
    if datetime.now().timestamp() - captcha_time > 300:
        return False
    
    return stored_captcha.upper() == captcha_text.upper()

def check_submit_frequency(ip):
    """检查提交频率（1分钟内最多5次）"""
    key = f'submit_count_{ip}'
    count = session.get(key, 0)
    last_time = session.get(f'{key}_time', 0)
    
    current_time = datetime.now().timestamp()
    
    # 如果超过1分钟，重置计数
    if current_time - last_time > 60:
        session[key] = 1
        session[f'{key}_time'] = current_time
        return True
    
    # 检查次数
    if count >= 5:
        return False
    
    session[key] = count + 1
    return True

@public_ticket_bp.route('/ticket/submit', methods=['POST'])
def submit_ticket():
    """客户提交工单"""
    try:
        # 获取客户端IP
        ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()
        
        # 检查提交频率
        if not check_submit_frequency(ip):
            return jsonify({
                'code': 429,
                'msg': '提交过于频繁，请稍后再试（1分钟内最多5次）'
            })
        
        # 获取表单数据
        company = request.form.get('company', '').strip()
        contact = request.form.get('contact', '').strip()
        phone = request.form.get('phone', '').strip()
        problem_type = request.form.get('problemType', '').strip()
        description = request.form.get('description', '').strip()
        captcha = request.form.get('captcha', '').strip()
        
        # 验证必填项
        if not all([company, contact, phone, problem_type, description, captcha]):
            return jsonify({
                'code': 400,
                'msg': '请填写所有必填项'
            })
        
        # 验证手机号格式
        if not phone or len(phone) != 11 or not phone.isdigit():
            return jsonify({
                'code': 400,
                'msg': '请输入有效的手机号码'
            })
        
        # 验证验证码
        if not verify_captcha(captcha):
            return jsonify({
                'code': 400,
                'msg': '验证码错误或已过期'
            })
        
        # 生成工单编号
        ticket_number = datetime.now().strftime('%Y%m%d') + ''.join(random.choices(string.digits, k=4))
        
        # 处理上传的图片
        photo_ids = []
        if 'images' in request.files:
            images = request.files.getlist('images')
            for image in images:
                if image and image.filename:
                    # 检查文件大小
                    image.seek(0, 2)  # 移动到文件末尾
                    file_size = image.tell()
                    image.seek(0)  # 回到文件开头
                    
                    if file_size > 5 * 1024 * 1024:  # 5MB
                        continue
                    
                    # 检查文件类型
                    allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'}
                    file_ext = image.filename.split('.')[-1].lower()
                    if file_ext not in allowed_extensions:
                        continue
                    
                    # 上传图片
                    try:
                        file_url, photo_id = upload_one(image, image.mimetype)
                        if photo_id:
                            photo_ids.append(str(photo_id))
                    except Exception as upload_error:
                        print(f"图片上传失败: {str(upload_error)}")
                        continue
        
        # 创建工单
        ticket = Ticket(
            title=f"【{problem_type}】{company} - {contact}",
            description=description,
            priority='Medium',
            status='待分配',
            customer_agent_name=company,
            source='wechat',  # 标记为公众号提交
            submitter_ip=ip,
            submitter_contact=phone,
            submitter_company=company,
            photo_ids=','.join(photo_ids) if photo_ids else None,
            create_time=datetime.now(),
            update_time=datetime.now()
        )
        
        db.session.add(ticket)
        db.session.commit()
        
        # 清除验证码
        session.pop('captcha', None)
        session.pop('captcha_time', None)
        
        return jsonify({
            'code': 0,
            'msg': '工单提交成功',
            'ticket_number': ticket_number,
            'ticket_id': ticket.id
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"工单提交失败: {str(e)}")
        return jsonify({
            'code': 500,
            'msg': '提交失败，请稍后重试'
        })

@public_ticket_bp.route('/ticket/submit/page')
def submit_page():
    """工单提交页面"""
    return render_template('mobile/ticket/public_submit.html')


@public_ticket_bp.route('/ticket/query', methods=['POST'])
def query_tickets():
    """客户查询工单（通过手机号）"""
    try:
        # 获取查询参数
        phone = request.form.get('phone', '').strip()
        captcha = request.form.get('captcha', '').strip()

        # 验证必填项
        if not phone or not captcha:
            return jsonify({
                'code': 400,
                'msg': '请输入手机号和验证码'
            })

        # 验证手机号格式
        if len(phone) != 11 or not phone.isdigit():
            return jsonify({
                'code': 400,
                'msg': '请输入有效的手机号码'
            })

        # 验证验证码
        if not verify_captcha(captcha):
            return jsonify({
                'code': 400,
                'msg': '验证码错误或已过期'
            })

        # 查询该手机号下的所有工单
        tickets = Ticket.query.filter_by(submitter_contact=phone).order_by(Ticket.create_time.desc()).all()

        # 清除验证码
        session.pop('captcha', None)
        session.pop('captcha_time', None)

        # 构建返回数据
        ticket_list = []
        for ticket in tickets:
            ticket_list.append({
                'id': ticket.id,
                'title': ticket.title,
                'status': ticket.status,
                'create_time': ticket.create_time.strftime('%Y-%m-%d %H:%M') if ticket.create_time else '',
                'update_time': ticket.update_time.strftime('%Y-%m-%d %H:%M') if ticket.update_time else '',
                'description': ticket.description,
                'assignee_name': ticket.assignee_name or '待分配'
            })

        return jsonify({
            'code': 0,
            'msg': '查询成功',
            'data': ticket_list
        })

    except Exception as e:
        print(f"工单查询失败: {str(e)}")
        return jsonify({
            'code': 500,
            'msg': '查询失败，请稍后重试'
        })
