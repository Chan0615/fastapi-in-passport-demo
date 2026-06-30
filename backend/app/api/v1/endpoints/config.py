"""配置查看接口：列出当前 config.yaml 中加载的全部配置。"""
from fastapi import APIRouter

from app.config import bootstrap_config

router = APIRouter()


@router.get("/")
def list_config():
    """列出当前已加载的配置（生产环境建议加权限控制）。"""
    return {
        "app_env": bootstrap_config.app_env,
        "app": bootstrap_config.app.model_dump(),
        "security": bootstrap_config.security.model_dump(),
        "system_root": bootstrap_config.system_root.model_dump(),
        "external_api": bootstrap_config.external_api.model_dump(),
    }
