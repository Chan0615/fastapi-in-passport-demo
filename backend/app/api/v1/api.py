"""V1 API 路由聚合。"""
from fastapi import APIRouter

from app.api.v1.endpoints import config, db_config, auth, operation_log
from app.admin.api import router as admin_router

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(config.router, prefix="/config", tags=["config"])
api_router.include_router(db_config.router, tags=["db-config"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(operation_log.router, tags=["操作日志"])
