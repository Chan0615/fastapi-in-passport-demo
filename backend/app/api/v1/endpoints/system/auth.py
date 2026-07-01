"""认证接口。"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.admin.models import Role, User
from app.common.database import get_db
from app.common.deps import get_current_user
from app.common.ldap_api import ldap_verify
from app.config import bootstrap_config
from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token
from app.services.system.menu_service import get_user_menus
from app.services.system.user_service import get_user_by_username, get_user_permissions

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


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


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    ldap_result = await ldap_verify(payload.username, payload.password)
    if ldap_result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="LDAP 服务不可用")

    if not ldap_result.get("success", False):
        ldap_msg = ldap_result.get("msg") or "用户名或密码错误"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"LDAP 认证失败: {ldap_msg}")

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

    user = get_user_by_username(db, ldap_username or payload.username)
    if not user:
        guest_role = db.query(Role).filter(Role.name == "guest").first()
        user = User(
            username=ldap_username or payload.username,
            email=ldap_mail,
            hashed_password="",
            is_active=True,
            is_superuser=False,
        )
        if guest_role:
            user.roles.append(guest_role)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("LDAP 新用户自动创建: %s", user.username)
    else:
        if ldap_mail and user.email != ldap_mail:
            user.email = ldap_mail
        if ldap_username and user.username != ldap_username:
            user.username = ldap_username
        db.commit()
        db.refresh(user)

    access_token = create_access_token(user.id, user.username)
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
            id=user.id,
            username=user.username,
            email=user.email,
            is_superuser=user.is_superuser,
            roles=[r.name for r in user.roles],
            permissions=get_user_permissions(user),
        ),
    )


@router.get("/me", response_model=UserInfo)
def get_me(current_user: User = Depends(get_current_user)):
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_superuser=current_user.is_superuser,
        roles=[r.name for r in current_user.roles],
        permissions=get_user_permissions(current_user),
    )


@router.get("/menus")
def get_my_menus(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_menus(db, current_user)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", domain=bootstrap_config.security.cookie_domain)
    return {"msg": "已退出登录"}
