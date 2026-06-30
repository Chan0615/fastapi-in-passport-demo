"""操作日志装饰器。

用法：
    from app.common.log_decorator import log_operation

    @router.post("/users")
    @log_operation(module="用户管理", action="create")
    def create_user(request, payload, db, current_user):
        ...

需要被装饰的函数声明 request: Request 参数。
"""
import functools
import json
import logging
import time
from typing import Callable, Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app.common.database import SessionLocal
from app.models.operation_log import OperationLog

logger = logging.getLogger(__name__)

_EXCLUDE_PATHS = ["/api/v1/auth/me", "/api/v1/config", "/health", "/docs", "/openapi", "/redoc"]


def log_operation(module: str = "", action: str = "") -> Callable:
    """操作日志装饰器。"""

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(request: Request, *args, **kwargs):
            if any(request.url.path.startswith(p) for p in _EXCLUDE_PATHS):
                return func(*args, **kwargs)

            start_time = time.time()

            current_user = kwargs.get("current_user")
            user_id = getattr(current_user, "id", None) if current_user else None
            username = getattr(current_user, "username", None) if current_user else None

            method = request.method
            path = request.url.path
            ip = (
                request.headers.get("X-Real-IP")
                or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                or (request.client.host if request.client else "")
            )

            # 提取参数
            params = {}
            for key in ("payload", "pk", "id"):
                val = kwargs.get(key)
                if val is not None:
                    if hasattr(val, "model_dump"):
                        params.update(val.model_dump())
                    else:
                        params[key] = str(val)

            status_code = 200
            error_msg = ""
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                status_code = getattr(e, "status_code", 500)
                error_msg = f"{type(e).__name__}: {str(e)}"
                logger.error(f"操作异常 [{module}/{action}]: {error_msg}")
                raise
            finally:
                cost_ms = int((time.time() - start_time) * 1000)
                try:
                    log_db = SessionLocal()
                    log = OperationLog(
                        user_id=user_id,
                        username=username,
                        module=module,
                        action=action,
                        method=method,
                        path=path,
                        params=json.dumps(params, ensure_ascii=False, default=str)[:2000],
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

        return wrapper

    return decorator
