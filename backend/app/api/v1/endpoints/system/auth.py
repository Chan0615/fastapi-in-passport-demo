"""认证接口。

登录/登出/获取菜单/获取权限 均通过 Passport 认证中心完成。
JWT 由 passport 签发，本系统使用共享 secret_key 本地验证。
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from app.common.deps import get_current_user
from app.common.passport_client import (
    PROJECT_CODE,
    passport_login,
    passport_logout,
    passport_menus,
)
from app.config import bootstrap_config
from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ────── 请求/响应模型 ──────

class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    is_superuser: bool = False
    roles: List[str] = []
    permissions: List[str] = []

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


# ────── 接口 ──────

@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response):
    """登录接口：转调 passport 认证中心。

    passport 验证 LDAP 身份 → 签发 JWT → 返回 token + 用户 + 菜单 + 权限。
    本接口设置本地 Cookie 实现 SSO。
    """
    data = await passport_login(payload.username, payload.password)
    if data is None or data.get("detail"):
        msg = (data or {}).get("detail", "登录失败")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=msg
        )

    access_token = data["access_token"]
    passport_user = data.get("user", {})
    passport_menus_data = data.get("menus", [])
    passport_permissions = data.get("permissions", [])

    # 设置本地 Cookie（与 passport 共享 .ops.com 域，实现 SSO）
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        domain=bootstrap_config.security.cookie_domain,
        httponly=True,
        secure=False,
        samesite="lax",
    )

    return LoginResponse(
        access_token=access_token,
        user=UserInfo(
            id=passport_user.get("id", 0),
            username=passport_user.get("username", ""),
            email=passport_user.get("email"),
            is_superuser=passport_user.get("is_superuser", False),
            roles=data.get("roles", []),
            permissions=passport_permissions,
        ),
    )


@router.get("/me", response_model=UserInfo)
async def get_me(request: Request):
    """获取当前用户信息（从 passport 获取 is_superuser 和权限）。"""
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token", "")

    if not token:
        raise HTTPException(status_code=401, detail="未登录")

    from app.common.passport_client import passport_me, passport_user_permissions

    user_data = await passport_me(token)
    perms = await passport_user_permissions(token)

    if not user_data:
        raise HTTPException(status_code=401, detail="令牌无效")

    return UserInfo(
        id=user_data.get("id", 0),
        username=user_data.get("username", ""),
        email=user_data.get("email"),
        is_superuser=user_data.get("is_superuser", False),
        permissions=perms,
    )


@router.get("/menus")
async def get_my_menus(
    request: Request,
    _user: Dict[str, Any] = Depends(get_current_user),
):
    """获取当前用户在 fastapi-ant-demo 项目下的菜单树（来自 passport）。"""
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        return []

    menus = await passport_menus(token)
    return menus


@router.post("/logout")
async def logout(response: Response):
    """退出登录：清除本地 Cookie 并通知 passport。"""
    response.delete_cookie(key="access_token", domain=bootstrap_config.security.cookie_domain)
    await passport_logout()
    return {"msg": "已退出登录"}
