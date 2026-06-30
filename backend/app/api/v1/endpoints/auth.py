"""认证接口：LDAP 登录、获取当前用户信息、SSO 登出。"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.common.ldap_api import ldap_verify
from app.common.deps import get_current_user, security_scheme
from app.config import bootstrap_config
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.admin.models import User, Role
from app.admin.services import get_user_by_username, get_user_permissions, get_user_menus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["认证"])


# ────── Schema ──────

class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    is_superuser: bool = False
    roles: list[str] = []
    permissions: list[str] = []

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


# ────── API ──────

@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """LDAP 认证登录。

    1. 调用 LDAP 服务验证用户名密码
    2. 验证通过后，若本地用户不存在则自动创建（游客角色）
    3. 返回 JWT 令牌
    """
    # ── LDAP 验证 ──
    ldap_result = await ldap_verify(payload.username, payload.password)
    if ldap_result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="LDAP 服务不可用，请联系管理员",
        )

    # ── 提取 LDAP 返回的用户信息 ──
    ldap_success = ldap_result.get("success", False)
    if not ldap_success:
        ldap_msg = ldap_result.get("msg") or "用户名或密码错误"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"LDAP 认证失败：{ldap_msg}",
        )

    ldap_username = (
        ldap_result.get("username", [None])[0]
        if isinstance(ldap_result.get("username"), list)
        else ldap_result.get("username", payload.username)
    )
    ldap_mail = (
        ldap_result.get("mail", [None])[0]
        if isinstance(ldap_result.get("mail"), list)
        else ldap_result.get("mail")
    )

    # ── 查找或创建本地用户 ──
    user = get_user_by_username(db, ldap_username or payload.username)

    if not user:
        # 新用户：以游客身份自动创建
        guest_role = db.query(Role).filter(Role.name == "guest").first()
        user = User(
            username=ldap_username or payload.username,
            email=ldap_mail,
            hashed_password="",  # LDAP 用户无需本地密码
            is_active=True,
            is_superuser=False,
        )
        if guest_role:
            user.roles.append(guest_role)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"新用户通过 LDAP 自动创建: {user.username}")
    else:
        # 已有用户：同步 LDAP 信息
        if ldap_mail and user.email != ldap_mail:
            user.email = ldap_mail
        if ldap_username and user.username != ldap_username:
            user.username = ldap_username
        db.commit()
        db.refresh(user)

    # ── 生成 JWT ──
    access_token = create_access_token(user.id, user.username)

    # 种 Cookie 到 .ops.com 域，实现同域下所有系统 SSO
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        domain=bootstrap_config.security.cookie_domain,
        httponly=True,
        secure=False,  # 内网可设 False，公网请配合 HTTPS 设为 True
        samesite="lax",
    )

    return LoginResponse(
        access_token=access_token,
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            is_superuser=user.is_superuser,
            roles=[r.name for r in user.roles],
            permissions=get_user_permissions(db, user),
        ),
    )


@router.get("/me", response_model=UserInfo)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取当前登录用户信息（支持 Cookie SSO 自动认证）。"""
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_superuser=current_user.is_superuser,
        roles=[r.name for r in current_user.roles],
        permissions=get_user_permissions(db, current_user),
    )


@router.get("/menus")
def get_my_menus(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取当前用户可见的菜单树（用于前端动态渲染侧边栏）。"""
    return get_user_menus(db, current_user)


@router.post("/logout")
def logout(response: Response):
    """退出登录，清除 SSO Cookie。"""
    response.delete_cookie(
        key="access_token",
        domain=bootstrap_config.security.cookie_domain,
    )
    return {"msg": "已退出登录"}
