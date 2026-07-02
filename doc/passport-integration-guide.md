# Passport 接入注意事项

> 本文档记录 fastapi-ant-demo 接入 Passport 认证中心后的注意事项、常见问题与运维要点。

---

## 一、架构概览

```
用户浏览器
    │
    ▼
fastapi-ant-demo (前端 :8083 → nginx → 后端 :8000)
    │
    │  POST /api/v1/auth/login {username, password, project_code: "fastapi-ant-demo"}
    ▼
Passport 认证中心 (前端 :8084 → nginx → 后端 :8888)
    │
    ├── LDAP 验证用户身份
    ├── 签发 JWT（含 project_code）
    ├── 返回 token + user + menus + permissions
    │
    ▼
fastapi-ant-demo 本地验证 JWT（共享 secret_key）
```

### 数据分布

| 数据 | 存储位置 | 管理方式 |
|------|---------|---------|
| 用户、角色、菜单 | passport 数据库 (`fastapi_passport`) | passport 后台管理 |
| 业务数据（数据源配置、操作日志） | fastapi-ant-demo 数据库 (`kefu_fastapi_ant_demo`) | 本地管理 |

---

## 二、关键配置项

### 1. secret_key 必须一致

两个项目的 `config.yaml` 中 `security.secret_key` 必须完全相同，否则 JWT 无法跨系统验证：

```yaml
# fastapi-ant-demo/config/config.yaml
security:
  secret_key: KF_672UrISN$nJPEj1

# passport/config/config.yaml
security:
  secret_key: KF_672UrISN$nJPEj1
```

### 2. passport_url 配置

| 环境 | 配置值 |
|------|--------|
| 本地开发 | `http://localhost:8888` |
| Docker 部署（同机/跨机） | `http://fastapi-passport.ops.com:8888` |

```yaml
# fastapi-ant-demo/config/config.yaml
passport_url: http://fastapi-passport.ops.com:8888
```

### 3. cookie_domain

两个系统必须使用相同的 cookie 域名，才能实现 SSO：

```yaml
security:
  cookie_domain: .ops.com
```

### 4. project_code

fastapi-ant-demo 在 passport 中注册的项目标识为 `fastapi-ant-demo`，硬编码在后端 `passport_client.py` 中：

```python
PROJECT_CODE = "fastapi-ant-demo"
```

如需修改，需同步修改：
- `backend/app/common/passport_client.py` 中的 `PROJECT_CODE`
- passport 数据库中 `project` 表的 `project_code` 字段

---

## 三、网络与域名配置

### 域名方案（推荐）

passport 后端端口 `8888` 映射到宿主机，通过内网域名访问：

```
fastapi-passport.ops.com → 10.225.138.183
```

**DNS 配置**（内网 DNS 服务器或各机器 hosts）：

```
# /etc/hosts
10.225.138.183 fastapi-passport.ops.com
```

passport 的 `docker-compose.yml` 已将后端端口映射到宿主机：

```yaml
services:
  backend:
    ports:
      - "8888:8888"
```

### 验证连通

```bash
# 宿主机测试
curl http://fastapi-passport.ops.com:8888/health

# 容器内测试
docker exec fastapi-ant-demo-backend python -c "
import httpx, asyncio
async def test():
    async with httpx.AsyncClient(timeout=5) as c:
        r = await c.get('http://fastapi-passport.ops.com:8888/health')
        print('STATUS:', r.status_code)
asyncio.run(test())
"
```

### 跨机器部署

域名方案不依赖 Docker 网络，其他机器上的服务只需配置：

```yaml
passport_url: http://fastapi-passport.ops.com:8888
```

即可接入 passport，无需额外网络配置。

---

## 四、部署操作

### 启动顺序

无严格顺序要求（域名方案不依赖 Docker 网络），但建议先启动 passport：

```bash
# 1. 先启动 passport
cd /data_ca/fastapi_passport/docker_deploy && bash deploy.sh up

# 2. 再启动 fastapi-ant-demo
cd /data_ca/fastapi-ant-demo/docker_deploy && bash deploy.sh up
```

### 日常更新代码

```bash
# 仅代码变更（10秒，不重建镜像）
cd /data_ca/fastapi-ant-demo/docker_deploy && bash deploy.sh up

# 依赖变更（Dockerfile/package.json/requirements.txt）
cd /data_ca/fastapi-ant-demo/docker_deploy && bash deploy.sh rebuild
```

### 修改 config.yaml 后

config.yaml 是挂载进容器的，但 Python 进程在启动时读取一次。修改后必须重启容器：

```bash
docker restart fastapi-ant-demo-backend
```

或：

```bash
cd /data_ca/fastapi-ant-demo/docker_deploy && bash deploy.sh restart
```

---

## 五、数据库注意事项

### 已删除的表

以下表已从 `kefu_fastapi_ant_demo` 数据库中删除，功能迁移至 passport：

- `user`
- `role`
- `menu`
- `user_role`
- `role_menu`

### 保留的表

- `mysql_info` — MySQL 数据源配置
- `redis_info` — Redis 数据源配置
- `mongo_info` — MongoDB 数据源配置
- `operation_log` — 操作日志

### passport 数据库

- 数据库名：`fastapi_passport`
- 种子 SQL：`passport/seed_fastapi_ant_demo.sql`
- 清理 SQL：`passport/clean_and_reset.sql`

```bash
# 重新播种（会保留已注册的用户）
mysql -u root -p fastapi_passport < /data_ca/fastapi_passport/seed_fastapi_ant_demo.sql

# 完全重置（清空所有数据）
mysql -u root -p < /data_ca/fastapi_passport/clean_and_reset.sql
```

