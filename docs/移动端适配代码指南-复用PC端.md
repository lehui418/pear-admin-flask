# 移动端适配代码指南 - 复用PC端代码

> 本文档说明如何复用PC端代码，只写移动端需要的新代码

---

## 📋 复用策略说明

### 后端代码（完全复用，不新建）

| PC端文件 | 用途 | 移动端如何使用 |
|---------|------|--------------|
| `applications/view/system/passport.py` | 登录、验证码 | 直接调用接口 |
| `applications/view/system/ticket.py` | 工单增删改查 | 直接调用接口 |
| `applications/models/` | 数据模型 | 自动复用 |
| `applications/extensions/` | 扩展模块 | 自动复用 |

### 前端代码（新建移动端专用）

| 类型 | 需要新建的文件 |
|-----|--------------|
| HTML模板 | `templates/mobile/` 下的所有文件 |
| CSS样式 | `static/css/mobile/` 下的所有文件 |
| JavaScript | `static/js/mobile/` 下的所有文件 |

---

## 🏗️ Phase 1: 基础架构

### 1.1 创建目录结构

```bash
# 创建模板目录
mkdir templates/mobile
mkdir templates/mobile/passport
mkdir templates/mobile/ticket

# 创建静态文件目录
mkdir static/css/mobile
mkdir static/js/mobile
mkdir static/js/mobile/ticket
```

---

### 1.2 移动端基础模板 (base.html)

**文件**: `templates/mobile/base.html`

**核心要点**:
- 使用 `{% extends %}` 继承机制
- 引入 Layui Mobile（已存在于项目中）
- 添加 viewport meta 标签（必须）
- 设计底部导航栏

**代码结构**:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <!-- 必须：viewport标签，控制移动端缩放 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>{% block title %}售后工单系统{% endblock %}</title>
    
    <!-- 引入Layui Mobile CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='index/layui/css/layui.mobile.css') }}">
    
    <!-- 移动端基础样式 -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/mobile/mobile-base.css') }}">
    
    {% block css %}{% endblock %}
</head>
<body>
    <!-- 页面内容区域 -->
    <div class="mobile-container">
        {% block content %}{% endblock %}
    </div>
    
    <!-- 底部导航栏 -->
    <div class="mobile-footer-nav">
        <a href="{{ url_for('system.ticket_main') }}" class="nav-item">
            <i class="layui-icon layui-icon-home"></i>
            <span>首页</span>
        </a>
        <a href="{{ url_for('system.ticket_add') }}" class="nav-item">
            <i class="layui-icon layui-icon-add-1"></i>
            <span>新增</span>
        </a>
        <a href="{{ url_for('system.index') }}" class="nav-item">
            <i class="layui-icon layui-icon-username"></i>
            <span>我的</span>
        </a>
    </div>
    
    <!-- 引入Layui JS -->
    <script src="{{ url_for('static', filename='index/layui/layui.js') }}"></script>
    
    <!-- 移动端公共JS -->
    <script src="{{ url_for('static', filename='js/mobile/common.js') }}"></script>
    
    {% block js %}{% endblock %}
</body>
</html>
```

**关键说明**:
- `{% block content %}`: 子模板填充内容的地方
- `{% block css %}`: 子模板可以添加自己的样式
- `{% block js %}`: 子模板可以添加自己的脚本
- 底部导航链接到PC端路由，复用PC端接口

---

### 1.3 移动端基础样式 (mobile-base.css)

**文件**: `static/css/mobile/mobile-base.css`

**核心样式分类**:

```css
/* 1. 基础重置 */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { 
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px; 
    background: #f5f5f5;
}

/* 2. 底部导航栏 */
.mobile-footer-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 55px;
    background: #fff;
    display: flex;
    justify-content: space-around;
    align-items: center;
    border-top: 1px solid #e8e8e8;
    z-index: 1000;
}

