"""FastAPI 通用依赖：当前用户、分页参数等。

登录认证已迁移至 Passport 认证中心。
JWT 由 passport 签发，本系统使用共享的 secret_key 本地验证。
不再依赖本地 user 表查询用户。
"""
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)


def _resolve_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials],
) -> Optional[str]:
    """优先从 Authorization 头读取，其次从 Cookie 读取。"""
    if credentials:
        return credentials.credentials
    token = request.cookies.get("access_token")
    return token or None


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    """从 JWT 令牌解析当前登录用户（令牌由 passport 签发）。

    Returns:
        {"id": int, "username": str, "project_code": str}
    """
    token = _resolve_token(request, credentials)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌",
        )
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌无效或已过期",
        )
    return {
        "id": int(payload.sub),
        "username": payload.username,
        "project_code": getattr(payload, "project_code", ""),
    }


def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Optional[Dict[str, Any]]:
    """可选登录：有令牌则解析用户，无则返回 None。"""
    token = _resolve_token(request, credentials)
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return {
        "id": int(payload.sub),
        "username": payload.username,
        "project_code": getattr(payload, "project_code", ""),
    }