---

## 六、用户权限管理

### 新用户首次登录

1. 用户在 fastapi-ant-demo 登录页输入 LDAP 账号密码
2. passport 自动创建全局用户记录（默认无角色）
3. 管理员需在 passport 后台为用户分配 `fastapi-ant-demo` 项目的角色
4. 用户重新登录后才能看到菜单和操作按钮

### 超级管理员

passport 中的 `is_superuser=True` 的用户拥有所有项目的全部权限。

设置方法：在 passport 后台「用户管理」中编辑用户，勾选「超级管理员」。

### 角色与项目绑定

- 角色按项目隔离，`fastapi-ant-demo` 项目下的角色不会影响其他项目
- 用户通过角色关联到项目，一个用户可以在多个项目中有不同角色

---

## 七、常见问题排查

### 问题：登录返回 401

```bash
# 1. 检查 passport 是否正常运行
docker logs fastapi_passport-backend --tail 10

# 2. 检查 fastapi-ant-demo 后端日志
docker logs fastapi-ant-demo-backend --tail 10

# 3. 检查容器内配置
docker exec fastapi-ant-demo-backend grep passport_url /app/config.yaml

# 4. 测试网络连通
docker exec fastapi-ant-demo-backend python -c "
import httpx, asyncio
async def t():
    async with httpx.AsyncClient(timeout=5) as c:
        r = await c.get('http://fastapi_passport-backend:8888/health')
        print(r.status_code, r.json())
asyncio.run(t())
"
```

### 问题：页面看不到操作按钮

原因：用户没有该项目的按钮权限。

解决：
1. 登录 passport 后台 (`http://passport.ops.com` 或 `http://10.225.138.183:8084`)
2. 「用户管理」→ 编辑用户 → 分配 `fastapi-ant-demo` 项目的 `super_admin` 或 `admin` 角色
3. 重新登录 fastapi-ant-demo

### 问题：菜单不显示

原因：passport 中 `fastapi-ant-demo` 项目的菜单未配置或角色未分配菜单。

解决：
1. passport 后台 → 「菜单管理」→ 选择 `fastapi-ant-demo` 项目 → 确认菜单存在
2. passport 后台 → 「角色管理」→ 编辑角色 → 分配菜单
3. 重新登录

### 问题：修改 config.yaml 后不生效

原因：容器内 Python 进程启动时读取配置，修改后需重启。

```bash
docker restart fastapi-ant-demo-backend
```

### 问题：docker compose 命令影响其他项目

原因：在错误目录执行了 `docker compose` 命令。

解决：**始终用脚本部署，不要手动 `docker compose`：**

```bash
# 正确
bash /data_ca/fastapi-ant-demo/docker_deploy/deploy.sh up
bash /data_ca/fastapi_passport/docker_deploy/deploy.sh up

# 错误（可能影响其他项目）
cd /data_ca/docker_deploy && docker compose up -d
```

---

## 八、本地开发

### 后端

```bash
cd E:\yoka\01_ops_project\fastapi-ant-demo\backend
.venv\Scripts\python.exe -m app.main
```

### 前端

```bash
cd E:\yoka\01_ops_project\fastapi-ant-demo\frontend
npm run dev
```

### 本地 config.yaml

本地开发时 `passport_url` 改为：

```yaml
passport_url: http://localhost:8888
```

---

## 九、文件变更清单

### 后端变更

| 文件 | 变更说明 |
|------|---------|
| `config/config.yaml` | 新增 `passport_url` 配置 |
| `app/config.py` | 新增 `passport_url` 字段加载 |
| `app/common/passport_client.py` | **新增** — passport HTTP 客户端 + 管理接口代理 |
| `app/common/deps.py` | `get_current_user` 改为从 JWT 解析，不再查本地 DB |
| `app/api/v1/endpoints/system/auth.py` | 登录/退出转调 passport，`/me` 从 passport 获取权限 |
| `app/api/v1/endpoints/system/admin_proxy.py` | **新增** — 用户/角色/菜单 CRUD 代理到 passport |
| `app/api/v1/api.py` | 注册 `admin_proxy_router`，移除旧的本地 user/role/menu 路由 |
| `app/api/v1/endpoints/system/operation_log.py` | 适配新的 `get_current_user` 返回类型 |
| `app/main.py` | 移除 `seed_initial_data()` |
| `app/first_init_sql.py` | 不再执行（角色/菜单迁移至 passport） |
| `scripts/init_config.sql` | 移除 user/role/menu 建表语句 |

### 前端变更

| 文件 | 变更说明 |
|------|---------|
| `src/App.tsx` | 恢复 UserList/RoleList/MenuList 路由 |
| `src/pages/Home.tsx` | 数据统计走 passport 代理接口 |

### Docker 变更

| 文件 | 变更说明 |
|------|---------|
| `docker_deploy/docker-compose.yml` | 加入 `passport-net` 外部网络 |
| `docker_deploy/deploy.sh` | 新增 `up` / `rebuild` 双模式 |

---

## 十、后续接入新系统

如需让其他系统（如 ddos-hunter）也接入 passport：

1. 在 passport 数据库执行种子 SQL，注册新项目（修改 `project_code`）
2. 复制 `passport_client.py` 到新项目，修改 `PROJECT_CODE`
3. 复制 `admin_proxy.py` 到新项目
4. `config.yaml` 配置相同的 `secret_key` 和 `passport_url`
5. `docker-compose.yml` 加入 `fastapi_passport_ops-net` 外部网络
6. 删除新项目本地的 user/role/menu 表
