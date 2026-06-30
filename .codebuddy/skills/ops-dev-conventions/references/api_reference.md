# API 接口速查

## 认证

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/auth/login` | LDAP 登录，返回 JWT + 种 Cookie | 否 |
| GET | `/api/v1/auth/me` | 获取当前用户信息（含权限列表） | 是 |
| POST | `/api/v1/auth/logout` | 退出登录，清除 Cookie | 是 |

## 系统管理（/api/v1/admin）

### 用户
| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/admin/users` | - |
| GET | `/admin/users/{id}` | - |
| PUT | `/admin/users/{id}` | `user:edit` |
| DELETE | `/admin/users/{id}` | `user:delete` |
| POST | `/admin/users/{id}/roles` | `user:assign` |

### 角色
| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/admin/roles` | - |
| POST | `/admin/roles` | `role:add` |
| PUT | `/admin/roles/{id}` | `role:edit` |
| DELETE | `/admin/roles/{id}` | `role:delete` |
| POST | `/admin/roles/{id}/menus` | `role:assign` |

### 菜单
| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/admin/menus` | - |
| POST | `/admin/menus` | `menu:add` |
| PUT | `/admin/menus/{id}` | `menu:edit` |
| DELETE | `/admin/menus/{id}` | `menu:delete` |

## 数据库连接管理（/api/v1/db-config）

### MySQL
| 方法 | 路径 |
|------|------|
| GET | `/db-config/mysql` |
| GET | `/db-config/mysql/default` |
| POST | `/db-config/mysql` |
| PUT | `/db-config/mysql/{id}` |
| DELETE | `/db-config/mysql/{id}` |

Redis（`/db-config/redis`）和 MongoDB（`/db-config/mongo`）同理。

## 权限标识清单

| 权限 | 说明 |
|------|------|
| `user:edit` | 编辑用户 |
| `user:delete` | 删除用户 |
| `user:assign` | 分配角色 |
| `role:add` | 新增角色 |
| `role:edit` | 编辑角色 |
| `role:delete` | 删除角色 |
| `role:assign` | 分配菜单 |
| `menu:add` | 新增菜单 |
| `menu:edit` | 编辑菜单 |
| `menu:delete` | 删除菜单 |

## 请求/响应示例

### 登录
```bash
POST /api/v1/auth/login
{"username": "chenan02", "password": "xxx"}

# 响应
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "chenan02",
    "email": "chenan02@dobest.com",
    "is_superuser": false,
    "roles": ["guest"],
    "permissions": ["user:edit"]
  }
}
```

### 获取当前用户
```bash
GET /api/v1/auth/me
# 自动从 Cookie 或 Authorization 头读取 token
```
