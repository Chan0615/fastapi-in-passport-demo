# 项目结构与命名约定

本规则用于约束 fastapi-ant-demo 模板的前后端代码组织方式，保证可读性与可维护性。**新增功能、重构或回答"在哪里放代码"类问题时必须遵守。**

---

## 一、前端（React + Ant Design + TypeScript）

### 1. 目录组织：按菜单/功能模块划分
- 每个功能模块按「菜单分类」在 `frontend/src/pages/` 下创建见名知意的目录，目录名使用小写 kebab-case（如 `user-management`、`order-center`、`config-center`）。
- 一个功能模块目录内按职责拆分文件，**禁止把整个模块塞进单个入口文件**。

### 2. 文件命名：见名知意
- 组件文件用 PascalCase 并能体现用途，如 `UserList.tsx`、`UserFormModal.tsx`、`UserDetailDrawer.tsx`。
- **禁止使用 `index.tsx` / `index.vue` 作为功能页面的默认命名**（仅 `src/main.tsx`、`src/App.tsx` 等全局入口例外）。
- 模块内辅助文件按职责命名：
  - `UserColumns.tsx` —— 表格列定义
  - `UserSearchForm.tsx` —— 搜索表单
  - `userHooks.ts` —— 模块内自定义 hooks
  - `userTypes.ts` —— 模块内类型定义

### 3. 推荐的模块目录结构
```
src/pages/user-management/
├── UserList.tsx          # 列表页主组件
├── UserFormModal.tsx     # 新增/编辑弹窗
├── UserColumns.tsx       # 表格列配置
├── UserSearchForm.tsx    # 搜索表单
├── userHooks.ts          # 模块内 hooks
└── userTypes.ts          # 模块内类型
```

### 4. API 与通用方法
- 各模块的 API 调用封装按模块分文件（如 `src/services/userApi.ts`），**禁止所有接口堆在单个 `api.ts`**。
- 通用请求实例、拦截器等通用方法放 `frontend/src/common/` 下（如 `common/request.ts`）。
- 跨模块复用的纯工具函数放 `src/utils/`。

---

## 二、后端（FastAPI + SQLAlchemy）

### 1. 分层分目录，禁止单文件堆砌
- 严格按 `api/endpoints` → `services` → `models` / `schemas` 分层，每个功能在各层都有独立文件，**禁止把多个不相关功能写到同一个文件里**。

### 2. 按功能拆分文件（见名知意）
- `app/api/v1/endpoints/`：每个功能一个路由文件，如 `users.py`、`orders.py`。
- `app/services/`：每个功能一个业务文件，如 `user_service.py`、`order_service.py`。
- `app/models/`：每张表一个模型文件，如 `user.py`、`order.py`。
- `app/schemas/`：每个功能一个校验模型文件，如 `user.py`、`order.py`。
- 新增功能必须同时在对应层创建独立文件，并在 `app/api/v1/api.py` 中注册路由。

### 3. 通用方法放 common 目录
- 数据库连接、会话管理、通用依赖、通用工具等放 `backend/app/common/`：
  - `common/database.py` —— 数据库连接池、`SessionLocal`、`get_db`
  - `common/deps.py` —— 通用依赖（分页参数、当前用户等）
  - `common/utils.py` —— 通用工具函数（时间处理、加密、序列化等）
- `app/core/` 保留安全、认证相关组件（如 `security.py`）。
- 现有 `app/database.py` 中的数据库连接逻辑应迁移至 `app/common/database.py`，后续新增通用方法一律进 `common/`。

### 4. 命名规范
- 文件名：snake_case，能体现功能（`user_service.py` 而非 `service.py`）。
- 路由前缀与 tag 与功能对应，统一在 `api.py` 中注册，如 `api_router.include_router(users.router, prefix="/users", tags=["users"])`。

---

## 三、通用约定
- 新增功能时，前后端模块命名保持对应（如前端 `user-management` ↔ 后端 `users`）。
- **不允许为图省事把多个不相关功能合并到同一文件/目录。**
- 公共可复用代码必须下沉到 `common/` 或 `utils/`，避免在各功能模块内重复实现。
- 单个文件超过 ~300 行且包含多个职责时，应考虑按职责拆分。
