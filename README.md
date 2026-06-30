# 运维管理系统

基于 FastAPI + React + Ant Design 的运维管理系统，LDAP 统一认证，按钮级权限控制，Docker Compose 一键部署。

---

## 目录结构

```
fastapi-ant-demo/
├── backend/                         # 后端
│   ├── app/
│   │   ├── common/                  # 通用模块（database/deps/ldap_api/redisdb/mongodb）
│   │   ├── core/                    # 安全认证（security.py: JWT + 密码哈希）
│   │   ├── admin/                   # 系统管理模块（用户/角色/菜单）
│   │   ├── models/                  # 通用数据模型
│   │   ├── schemas/                 # 通用校验模型
│   │   ├── services/                # 通用业务逻辑
│   │   ├── api/v1/endpoints/        # API 路由
│   │   ├── config.py                # 启动配置读取
│   │   ├── first_init_sql.py        # 种子数据初始化
│   │   └── main.py                  # FastAPI 入口
│   ├── scripts/                     # SQL 脚本
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                        # 前端
│   ├── src/
│   │   ├── contexts/                # 全局状态（AuthContext）
│   │   ├── components/              # 公共组件（Auth/IconPicker/ProtectedRoute）
│   │   ├── layouts/                 # 布局（BasicLayout）
│   │   ├── pages/                   # 页面（按功能模块分目录）
│   │   ├── services/                # API 封装
│   │   └── utils/                   # 工具函数
│   ├── nginx/nginx.conf             # 容器内 Nginx 配置
│   ├── Dockerfile
│   └── package.json
├── config/                          # 配置文件
│   ├── config.yaml                  # 启动配置
│   └── config.yaml.example
├── docker_deploy/                   # 部署相关
│   ├── docker-compose.yml
│   └── nginx/ops.conf.example       # 宿主机 Nginx 配置模板
├── .codebuddy/                      # AI 开发规范
│   ├── rules/project-structure.md
│   └── skills/ops-dev-conventions/  # 项目 Skill（新成员 AI 自动学习）
└── README.md
```

---

## 系统架构

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3.12、FastAPI、SQLAlchemy 2.0、Pydantic、PyMySQL、python-jose |
| 前端 | React 18、Ant Design 5、Vite、TypeScript、Axios |
| 部署 | Docker、Docker Compose、Nginx |
| 数据库 | MySQL 8.0、Redis 7、MongoDB 7 |

### 认证流程

```
用户输入账号密码 → POST /api/v1/auth/login
  → LDAP login-new 验证 → 通过
  → 本地 user 表查/建用户 → 新用户自动分配 guest 角色
  → 生成 JWT → 种 Cookie 到 .ops.com 域（SSO 免密）
  → 返回 token + user info（含 permissions 权限列表）
```

### 权限模型

```
用户 → 角色 → 菜单/按钮（menu_type: directory/menu/button）
                   └── permission: "user:add" / "user:edit" ...
```

| 角色 | 说明 | 权限 |
|------|------|------|
| `guest` | 游客（LDAP 新用户默认） | 仅首页 |
| `admin` | 管理员 | 首页 + 业务模块（不含系统管理） |
| `super_admin` | 超级管理员 | 全部 |

前端通过 `<Auth permission="user:edit">` 组件控制按钮显隐，超级管理员自动拥有所有权限。

### 配置管理

| 配置类型 | 存储位置 | 示例 |
|----------|----------|------|
| 系统配置 | `config/config.yaml` | LDAP 地址、上传下载目录、应用名称 |
| 安全配置 | `config/config.yaml` | secret_key、CORS、cookie_domain |
| 引导数据库 | `config/config.yaml` | MySQL 连接信息（仅这一个） |
| 业务数据库连接 | 数据库表 | `mysql_info` / `redis_info` / `mongo_info` |

> **原则**：只有引导数据库连接信息在 config.yaml，其他 MySQL/Redis/Mongo 连接信息都存数据库表，通过 API 管理。

---

## 一、本地开发

### 1.1 后端

```bash
cd backend

# 创建虚拟环境
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

# 安装依赖
pip install -r requirements.txt

# 配置文件
cp ../config/config.yaml.example ../config/config.yaml
# 编辑 config.yaml 填写真实的 MySQL 和 LDAP 地址

# 启动（自动建库建表 + 种子数据）
cd app
python main.py
```

