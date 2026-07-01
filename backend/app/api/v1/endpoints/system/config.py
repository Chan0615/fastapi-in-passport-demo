"""系统配置查看接口。"""
from __future__ import annotations

from fastapi import APIRouter

from app.config import bootstrap_config

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/")
def list_config():
    return {
        "app_env": bootstrap_config.app_env,
        "app": bootstrap_config.app.model_dump(),
        "security": bootstrap_config.security.model_dump(),
        "system_root": bootstrap_config.system_root.model_dump(),
        "external_api": bootstrap_config.external_api.model_dump(),
    }
