# 运维管理系统（fastapi-ant-demo）

基于 **FastAPI + React + Ant Design** 的运维后台。
当前版本已接入 **Passport 认证中心**，本项目负责：
- 登录态与菜单渲染
- 业务页面（如数据源管理、客服攻防系统）
- 将用户/角色/菜单管理请求代理到 Passport

---

## 1. 当前架构（2026-07）

### 1.1 后端职责
- 认证：`/api/v1/auth/*`（对接 Passport）
- 系统管理代理：`/api/v1/admin/*`（用户/角色/菜单统一代理到 Passport）
- 数据源管理：`/api/v1/db-config/*`（mysql_info/redis_info/mongo_info）
- 业务模块：`/api/v1/kefu-attack-system/*`
- 操作日志：`/api/v1/operation-logs/*`

### 1.2 前端职责
- 登录页、首页仪表盘
- 系统管理页面（用户/角色/菜单/日志/数据源）
- 客服攻防系统页面（展示 `aliyun_ddos_events`）

### 1.3 数据源分区约定
三张连接配置表已支持 `db_section` 字段：
- `mysql_info`
- `redis_info`
- `mongo_info`

`kefu_attack_system` 页面会读取 `db_section = "kefu_attack_system"` 对应的 MySQL 连接，并查询：
- `aliyun_ddos_events`

---

## 2. 目录结构（精简）

```text
fastapi-ant-demo/
├─ backend/
│  ├─ app/
│  │  ├─ api/v1/
│  │  │  ├─ api.py
│  │  │  └─ endpoints/
│  │  │     ├─ system/
│  │  │     │  ├─ auth.py
│  │  │     │  ├─ admin_proxy.py
│  │  │     │  ├─ db_config.py
│  │  │     │  ├─ config.py
│  │  │     │  └─ operation_log.py
│  │  │     └─ kefu_attack_system/
│  │  │        └─ ddos_events.py
│  │  ├─ services/
│  │  │  ├─ system/
│  │  │  │  └─ db_config_service.py
│  │  │  └─ kefu_attack_system/
│  │  │     └─ ddos_events_service.py
│  │  ├─ common/
│  │  │  ├─ database.py
│  │  │  ├─ deps.py
│  │  │  ├─ passport_client.py
│  │  │  └─ log_middleware.py
│  │  ├─ models/
│  │  │  ├─ db_config.py
│  │  │  └─ operation_log.py
│  │  ├─ schemas/
│  │  │  └─ db_config.py
│  │  ├─ config.py
│  │  └─ main.py
│  ├─ scripts/init_config.sql
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ menu-management/MenuList.tsx
│  │  │  ├─ db-config/DbConfigList.tsx
│  │  │  └─ kefu-attack-system/KefuAttackSystem.tsx
│  │  ├─ services/
│  │  │  ├─ adminApi.ts
│  │  │  ├─ dbConfigApi.ts
│  │  │  └─ kefuAttackSystemApi.ts
│  │  └─ App.tsx
│  └─ package.json
├─ config/config.yaml.example
└─ docker_deploy/
   ├─ docker-compose.yml
   └─ deploy.sh
```

---

## 3. 本地开发

## 3.1 后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

复制并编辑配置：

```bash
cd ..
copy config\config.yaml.example config\config.yaml
```

启动后端：

```bash
cd backend\app
python main.py
```

后端地址：
- `http://localhost:8000`
- `http://localhost:8000/docs`

## 3.2 前端

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

前端地址：
- `http://localhost:3000`

---

## 4. 配置说明（config.yaml）

以 `config/config.yaml.example` 为模板。
核心字段：

- `passport_url`：Passport 服务地址（例如 `http://fastapi-passport.ops.com:8888`）
- `mysql.system_default_db`：本项目引导库连接（用于 `db_config`、日志等本地表）
- `security.secret_key`：JWT 密钥
- `security.cookie_domain`：SSO Cookie 域

示例：

```yaml
app:
  name: FastAPI Template
  version: 0.1.0
  debug: false

passport_url: http://fastapi-passport.ops.com:8888

security:
  secret_key: change-me-in-production
  cors_origins: ["*"]
  cookie_domain: .ops.com

mysql:
  system_default_db:
    db_addr: 10.225.138.121
    db_port: 3306
    db_user: root
    db_password: your_password
    db_name: kefu_fastapi_ant_demo
    app_env: dev
```

---

## 5. 关键接口

### 5.1 认证
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/menus`
- `POST /api/v1/auth/logout`

### 5.2 系统管理（代理到 Passport）
- `GET/POST /api/v1/admin/users`
- `GET/PUT/DELETE /api/v1/admin/users/{id}`
- `POST /api/v1/admin/users/{id}/roles`
- `GET/POST /api/v1/admin/roles`
- `GET/PUT/DELETE /api/v1/admin/roles/{id}`
- `POST /api/v1/admin/roles/{id}/menus`
- `GET/POST /api/v1/admin/menus`
- `GET /api/v1/admin/menus/tree`
- `GET/PUT/DELETE /api/v1/admin/menus/{id}`

### 5.3 数据源管理
- `GET/POST /api/v1/db-config/mysql`
- `GET/POST /api/v1/db-config/redis`
- `GET/POST /api/v1/db-config/mongo`
- 以及对应 `/{id}`、`/default`、`DELETE`

### 5.4 客服攻防系统
- `GET /api/v1/kefu-attack-system/aliyun-ddos-events?limit=200`

---

## 6. Docker 部署

> 当前 `docker-compose.yml` 仅启动：`backend + frontend`。
> MySQL/Redis/MongoDB/Passport 作为外部服务提供。

```bash
cd docker_deploy
bash deploy.sh up       # 启动
bash deploy.sh rebuild  # 重建并启动
bash deploy.sh logs     # 查看日志
bash deploy.sh down     # 停止
```

前端容器默认映射：
- `8083:80`

---

## 7. 已清理的过时说明

本 README 已移除以下旧内容：
- “本项目内置 admin 本地 CRUD 主实现”的表述（已改为 Passport 代理）
- “容器内 mysql/redis/mongo 服务”的部署说明（当前 compose 不包含）
- 不再适用的数据库备份命令（如 `docker exec ... mysql`）
- 乱码和重复段落

---

## 8. License

MIT
