"""FastAPI 通用依赖：当前用户、分页参数等。

支持两种认证方式：
1. Authorization: Bearer <token> 请求头
2. access_token Cookie（*.ops.com 域共享，实现 SSO 免密登录）
"""
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.core.security import decode_access_token
from app.admin.models import User

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
    db: Session = Depends(get_db),
) -> User:
    """从 JWT 令牌解析当前登录用户（支持 Bearer 头 / Cookie）。"""
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
    user = db.query(User).filter(User.id == int(payload.sub)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已禁用",
        )
    return user


def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """可选登录：有令牌则解析用户，无则返回 None。"""
    token = _resolve_token(request, credentials)
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user = db.query(User).filter(User.id == int(payload.sub)).first()
    return user if user and user.is_active else None
