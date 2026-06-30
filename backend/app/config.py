"""启动配置：所有配置从 config.yaml 读取，只有 MySQL/Redis/Mongo 连接信息存在数据库表。"""
import os
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus

import yaml
from pydantic import BaseModel


# ─────────────────── 配置文件路径解析 ───────────────────

def _resolve_config_path() -> Path:
    """解析启动配置文件路径。

    查找顺序：
    1. 环境变量 CONFIG_PATH
    2. 项目根 config/config.yaml
    3. /app/config.yaml（Docker 容器内挂载）
    """
    for candidate in (
        Path(os.getenv("CONFIG_PATH")) if os.getenv("CONFIG_PATH") else None,
        Path(__file__).resolve().parent.parent.parent / "config" / "config.yaml",
        Path("/app/config.yaml"),
    ):
        if candidate and candidate.exists():
            return candidate
    return Path(__file__).resolve().parent.parent.parent / "config" / "config.yaml"


CONFIG_PATH = _resolve_config_path()


# ─────────────────── 配置模型 ───────────────────

class SystemRootConfig(BaseModel):
    """系统根配置：LDAP 地址、上传下载目录等。"""
    ldap: str = "http://127.0.0.1:8080/api/v1/ldap/login"
    download_dir: str = "download/"
    upload_dir: str = "upload/"


class AppConfig(BaseModel):
    """应用基础配置。"""
    name: str = "FastAPI Template"
    version: str = "0.1.0"
    debug: bool = False


class SecurityConfig(BaseModel):
    """安全相关配置。"""
    secret_key: str = ""
    cors_origins: list[str] = ["*"]
    cookie_domain: str = ".ops.com"


class ExternalApiConfig(BaseModel):
    """外部 API 配置。"""
    example_base_url: str = ""
    example_api_key: str = ""


class BootstrapConfig(BaseModel):
    """启动引导配置：包含所有 config.yaml 中的配置项。"""
    app_env: str = "dev"
    database_url: str = ""
    system_root: SystemRootConfig = SystemRootConfig()
    app: AppConfig = AppConfig()
    security: SecurityConfig = SecurityConfig()
    external_api: ExternalApiConfig = ExternalApiConfig()


# ─────────────────── 配置加载 ───────────────────

def _build_mysql_url(cfg: dict) -> str:
    """根据独立字段拼装 MySQL 连接串。"""
    db_addr = cfg["db_addr"]
    db_port = cfg.get("db_port", 3306)
    db_user = cfg["db_user"]
    db_password = cfg.get("db_password", "")
    db_name = cfg["db_name"]
    return (
        f"mysql+pymysql://{db_user}:{quote_plus(db_password)}"
        f"@{db_addr}:{db_port}/{db_name}?charset=utf8mb4"
    )


def load_bootstrap_config(path: Path = CONFIG_PATH) -> BootstrapConfig:
    """加载启动配置，优先环境变量，其次 config.yaml。"""
    env_app_env = os.getenv("APP_ENV")
    env_database_url = os.getenv("DATABASE_URL")

    # 默认值
    system_root = SystemRootConfig()
    app_cfg = AppConfig()
    security_cfg = SecurityConfig()
    external_api_cfg = ExternalApiConfig()
    database_url = env_database_url or ""

    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

        # 解析 system_root
        root_data = data.get("system_root", {})
        if root_data:
            system_root = SystemRootConfig(**root_data)

        # 解析 app
        app_data = data.get("app", {})
        if app_data:
            app_cfg = AppConfig(**app_data)

        # 解析 security
        sec_data = data.get("security", {})
        if sec_data:
            security_cfg = SecurityConfig(**sec_data)

        # 解析 external_api
        ext_data = data.get("external_api", {})
        if ext_data:
            external_api_cfg = ExternalApiConfig(**ext_data)

        # 解析引导数据库连接
        mysql_cfg = data.get("mysql", {})
        default_db = mysql_cfg.get("system_default_db", {})
        if default_db and not env_database_url:
            database_url = _build_mysql_url(default_db)
            if not env_app_env:
                env_app_env = default_db.get("app_env", "dev")

    if not database_url:
        raise ValueError(
            f"未找到数据库连接信息。请在 {path} 中配置 mysql.system_default_db "
            f"或设置环境变量 DATABASE_URL。"
        )

    return BootstrapConfig(
        app_env=env_app_env or "dev",
        database_url=database_url,
        system_root=system_root,
        app=app_cfg,
        security=security_cfg,
        external_api=external_api_cfg,
    )


bootstrap_config = load_bootstrap_config()