访问 `http://localhost:8000/docs` 查看 API 文档。

### 1.2 前端

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

访问 `http://localhost:3000`。

> Vite 已配置代理，`/api` 请求自动转发到 `http://localhost:8000`。

---

## 二、Docker 安装

### 2.1 CentOS / RHEL

```bash
yum install -y yum-utils
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl start docker && systemctl enable docker
docker --version && docker compose version
```

### 2.2 Ubuntu / Debian

```bash
apt-get update
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl start docker && systemctl enable docker
```

### 2.3 镜像加速（国内推荐）

```bash
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]
}
EOF
systemctl daemon-reload && systemctl restart docker
```

---

## 三、Nginx 安装（宿主机）

宿主机 Nginx 将 80 端口反向代理到 Docker 前端容器（8080）。

### 3.1 安装

```bash
# CentOS
yum install -y nginx
# Ubuntu
apt-get install -y nginx

systemctl start nginx && systemctl enable nginx
```

### 3.2 配置反向代理

```bash
cp docker_deploy/nginx/ops.conf.example /etc/nginx/conf.d/ops.conf
vim /etc/nginx/conf.d/ops.conf
```

修改 `server_name` 为实际域名：

```nginx
server {
    listen 80;
    server_name ops.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
nginx -t && nginx -s reload
```

---

## 四、部署项目

### 4.1 准备配置

只需修改一份 `config/config.yaml`，所有配置集中在这一个文件：

```bash
cd /opt/fastapi-ant-demo
cp config/config.yaml.example config/config.yaml
vim config/config.yaml
```

`config.yaml` 关键配置：
```yaml
system_root:
  ldap: http://ldap.api.com:9099
  download_dir: download/
  upload_dir: upload/

app:
  name: 运维管理系统
  version: 1.0.0
  debug: false

security:
  secret_key: 生产环境请改成随机字符串
  cors_origins:
    - "*"
  cookie_domain: .your-domain.com      # 域名根域，用于 SSO

mysql:
  system_default_db:
    db_addr: mysql                      # Docker 内服务名，不要改
    db_port: 3306
    db_user: root
    db_password: CAr8RvRA              # ← 改成你的 MySQL 密码
    db_name: kefu_attack_system
```

> **注意**：
> - `db_addr` 用 Docker 服务名 `mysql`，不是 IP
> - `db_password` 和 `db_name` 会自动同步到 MySQL 容器（通过 deploy.sh）
> - `cookie_domain` 改成你的实际域名根域

### 4.2 构建启动

```bash
cd docker_deploy

# 一键部署（自动从 config.yaml 提取 MySQL 密码，生成 .env，再启动）
bash deploy.sh up

# 其他命令
bash deploy.sh down       # 停止
bash deploy.sh restart    # 重启
bash deploy.sh build      # 重新构建
bash deploy.sh logs       # 查看日志
```

`deploy.sh` 会自动：
1. 从 `config/config.yaml` 读取 MySQL 密码和数据库名
2. 生成 `.env` 文件供 docker-compose 使用
3. 启动所有容器

> 修改了 `config.yaml` 中的 MySQL 密码后，重新执行 `bash deploy.sh up` 即可同步。

### 4.3 验证

```bash
curl http://127.0.0.1:8000/health     # 后端
curl http://127.0.0.1:8080            # 前端
curl http://ops.your-domain.com       # 域名
```

访问 `http://ops.your-domain.com` 看到登录页即部署成功。

---

## 五、端口规划

| 服务 | 容器端口 | 宿主机映射 | 说明 |
|------|---------|-----------|------|
| 前端 Nginx | 80 | 8080 | 静态文件 + API 代理 |
| 后端 FastAPI | 8000 | 不映射 | 仅容器内网 |
| MySQL | 3306 | 3306（可关闭） | 数据库 |
| Redis | 6379 | 6379（可关闭） | 缓存 |
| MongoDB | 27017 | 27017（可关闭） | 文档库 |

### 访问链路

```
用户浏览器 → 域名:80 → 宿主机Nginx → Docker前端:8080 → 静态文件
                                                  ↘ /api/ → Docker后端:8000
```

### 生产环境关闭数据库外部端口

```yaml
mysql:
  expose: ["3306"]      # 替代 ports
redis:
  expose: ["6379"]
mongo:
  expose: ["27017"]
```

---

## 六、数据管理

### 6.1 自动初始化

