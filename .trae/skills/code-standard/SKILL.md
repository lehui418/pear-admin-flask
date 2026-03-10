---
name: "code-standard"
description: "规范项目代码风格，确保 Python/Flask 后端和前端代码符合团队标准。Invoke when user asks to format code, standardize code style, or mentions code formatting/linting."
---

# 代码规范标准 (Code Standard)

本 Skill 定义了 Pear Admin Flask 项目的代码规范，包括 Python 后端代码和前端代码的格式标准。

## 1. Python 代码规范

### 1.1 导入顺序 (Import Order)
```python
# 1. 标准库导入
from datetime import datetime, timedelta
import json
import re
import traceback

# 2. 第三方库导入
from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import desc, inspect

# 3. 项目内部导入
from applications.common import curd
from applications.common.curd import enable_status, disable_status
from applications.common.utils.http import table_api, fail_api, success_api
from applications.extensions import db
from applications.models import User, Ticket
```

### 1.2 命名规范 (Naming Conventions)

| 类型 | 规范 | 示例 |
|------|------|------|
| 模块/包 | 小写，下划线分隔 | `ticket_flow.py`, `http.py` |
| 类名 | 大驼峰命名法 (PascalCase) | `Ticket`, `TicketFlow`, `SLAService` |
| 函数/方法 | 小写，下划线分隔 | `get_ticket_by_id()`, `success_api()` |
| 变量 | 小写，下划线分隔 | `ticket_id`, `is_rd_dept_member` |
| 常量 | 全大写，下划线分隔 | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| 私有属性 | 单下划线前缀 | `_internal_cache`, `_validate_data()` |

### 1.3 函数规范 (Function Standards)

```python
def get_ticket_list(keyword: str = "", page: int = 1, limit: int = 10) -> dict:
    """
    获取工单列表
    
    :param keyword: 搜索关键词
    :param page: 当前页码，默认 1
    :param limit: 每页数量，默认 10
    :return: 包含工单列表和总数的字典
    """
    # 函数实现
    pass
```

**要求：**
- 所有函数必须有文档字符串 (docstring)
- 使用类型注解 (Type Hints)
- 参数和返回值必须文档化
- 函数长度不超过 50 行（复杂逻辑需拆分）

### 1.4 类规范 (Class Standards)

```python
class Ticket(db.Model):
    """
    工单模型
    
    用于存储售后工单的基本信息和处理流程
    """
    __tablename__ = 'ticket'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    
    def __init__(self, title: str, **kwargs):
        """初始化工单实例"""
        self.title = title
        super().__init__(**kwargs)
    
    def to_dict(self) -> dict:
        """将工单转换为字典格式"""
        return {
            'id': self.id,
            'title': self.title
        }
```

### 1.5 注释规范 (Comment Standards)

```python
# 单行注释：在代码上方，描述下方代码的功能
# 检查用户是否有权限访问该工单
if not has_permission(user, ticket):
    return fail_api("无权限访问")

# 行内注释：与代码之间至少两个空格
x = 1  # 初始化计数器

# TODO 注释：标记待办事项
# TODO: 优化查询性能，添加缓存机制
```

### 1.6 错误处理规范 (Error Handling)

```python
try:
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return fail_api("工单不存在")
except SQLAlchemyError as e:
    current_app.logger.error(f"数据库查询失败: {str(e)}")
    return fail_api("系统错误，请稍后重试")
except Exception as e:
    current_app.logger.error(f"未知错误: {str(e)}")
    return fail_api("操作失败")
```

## 2. Flask 视图规范

### 2.1 蓝图规范 (Blueprint Standards)

```python
from flask import Blueprint

bp = Blueprint('ticket', __name__, url_prefix='/ticket')


@bp.get('/')
@authorize("system:ticket:main")
@login_required
def main():
    """工单管理主页面"""
    return render_template('system/ticket/main.html')


@bp.get('/api/list')
@authorize("system:ticket:main")
def get_list():
    """获取工单列表 API"""
    return success_api(data=[])
```

### 2.2 API 响应规范 (API Response Standards)

```python
# 成功响应
return success_api(msg="操作成功")
return success_api(msg="保存成功", data={"id": 1})

# 失败响应
return fail_api(msg="参数错误")
return fail_api(msg="工单不存在")

# 表格数据响应
return table_api(
    msg="查询成功",
    count=total,
    data=item_list,
    limit=page_size
)
```

## 3. 前端代码规范 (JavaScript/HTML)

### 3.1 JavaScript 规范

```javascript
// 变量命名：驼峰命名法
let ticketId = 123;
let isLoading = false;
const MAX_RETRY = 3;

// 函数命名：驼峰命名法，动词开头
function getTicketList() {
    // 实现
}

function handleSubmit() {
    // 实现
}

// 事件处理函数：on + 动作 + 目标
function onClickSubmit() {
    // 实现
}

function onChangeStatus() {
    // 实现
}
```

### 3.2 HTML 模板规范

```html
<!-- 缩进：2 个空格 -->
<div class="ticket-container">
  <div class="ticket-header">
    <h3 class="title">工单详情</h3>
  </div>
  <div class="ticket-body">
    <!-- 内容区域 -->
  </div>
</div>

<!-- 属性顺序：id > class > data-* > 其他 -->
<input id="ticketTitle" 
       class="form-control" 
       data-type="text" 
       type="text" 
       placeholder="请输入标题">
```

## 4. 数据库模型规范

### 4.1 模型定义规范

```python
class Ticket(db.Model):
    __tablename__ = 'ticket'
    
    # 主键
    id = db.Column(db.Integer, primary_key=True)
    
    # 基础字段
    title = db.Column(db.String(255), nullable=False, comment='工单标题')
    status = db.Column(db.String(50), default='Open', comment='工单状态')
    
    # 外键
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # 时间字段
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
```

### 4.2 字段命名规范

| 类型 | 命名示例 | 说明 |
|------|----------|------|
| 主键 | `id` | 统一使用 id |
| 外键 | `user_id`, `dept_id` | 表名 + _id |
| 状态 | `status`, `is_active` | 状态或布尔前缀 is_ |
| 时间 | `create_time`, `update_time` | 动作 + _time |
| 名称 | `name`, `title`, `description` | 根据语义选择 |

## 5. 代码格式化检查清单

在提交代码前，请确认以下检查项：

- [ ] 导入语句已按标准顺序排列
- [ ] 所有函数都有文档字符串
- [ ] 函数参数和返回值已添加类型注解
- [ ] 变量和函数命名符合规范
- [ ] 没有未使用的导入
- [ ] 没有打印语句（使用日志代替）
- [ ] 异常处理完善
- [ ] 代码缩进统一（4 个空格）
- [ ] 行长度不超过 120 字符
- [ ] 没有硬编码的魔法数字/字符串

## 6. 常用工具命令

```bash
# 检查 Python 代码风格
python -m flake8 applications/ --max-line-length=120

# 自动格式化 Python 代码
python -m black applications/ --line-length=120

# 类型检查
python -m mypy applications/
```