/* 3. 卡片样式 */
.mobile-card {
    background: #fff;
    margin: 10px;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 4. 表单样式 */
.mobile-form input,
.mobile-form select,
.mobile-form textarea {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 15px;
}

/* 5. 按钮样式 */
.mobile-btn {
    width: 100%;
    padding: 14px;
    background: #1890ff;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 16px;
}
```

---

### 1.4 移动端公共JS (common.js)

**文件**: `static/js/mobile/common.js`

**核心功能封装**:

```javascript
/**
 * 移动端公共方法
 */
var MobileCommon = {
    // 显示加载中
    showLoading: function(msg) {
        layui.layer.open({ type: 2, content: msg || '加载中...' });
    },
    
    // 隐藏加载中
    hideLoading: function() {
        layui.layer.closeAll('loading');
    },
    
    // 显示提示消息
    showToast: function(msg) {
        layui.layer.open({ content: msg, skin: 'msg', time: 2 });
    },
    
    // 显示确认框
    showConfirm: function(msg, callback) {
        layui.layer.open({
            content: msg,
            btn: ['确定', '取消'],
            yes: function(index) {
                layui.layer.close(index);
                if (callback) callback(true);
            },
            no: function(index) {
                layui.layer.close(index);
                if (callback) callback(false);
            }
        });
    },
    
    // AJAX请求封装
    request: function(options) {
        var self = this;
        if (options.loading !== false) self.showLoading();
        
        layui.$.ajax({
            url: options.url,
            type: options.type || 'GET',
            data: options.data || {},
            dataType: 'json',
            success: function(res) {
                self.hideLoading();
                if (res.code === 0 || res.success) {
                    if (options.success) options.success(res);
                } else {
                    self.showToast(res.msg || '操作失败');
                    if (options.error) options.error(res);
                }
            },
            error: function() {
                self.hideLoading();
                self.showToast('网络错误');
                if (options.error) options.error();
            }
        });
    }
};

window.MobileCommon = MobileCommon;
```

---

## 🔐 Phase 2: 登录页

### 2.1 移动端登录模板

**文件**: `templates/mobile/passport/login.html`

**复用PC端接口**:
- 验证码接口: `/system/passport/get_captcha`
- 登录接口: `/system/passport/login`

**代码结构**:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='index/layui/css/layui.mobile.css') }}">
    <style>
        /* 登录页专用样式 */
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-form {
            background: #fff;
            border-radius: 12px;
            padding: 30px 25px;
            width: 85%;
            max-width: 350px;
        }
        /* ... 其他样式 ... */
    </style>
</head>
<body>
    <div class="login-form">
        <h2>售后工单系统</h2>
        <form id="loginForm">
            <input type="text" name="username" placeholder="用户名" required>
            <input type="password" name="password" placeholder="密码" required>
            <div class="captcha-row">
                <input type="text" name="captcha" placeholder="验证码" required>
                <!-- 复用PC端验证码接口 -->
                <img src="{{ url_for('system.passport.get_captcha') }}" 
                     onclick="this.src='{{ url_for('system.passport.get_captcha') }}?t='+Date.now()">
            </div>
            <button type="submit">登录</button>
        </form>
    </div>
    
    <script src="{{ url_for('static', filename='index/layui/layui.js') }}"></script>
    <script>
        layui.use(['layer', 'jquery'], function(){
            var layer = layui.layer;
            var $ = layui.jquery;
            
            $('#loginForm').on('submit', function(e) {
                e.preventDefault();
                var data = $(this).serialize();
                
                // 复用PC端登录接口
                $.post("{{ url_for('system.passport.login') }}", data, function(res) {
                    if (res.code === 0) {
                        layer.msg('登录成功');
                        setTimeout(function() {
                            window.location.href = "{{ url_for('system.ticket_main') }}";
                        }, 1000);
                    } else {
                        layer.msg(res.msg);
                    }
                });
            });
        });
    </script>
</body>
</html>
```

**关键说明**:
- `{{ url_for('system.passport.get_captcha') }}`: 复用PC端验证码接口
- `{{ url_for('system.passport.login') }}`: 复用PC端登录接口
- `{{ url_for('system.ticket_main') }}`: 登录成功后跳转到PC端工单列表（会自动适配）

---

## 📋 Phase 3: 工单列表页

### 3.1 移动端列表模板

**文件**: `templates/mobile/ticket/list.html`

**继承基础模板**:
```html
{% extends "mobile/base.html" %}

{% block title %}工单列表{% endblock %}

{% block css %}
<style>
    /* 列表页专用样式 */
    .search-bar { /* ... */ }
    .filter-bar { /* ... */ }
    .ticket-card { /* ... */ }
</style>
{% endblock %}

{% block content %}
<!-- 搜索栏 -->
<div class="search-bar">
    <input type="text" id="searchInput" placeholder="搜索工单">
</div>

<!-- 筛选栏 -->
<div class="filter-bar">
    <span class="filter-item active" data-filter="all">全部</span>
    <span class="filter-item" data-filter="P1">P1紧急</span>
    <span class="filter-item" data-filter="待处理">待处理</span>
</div>

<!-- 工单列表 -->
<div id="ticketList"></div>

<!-- 加载更多 -->
<div class="load-more" id="loadMore">上拉加载更多</div>
{% endblock %}

{% block js %}
<script src="{{ url_for('static', filename='js/mobile/ticket/ticket_list.js') }}"></script>
{% endblock %}
```

### 3.2 移动端列表JS

**文件**: `static/js/mobile/ticket/ticket_list.js`

**复用PC端数据接口**:
```javascript
layui.use(['layer', 'jquery'], function(){
    var layer = layui.layer;
    var $ = layui.jquery;
    
    var currentPage = 1;
    var hasMore = true;
    
    // 加载工单列表
    function loadTickets(page, append) {
        MobileCommon.showLoading();
        
        // 复用PC端数据接口
        $.ajax({
            url: '/system/ticket/data',  // PC端接口
            type: 'GET',
            data: {
                page: page,
                limit: 10,
                keyword: $('#searchInput').val()
            },
            dataType: 'json',
            success: function(res) {
                MobileCommon.hideLoading();
                
                if (res.code === 0) {
                    renderTickets(res.data, append);
                    hasMore = res.data.length === 10;
                }
            }
        });
    }
    
    // 渲染工单卡片
    function renderTickets(tickets, append) {
        var html = '';
        tickets.forEach(function(ticket) {
            html += '<div class="ticket-card" data-id="' + ticket.id + '">' +
                '<div class="ticket-title">' + ticket.title + '</div>' +
                '<div class="ticket-info">' +
                    '<span class="priority-' + ticket.priority + '">' + ticket.priority + '</span>' +
                    '<span>' + ticket.customer_name + '</span>' +
                    '<span>' + ticket.status + '</span>' +
                '</div>' +
            '</div>';
        });
        
        if (append) {
            $('#ticketList').append(html);
        } else {
            $('#ticketList').html(html);
        }
    }
    
    // 点击卡片查看详情
    $('#ticketList').on('click', '.ticket-card', function() {
        var id = $(this).data('id');
        // 跳转到PC端查看页面（复用）
        window.location.href = '/system/ticket/view/' + id;
    });
    
    // 初始化加载
    loadTickets(1, false);
});
```

---

## ➕ Phase 4: 工单新增页

### 4.1 移动端新增模板

**文件**: `templates/mobile/ticket/add.html`

```html
{% extends "mobile/base.html" %}

{% block title %}新增工单{% endblock %}

{% block content %}
<!-- 页面头部 -->
<div class="mobile-header">
    <a href="javascript:history.back()" class="back-btn">
        <i class="layui-icon layui-icon-left"></i>
    </a>
    <span class="title">新增工单</span>
</div>

<!-- 表单区域 -->
<div class="mobile-content">
    <form id="addForm" class="mobile-form">
        <div class="form-item">
            <label>工单标题</label>
            <input type="text" name="title" required>
        </div>
        
        <div class="form-item">
            <label>客户名称</label>
            <input type="text" name="customer_name" required>
        </div>
        
        <div class="form-item">
            <label>优先级</label>
            <select name="priority">
                <option value="P1">P1-紧急</option>
                <option value="P2">P2-高</option>
                <option value="P3" selected>P3-中</option>
                <option value="P4">P4-低</option>
            </select>
        </div>
        
        <div class="form-item">
            <label>问题描述</label>
            <textarea name="description" rows="4"></textarea>
        </div>
        
        <button type="submit" class="mobile-btn">提交</button>
    </form>
</div>
{% endblock %}

{% block js %}
<script>
layui.use(['layer', 'jquery'], function(){
    var layer = layui.layer;
    var $ = layui.jquery;
    
    $('#addForm').on('submit', function(e) {
        e.preventDefault();
        var data = $(this).serialize();
        
        // 复用PC端保存接口
        $.post('/system/ticket/save', data, function(res) {
            if (res.code === 0) {
                layer.msg('保存成功');
                setTimeout(function() {
                    window.location.href = '/system/ticket';
                }, 1000);
            } else {
                layer.msg(res.msg);
            }
        });
    });
});
</script>
{% endblock %}
```

---

## 👁️ Phase 5: 工单查看页

### 5.1 移动端查看模板

**文件**: `templates/mobile/ticket/view.html`

```html
{% extends "mobile/base.html" %}

{% block title %}工单详情{% endblock %}

{% block content %}
<!-- 页面头部 -->
<div class="mobile-header">
    <a href="javascript:history.back()" class="back-btn">
        <i class="layui-icon layui-icon-left"></i>
    </a>
    <span class="title">工单详情</span>
    <a href="/system/ticket/edit/{{ ticket.id }}" class="edit-btn">编辑</a>
</div>

<!-- 详情内容 -->
<div class="mobile-content">
    <div class="mobile-card">
        <h3>{{ ticket.title }}</h3>
        <div class="ticket-meta">
            <span class="priority-{{ ticket.priority }}">{{ ticket.priority }}</span>
            <span class="status-{{ ticket.status }}">{{ ticket.status }}</span>
        </div>
    </div>
    
    <div class="mobile-card">
        <h4>基本信息</h4>
        <p>客户：{{ ticket.customer_name }}</p>
        <p>负责人：{{ ticket.handler_name }}</p>
        <p>创建时间：{{ ticket.create_time }}</p>
    </div>
    
    <div class="mobile-card">
        <h4>问题描述</h4>
        <p>{{ ticket.description or '暂无描述' }}</p>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-bar">
        <button class="mobile-btn" onclick="editTicket()">编辑</button>
        <button class="mobile-btn secondary" onclick="deleteTicket()">删除</button>
    </div>
</div>

<script>
function editTicket() {
    window.location.href = '/system/ticket/edit/{{ ticket.id }}';
}

function deleteTicket() {
    MobileCommon.showConfirm('确定删除此工单？', function(confirmed) {
        if (confirmed) {
            // 复用PC端删除接口
            $.post('/system/ticket/remove', {ids: [{{ ticket.id }}]}, function(res) {
                if (res.code === 0) {
                    MobileCommon.showToast('删除成功');
                    setTimeout(function() {
                        window.location.href = '/system/ticket';
                    }, 1000);
                }
            });
        }
    });
}
</script>
{% endblock %}
```

---

## ✅ 总结：复用PC端代码清单

### 后端接口（完全复用，不修改）

| 功能 | PC端接口 | 请求方式 | 参数 |
|-----|---------|---------|------|
| 获取验证码 | `/system/passport/get_captcha` | GET | - |
| 登录 | `/system/passport/login` | POST | username, password, captcha |
| 工单列表数据 | `/system/ticket/data` | GET | page, limit, keyword |
| 保存工单 | `/system/ticket/save` | POST | 表单字段 |
| 查看工单 | `/system/ticket/view/<id>` | GET | - |
| 编辑工单页面 | `/system/ticket/edit/<id>` | GET | - |
| 更新工单 | `/system/ticket/update` | POST | 表单字段 |
| 删除工单 | `/system/ticket/remove` | POST | ids |

### 前端代码（全部新建）

```
templates/mobile/
├── base.html              # 基础模板
├── passport/
│   └── login.html         # 登录页
└── ticket/
    ├── list.html          # 列表页
    ├── add.html           # 新增页
    ├── view.html          # 查看页
    └── edit.html          # 编辑页

static/css/mobile/
└── mobile-base.css        # 基础样式

static/js/mobile/
├── common.js              # 公共方法
└── ticket/
    ├── ticket_list.js     # 列表功能
    ├── ticket_add.js      # 新增功能
    └── ticket_view.js     # 查看功能
```

---

**文档版本**: 1.0  
**创建时间**: 2026-03-19  
**说明**: 本文档只包含移动端需要新建的代码，后端全部复用PC端