后端启动时自动完成：
1. `CREATE DATABASE IF NOT EXISTS`（建库）
2. `Base.metadata.create_all()`（建表）
3. `seed_initial_data()`（种子数据，仅首次）

种子数据内容：
- **角色**：guest / admin / super_admin
- **菜单**：首页 + 系统管理（用户/角色/菜单）+ 按钮权限
- **角色-菜单关联**：super_admin 全部，admin 仅首页，guest 仅首页

### 6.2 重置权限数据

需要重新初始化角色和菜单时，清空相关表后重启：

```sql
USE kefu_attack_system;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE role_menu;
TRUNCATE TABLE user_role;
TRUNCATE TABLE menu;
TRUNCATE TABLE role;
SET FOREIGN_KEY_CHECKS = 1;
```

重启后端后自动重新插入种子数据。

> **注意**：`user` 表不会清空，已登录过的用户不受影响，但需要重新分配角色。

### 6.3 手动初始化（可选）

也可以直接执行 SQL 脚本：

```bash
docker exec -i ops-mysql mysql -uroot -p'密码' kefu_attack_system < backend/scripts/init_config.sql
```

### 6.4 数据备份

```bash
# 手动备份
docker exec ops-mysql mysqldump -uroot -p'密码' kefu_attack_system > backup_$(date +%Y%m%d).sql

# 恢复
docker exec -i ops-mysql mysql -uroot -p'密码' kefu_attack_system < backup_20260630.sql

# 定时备份（crontab -e）
0 2 * * * docker exec ops-mysql mysqldump -uroot -p'密码' kefu_attack_system > /opt/backup/mysql_$(date +\%Y\%m\%d).sql
```

---

## 七、常用运维命令

```bash
cd /opt/fastapi-ant-demo/docker_deploy

docker compose up -d                    # 启动全部
docker compose down                     # 停止全部
docker compose restart backend          # 重启后端
docker compose logs -f backend          # 查看日志
docker compose up -d --build backend    # 重新构建后端
docker compose down -v                  # 清理数据卷（谨慎！）
```

### 更新部署

```bash
cd /opt/fastapi-ant-demo
git pull origin main
cd docker_deploy
docker compose up -d --build            # 全部重建
# 或单独重建
docker compose up -d --build backend
docker compose up -d --build frontend
```

---

## 八、故障排查

### 容器起不来

```bash
docker compose ps
docker compose logs backend
docker compose logs frontend
```

### 数据库连不上

```bash
# 检查 config.yaml 中 db_addr 是否为 mysql（Docker 服务名）
docker compose ps mysql
docker exec -it ops-backend python -c "from app.config import bootstrap_config; print(bootstrap_config.database_url)"
```

### 前端白屏

```bash
docker compose logs frontend
docker exec ops-frontend nginx -t
```

### 域名访问不了

```bash
nslookup ops.your-domain.com       # DNS 解析
nginx -t                             # Nginx 配置
systemctl status nginx
firewall-cmd --permanent --add-port=80/tcp && firewall-cmd --reload
```

### LDAP 登录失败

```bash
# 检查 config.yaml 中 ldap 地址
docker exec -it ops-backend python -c "
import httpx
resp = httpx.post('http://ldap.api.com:9099/login-new', json={'username':'test','password':'test','ouname':'dobest'})
print(resp.status_code, resp.json())
"
```

---

## 九、HTTPS 配置（可选）

```bash
# 申请证书
yum install -y certbot python3-certbot-nginx
certbot --nginx -d ops.your-domain.com
```

或手动配置 `/etc/nginx/conf.d/ops.conf`：

```nginx
server {
    listen 80;
    server_name ops.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ops.your-domain.com;
    ssl_certificate /etc/letsencrypt/live/ops.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ops.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
nginx -t && nginx -s reload
```

---

## 十、新成员接入

项目内置 AI 开发规范（`.codebuddy/skills/ops-dev-conventions/`），新成员使用 CodeBuddy 打开本项目后，AI 会自动学习以下约定：

- 后端分层结构（endpoints → services → models/schemas）
- 前端模块化命名（kebab-case 目录 + PascalCase 组件）
- 认证权限模型（LDAP + JWT + Auth 组件）
- 配置管理原则（config.yaml vs 数据库表）
- API 接口规范和权限标识

无需额外配置，clone 项目即可生效。

---

## 许可证

MIT
