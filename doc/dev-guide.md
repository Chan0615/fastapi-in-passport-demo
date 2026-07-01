# 开发指南

## 目录

- [项目目录说明](#项目目录说明)
- [新增功能模块](#新增功能模块)
- [路由注册](#路由注册)
- [权限体系](#权限体系)
- [数据库规范](#数据库规范)
- [操作日志](#操作日志)
- [配置管理](#配置管理)
- [常见问题](#常见问题)

---

## 项目目录说明

### 后端分层

```
backend/app/
├── common/              # 通用模块：database、deps、log_middleware、ldap_api 等
├── core/                # 安全认证：JWT、密码哈希
├── admin/               # 系统管理模型：User / Role / Menu（models + schemas）
├── models/              # 通用数据模型：按模块一个文件，如 order.py
├── schemas/             # 通用校验模型：按模块一个文件，如 order.py
├── services/            # 业务逻辑层
│   ├── system/          #   系统管理服务：user_service、role_service、menu_service...
│   └── kefu_attack_system/  #   业务模块服务
├── api/v1/
│   ├── api.py           #   路由聚合入口（注册所有模块路由）
│   └── endpoints/
│       ├── system/      #   系统管理接口：auth、user、role、menu...
│       └── kefu_attack_system/  #   业务模块接口
├── config.py            # 启动配置读取（config/config.yaml）
├── first_init_sql.py    # 种子数据初始化（角色/菜单/权限关联）
└── main.py              # FastAPI 入口
```

### 前端分层

```
frontend/src/
├── contexts/            # 全局状态：AuthContext（用户/菜单/权限）
├── components/          # 公共组件：Auth、IconPicker、ProtectedRoute
├── layouts/             # 布局：BasicLayout（侧边栏 + 顶栏 + 内容区）
├── pages/               # 页面：按功能模块分目录（kebab-case），禁止 index.tsx
│   ├── user-management/UserList.tsx
│   ├── role-management/RoleList.tsx
│   └── menu-management/MenuList.tsx
├── services/            # API 封装：按模块分文件，禁止所有接口堆在一个文件
│   ├── adminApi.ts
│   ├── authApi.ts
│   └── ...
└── utils/               # 工具函数：request.ts（axios 封装）
```

### 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| 后端文件名 | snake_case | `user_service.py`、`order.py` |
| 前端目录名 | kebab-case | `user-management` |
| 前端组件名 | PascalCase | `UserList.tsx`、`UserFormModal.tsx` |
| 前端 API 文件 | 按模块分文件 | `adminApi.ts`、`orderApi.ts` |

---

## 新增功能模块

以新增"订单管理"为例，需要创建以下文件：

### 后端（4 个新文件 + 1 处修改）

| # | 文件 | 作用 |
|---|------|------|
| 1 | `models/order.py` | 定义 `order` 表（SQLAlchemy Model） |
| 2 | `schemas/order.py` | 输入输出字段校验（Pydantic） |
| 3 | `services/system/order_service.py` | CRUD 业务逻辑 |
| 4 | `api/v1/endpoints/system/order.py` | FastAPI 路由端点 |
| 5 | `api/v1/api.py` | 注册路由（加一行） |

#### 1. `models/order.py` — 数据模型

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.common.database import Base

class Order(Base):
    __tablename__ = "order"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(128), nullable=False, comment="订单名称")
    status = Column(String(32), default="pending", comment="状态")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

#### 2. `schemas/order.py` — 校验模型

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class OrderBase(BaseModel):
    title: str
    status: str = "pending"

class OrderCreate(OrderBase): pass

class OrderUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None

class OrderOut(OrderBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
```

#### 3. `services/system/order_service.py` — 业务逻辑

```python
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.order import Order

def get_list(db: Session) -> List[Order]:
    return db.query(Order).all()

def get_by_id(db: Session, pk: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == pk).first()

def create(db: Session, data: dict) -> Order:
    obj = Order(**data)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

def update(db: Session, pk: int, data: dict) -> Optional[Order]:
    obj = get_by_id(db, pk)
    if obj:
        for k, v in data.items():
            if v is not None: setattr(obj, k, v)
        db.commit(); db.refresh(obj)
    return obj

def delete(db: Session, pk: int) -> bool:
    obj = get_by_id(db, pk)
    if obj: db.delete(obj); db.commit(); return True
    return False
```

#### 4. `api/v1/endpoints/system/order.py` — 路由

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.schemas import order as s
from app.services.system import order_service as svc

router = APIRouter()

@router.get("/", response_model=list[s.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return svc.get_list(db)

@router.post("/", response_model=s.OrderOut, status_code=201)
def create_order(payload: s.OrderCreate, db: Session = Depends(get_db)):
    return svc.create(db, payload.model_dump())

@router.put("/{pk}", response_model=s.OrderOut)
def update_order(pk: int, payload: s.OrderUpdate, db: Session = Depends(get_db)):
    if not (obj := svc.update(db, pk, payload.model_dump(exclude_unset=True))):
        raise HTTPException(404, "订单不存在")
    return obj

@router.delete("/{pk}")
def delete_order(pk: int, db: Session = Depends(get_db)):
    if not svc.delete(db, pk): raise HTTPException(404, "订单不存在")
    return {"msg": "已删除"}
```

### 前端（2 个新文件 + 1 处修改）

| # | 文件 | 作用 |
|---|------|------|
| 1 | `pages/order-management/OrderList.tsx` | 列表页（表格 + 弹窗） |
| 2 | `services/orderApi.ts` | API 封装 |
| 3 | `App.tsx` | 注册路由 |

---

## 路由注册

### 后端路由

在 `api/v1/api.py` 中注册：

```python
from app.api.v1.endpoints.system.order import router as order_router

api_router.include_router(order_router, prefix="/orders", tags=["订单管理"])
```

### 前端路由

在 `App.tsx` 中注册：

```tsx
import OrderList from './pages/order-management/OrderList';

<Route path="/orders" element={<OrderList />} />
```

### 菜单注册

1. 在菜单管理页面新增菜单项（`name: "订单管理"`, `path: "/orders"`, `icon: "ShoppingOutlined"`）
2. 在角色管理中将新菜单分配给对应角色

---

## 权限体系

### 权限模型

```
User → Role → Menu/Button（menu_type: directory/menu/button）
                    └── permission: "order:add" / "order:edit" ...
```

### 前端按钮控制

```tsx
import Auth from '../components/Auth';

<Auth permission="order:edit">
  <Button>编辑</Button>
</Auth>
```

- 超级管理员（`is_superuser=true`）拥有所有权限
- 无权限的按钮不渲染

### 常用权限标识

| 权限 | 说明 |
|------|------|
| `user:add` / `user:edit` / `user:delete` | 用户管理 |
| `role:add` / `role:edit` / `role:delete` | 角色管理 |
| `menu:add` / `menu:edit` / `menu:delete` | 菜单管理 |
| `db:add` / `db:edit` / `db:delete` | 数据源管理 |

---

## 数据库规范

### 查询使用 raw SQL

项目统一使用 `text()` 执行 raw SQL，不使用 ORM 查询（`db.query()`）。

```python
from sqlalchemy import text

def get_list(db: Session):
    return db.execute(text("SELECT * FROM `order` ORDER BY id DESC")).fetchall()

def get_by_id(db: Session, pk: int):
    result = db.execute(text("SELECT * FROM `order` WHERE id = :id"), {"id": pk}).fetchone()
    return dict(result._mapping) if result else None

def create(db: Session, data: dict):
    db.execute(text(
        "INSERT INTO `order` (title, status) VALUES (:title, :status)"
    ), data)
    db.commit()
    return db.execute(text("SELECT * FROM `order` WHERE id = LAST_INSERT_ID()")).fetchone()

def update(db: Session, pk: int, data: dict):
    sets = ", ".join(f"{k} = :{k}" for k in data)
    data["id"] = pk
    db.execute(text(f"UPDATE `order` SET {sets} WHERE id = :id"), data)
    db.commit()
    return get_by_id(db, pk)

def delete(db: Session, pk: int) -> bool:
    result = db.execute(text("DELETE FROM `order` WHERE id = :id"), {"id": pk})
    db.commit()
    return result.rowcount > 0
```

> **注意**：使用参数化查询（`:param`）防止 SQL 注入，不要拼接字符串。

### 多表关联查询

```python
# 角色 + 用户数量统计
db.execute(text("""
    SELECT r.*, COUNT(ur.user_id) as user_count
    FROM role r
    LEFT JOIN user_role ur ON r.id = ur.role_id
    GROUP BY r.id
""")).fetchall()

# 用户 + 角色列表
db.execute(text("""
    SELECT u.*, GROUP_CONCAT(r.name) as role_names
    FROM user u
    LEFT JOIN user_role ur ON u.id = ur.user_id
    LEFT JOIN role r ON ur.role_id = r.id
    GROUP BY u.id
""")).fetchall()
```

### 模型仅用于建表

SQLAlchemy Model 只用来定义表结构（`Base.metadata.create_all()` 自动建表），不使用 ORM 查询功能。

```python
class Order(Base):
    __tablename__ = "order"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(128), nullable=False)
    ...
```

---

## 操作日志

### 自动记录

操作日志中间件（`common/log_middleware.py`）全局拦截所有 POST/PUT/DELETE 请求，自动记录：

| 字段 | 说明 |
|------|------|
| user_id / username | 从 JWT 解析操作用户（登录接口从请求体提取） |
| module / action | 根据路径自动推断模块和操作类型 |
| method / path | HTTP 方法和请求路径 |
| params | 请求体参数 |
| ip | 客户端 IP |
| status_code | 响应状态码 |
| cost_ms | 请求耗时 |
| error_msg | 异常信息 |

### 添加新模块的日志映射

在 `common/log_middleware.py` 的 `_PATH_MAP` 中添加：

```python
_PATH_MAP = [
    # ... 已有映射 ...
    (r"/api/v1/orders", "订单管理", ""),
]
```

### 排除路径

在 `_EXCLUDE_PATHS` 中添加不需要记录的路径前缀（如 health check、前端静态资源等）。

---

## 配置管理

### 配置分层

| 类型 | 位置 | 示例 |
|------|------|------|
| 系统配置 | `config/config.yaml` | LDAP 地址、应用名称 |
| 安全配置 | `config/config.yaml` | secret_key、cors、cookie_domain |
| 引导数据库 | `config/config.yaml` | 唯一的一份 MySQL 连接信息 |
| 业务数据库连接 | 数据库表 | `mysql_info` / `redis_info` / `mongo_info` |

### 读取配置

```python
from app.config import bootstrap_config

ldap_url = bootstrap_config.system_root.ldap
app_name = bootstrap_config.app.name
```

---

## 常见问题

### Q: 表没自动创建？
A: 确保模型在 `models/__init__.py` 中有导出，启动时 `Base.metadata.create_all()` 会自动建表。

### Q: 关联查询报错？
A: 列表查询使用 `joinedload` 预加载关联数据，避免 lazy loading 在 session 关闭后失败。

```python
from sqlalchemy.orm import joinedload

db.query(User).options(joinedload(User.roles)).all()
```

### Q: 前端 401？
A: 检查是否需要登录，或 token 是否过期。`request.ts` 拦截器会自动跳转登录页。

### Q: 按钮权限不生效？
A: 检查角色是否正确分配了对应的按钮权限标识，确认 `get_user_permissions()` 正常返回。

### Q: 操作日志没写入？
A: 确认请求方法为 POST/PUT/DELETE（GET 不记录），检查路径是否在 `_EXCLUDE_PATHS` 中。
