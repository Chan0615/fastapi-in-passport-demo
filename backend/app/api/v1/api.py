"""V1 API 路由聚合。

用户/角色/菜单管理通过代理端点转接至 Passport，前端无需改动。
"""
from fastapi import APIRouter

from app.api.v1.endpoints.kefu_attack_system.ddos_events import router as kefu_ddos_router
from app.api.v1.endpoints.system.admin_proxy import router as admin_proxy_router
from app.api.v1.endpoints.system.auth import router as auth_router
from app.api.v1.endpoints.system.config import router as config_router
from app.api.v1.endpoints.system.db_config import router as db_config_router
from app.api.v1.endpoints.system.operation_log import router as operation_log_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(config_router)
api_router.include_router(db_config_router)
api_router.include_router(kefu_ddos_router)
api_router.include_router(operation_log_router)
api_router.include_router(admin_proxy_router)
