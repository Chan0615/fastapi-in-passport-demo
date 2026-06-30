"""操作日志中间件。

全局自动记录所有写操作（POST/PUT/DELETE），无需在每个接口加装饰器。
从 JWT 令牌中解析操作用户信息。
"""
import json
import logging
import time
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.common.database import SessionLocal
from app.core.security import decode_access_token
from app.models.operation_log import OperationLog

logger = logging.getLogger(__name__)

# 不记录日志的路径前缀
_EXCLUDE_PATHS = ["/api/v1/auth/me", "/api/v1/config", "/health", "/docs", "/openapi", "/redoc", "/favicon"]

# 只记录写操作
_WRITE_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

# 路径 → 模块/操作 映射
_PATH_MAP = [
    (r"/api/v1/auth/login", "认证管理", "login"),
    (r"/api/v1/auth/logout", "认证管理", "logout"),
    (r"/api/v1/admin/users/\d+/roles", "用户管理", "assign_roles"),
    (r"/api/v1/admin/users", "用户管理", ""),
    (r"/api/v1/admin/roles/\d+/menus", "角色管理", "assign_menus"),
    (r"/api/v1/admin/roles", "角色管理", ""),
    (r"/api/v1/admin/menus", "菜单管理", ""),
    (r"/api/v1/db-config/mysql", "MySQL配置", ""),
    (r"/api/v1/db-config/redis", "Redis配置", ""),
    (r"/api/v1/db-config/mongo", "MongoDB配置", ""),
]

_METHOD_ACTION = {
    "POST": "create",
    "PUT": "update",
    "DELETE": "delete",
    "PATCH": "update",
}


def _resolve_module_action(path: str, method: str) -> tuple[str, str]:
    """根据请求路径和方法推断模块和操作类型。"""
    import re
    for pattern, module, action in _PATH_MAP:
        if re.search(pattern, path):
            if action:
                return module, action
            return module, _METHOD_ACTION.get(method, method.lower())
    return "", _METHOD_ACTION.get(method, method.lower())


def _get_user_from_request(request: Request) -> tuple[Optional[int], Optional[str]]:
    """从请求头或 Cookie 中解析用户信息。"""
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        return None, None

    payload = decode_access_token(token)
    if not payload:
        return None, None
    return int(payload.sub), payload.username


class OperationLogMiddleware(BaseHTTPMiddleware):
    """操作日志中间件：自动记录所有写操作。"""

    async def dispatch(self, request: Request, call_next):
        # 只记录写操作
        if request.method not in _WRITE_METHODS:
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(p) for p in _EXCLUDE_PATHS):
            return await call_next(request)

        start_time = time.time()

        # 读取请求体（用于记录参数）
        body = b""
        if request.method in ("POST", "PUT", "PATCH"):
            body = await request.body()

        # 执行请求
        try:
            response = await call_next(request)
            status_code = response.status_code
            error_msg = ""
        except Exception as e:
            status_code = 500
            error_msg = f"{type(e).__name__}: {str(e)}"
            logger.error(f"操作异常 [{path}]: {error_msg}")
            raise
        finally:
            cost_ms = int((time.time() - start_time) * 1000)

            # 解析用户
            user_id, username = _get_user_from_request(request)

            # 推断模块和操作
            module, action = _resolve_module_action(path, request.method)

            # 提取 IP
            ip = (
                request.headers.get("X-Real-IP")
                or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                or (request.client.host if request.client else "")
            )

            # 解析参数
            params_str = ""
            if body:
                try:
                    params_str = body.decode("utf-8")[:2000]
                except Exception:
                    params_str = "<binary>"

            # 写入日志
            try:
                log_db = SessionLocal()
                log = OperationLog(
                    user_id=user_id,
                    username=username,
                    module=module,
                    action=action,
                    method=request.method,
                    path=path,
                    params=params_str,
                    ip=ip,
                    status_code=status_code,
                    cost_ms=cost_ms,
                    error_msg=error_msg[:1000],
                )
                log_db.add(log)
                log_db.commit()
            except Exception as log_err:
                logger.error(f"写入操作日志失败: {log_err}")
            finally:
                try:
                    log_db.close()
                except Exception:
                    pass

        return response
