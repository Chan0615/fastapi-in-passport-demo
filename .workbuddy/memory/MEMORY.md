# 项目长期记忆

## 开发模板约定

- 模板采用 FastAPI + Ant Design + Docker Compose 前后端分离架构。
- 后端配置分层：
  - 启动配置：仅 `backend/bootstrap.yaml`（或环境变量 `DATABASE_URL`）保存主数据库地址。
  - 运行配置：全部基础设施与业务配置（Redis、MongoDB、外部 API、密钥、CORS、功能开关等）存储在 MySQL `sys_config` 表，通过 `ConfigManager` 启动加载、内存缓存、支持加密与热重载。
- 新增 `sys_config` 表变更或初始化时，使用 `backend/scripts/init_config.sql`。
- 模板 skill 已保存为 `fastapi-antd-template`，可复用生成相同架构项目。
