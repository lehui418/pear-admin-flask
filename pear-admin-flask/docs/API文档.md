# 工单系统 API 文档

> 本文档描述工单系统的所有 API 接口，包括请求方式、参数、返回值和示例。

---

## 📋 目录

- [通用说明](#通用说明)
- [认证相关](#认证相关)
- [工单管理](#工单管理)
- [用户管理](#用户管理)
- [部门管理](#部门管理)
- [角色权限](#角色权限)
- [系统监控](#系统监控)

---

## 通用说明

### 基础信息

- **基础 URL**: `http://localhost:5000`
- **数据格式**: JSON
- **字符编码**: UTF-8

### 请求头

```http
Content-Type: application/json
Accept: application/json
```

### 响应格式

```json
{
    "success": true,
    "msg": "操作成功",
    "data": {}
}
```

### 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问，权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证相关

### 用户登录

**请求信息**
- **接口**: `POST /passport/login`
- **描述**: 用户登录系统

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| captcha | string | 是 | 验证码 |
| uuid | string | 是 | 验证码标识 |

**请求示例**
```json
{
    "username": "admin",
    "password": "123456",
    "captcha": "1234",
    "uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**响应示例**
```json
{
    "success": true,
    "msg": "登录成功",
    "data": {
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```

### 用户登出

**请求信息**
- **接口**: `GET /passport/logout`
- **描述**: 用户登出系统

**响应示例**
```json
{
    "success": true,
    "msg": "登出成功"
}
```

---

## 工单管理

### 获取工单列表

**请求信息**
- **接口**: `GET /system/ticket/data`
- **描述**: 获取工单列表数据（支持分页和筛选）

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页条数，默认10 |
| keyword | string | 否 | 关键词搜索（标题/ID） |
| status | string | 否 | 工单状态筛选 |
| priority | string | 否 | 优先级筛选 |
| assignee | string | 否 | 负责人筛选 |

**响应示例**
```json
{
    "success": true,
    "msg": "获取成功",
    "data": {
        "total": 100,
        "items": [
            {
                "id": 1,
                "title": "网络连接问题",
                "status": "处理中",
                "priority": "P1",
                "assignee_name": "张三",
                "create_time": "2026-03-13 09:00:00",
                "update_time": "2026-03-13 10:00:00"
            }
        ]
    }
}
```

### 获取工单详情

**请求信息**
- **接口**: `GET /system/ticket/view/{id}`
- **描述**: 获取单个工单的详细信息

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | int | 是 | 工单ID |

**响应示例**
```json
{
    "success": true,
    "msg": "获取成功",
    "data": {
        "id": 1,
        "title": "网络连接问题",
        "description": "无法访问互联网",
        "status": "处理中",
        "priority": "P1",
        "assignee_name": "张三",
        "create_time": "2026-03-13 09:00:00",
        "update_time": "2026-03-13 10:00:00",
        "flows": [
            {
                "from_status": "创建",
                "to_status": "处理中",
                "operator": "张三",
                "create_time": "2026-03-13 09:30:00"
            }
        ]
    }
}
```

### 创建工单

**请求信息**
- **接口**: `POST /system/ticket/save`
- **描述**: 创建新工单

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 工单标题 |
| description | string | 是 | 问题描述 |
| priority | string | 是 | 优先级（P1/P2/P3/P4） |
| product_type_level1 | string | 否 | 产品类型 |
| serial_number | string | 否 | 序列号 |

**请求示例**
```json
{
    "title": "网络连接问题",
    "description": "无法访问互联网",
    "priority": "P1",
    "product_type_level1": "防火墙",
    "serial_number": "SN123456"
}
```

**响应示例**
```json
{
    "success": true,
    "msg": "工单创建成功",
    "data": {
        "id": 123
    }
}
```

### 更新工单

**请求信息**
- **接口**: `PUT /system/ticket/update/{id}`
- **描述**: 更新工单信息

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | int | 是 | 工单ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 否 | 工单标题 |
| description | string | 否 | 问题描述 |
| status | string | 否 | 工单状态 |
| priority | string | 否 | 优先级 |

**响应示例**
```json
{
    "success": true,
    "msg": "工单更新成功"
}
```

### 删除工单

**请求信息**
- **接口**: `DELETE /system/ticket/remove/{id}`
- **描述**: 删除工单

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | int | 是 | 工单ID |

**响应示例**
```json
{
    "success": true,
    "msg": "工单删除成功"
}
```

### 批量删除工单

**请求信息**
- **接口**: `DELETE /system/ticket/batchRemove`
- **描述**: 批量删除工单

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ids | array | 是 | 工单ID数组 |

**请求示例**
```json
{
    "ids": [1, 2, 3]
}
```

**响应示例**
```json
{
    "success": true,
    "msg": "批量删除成功"
}
```

### 导出工单

**请求信息**
- **接口**: `GET /system/ticket/export`
- **描述**: 导出工单数据为 Excel

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | string | 否 | 关键词筛选 |
| status | string | 否 | 状态筛选 |

**响应**: 文件下载（Excel格式）

---

## 用户管理

### 获取用户列表

**请求信息**
- **接口**: `GET /system/user/data`
- **描述**: 获取用户列表

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | int | 否 | 页码 |
| limit | int | 否 | 每页条数 |
| username | string | 否 | 用户名筛选 |

**响应示例**
```json
{
    "success": true,
    "msg": "获取成功",
    "data": {
        "total": 50,
        "items": [
            {
                "id": 1,
                "username": "admin",
                "realname": "管理员",
                "dept_name": "技术部",
                "create_time": "2026-01-01 00:00:00"
            }
        ]
    }
}
```

### 创建用户

**请求信息**
- **接口**: `POST /system/user/save`
- **描述**: 创建新用户

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| realname | string | 否 | 真实姓名 |
| dept_id | int | 否 | 部门ID |
| role_ids | array | 否 | 角色ID数组 |

**响应示例**
```json
{
    "success": true,
    "msg": "用户创建成功"
}
```

---

## 部门管理

### 获取部门列表

**请求信息**
- **接口**: `GET /system/dept/data`
- **描述**: 获取部门树形列表

**响应示例**
```json
{
    "success": true,
    "msg": "获取成功",
    "data": [
        {
            "id": 1,
            "dept_name": "技术部",
            "children": [
                {
                    "id": 2,
                    "dept_name": "研发组"
                }
            ]
        }
    ]
}
```

---

## 角色权限

### 获取角色列表

**请求信息**
- **接口**: `GET /system/role/data`
- **描述**: 获取角色列表

**响应示例**
```json
{
    "success": true,
    "msg": "获取成功",
    "data": {
        "total": 10,
        "items": [
            {
                "id": 1,
                "role_name": "管理员",
                "role_code": "admin",
                "enable": 1
            }
        ]
    }
}
```

### 获取权限菜单

**请求信息**
- **接口**: `GET /system/power/data`
- **描述**: 获取权限菜单树

**响应示例**
```json
{
    "success": true,
    "msg": "获取成功",
    "data": [
        {
            "id": 1,
            "name": "系统管理",
            "icon": "layui-icon-set",
            "children": [
                {
                    "id": 2,
                    "name": "用户管理",
                    "href": "/system/user"
                }
            ]
        }
    ]
}
```

---

## 系统监控

### 获取系统信息

**请求信息**
- **接口**: `GET /system/console/info`
- **描述**: 获取系统运行信息

**响应示例**
```json
{
    "success": true,
    "msg": "获取成功",
    "data": {
        "cpu_usage": 25.5,
        "memory_usage": 60.2,
        "disk_usage": 45.8,
        "python_version": "3.11.0",
        "os": "Windows 10",
        "uptime": "10天5小时"
    }
}
```

### 获取在线用户

**请求信息**
- **接口**: `GET /system/console/online`
- **描述**: 获取当前在线用户列表

**响应示例**
```json
{
    "success": true,
    "msg": "获取成功",
    "data": {
        "total": 5,
        "items": [
            {
                "username": "admin",
                "login_ip": "192.168.1.100",
                "login_time": "2026-03-13 08:00:00"
            }
        ]
    }
}
```

---

## 附录

### 工单状态说明

| 状态 | 说明 |
|------|------|
| 创建/提交 | 工单刚创建 |
| 处理中 | 正在处理 |
| 已解决 | 问题已解决 |
| 已关闭 | 工单已关闭 |
| 暂时规避 | 临时解决方案 |
| 未完成-客户原因 | 因客户原因未完成 |
| 未完成-研发原因 | 因研发原因未完成 |
| 未完成-生产原因 | 因生产原因未完成 |
| 未完成-售后原因 | 因售后原因未完成 |

### 优先级说明

| 优先级 | 说明 | SLA时间 |
|--------|------|---------|
| P1 | 重大 | 8小时 |
| P2 | 主要 | 2个工作日 |
| P3 | 次要 | 4个工作日 |
| P4 | 咨询 | 暂未定义 |

---

*文档版本：v1.0*  
*最后更新：2026-03-13*
