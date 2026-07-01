"""用户菜单相关服务。"""
from __future__ import annotations

from typing import List, Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload

from app.admin.models import Role, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_user_list(db: Session) -> List[User]:
    return db.query(User).options(joinedload(User.roles)).all()


def get_user_by_id(db: Session, pk: int) -> Optional[User]:
    return db.query(User).options(joinedload(User.roles)).filter(User.id == pk).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_permissions(user: User) -> List[str]:
    if user.is_superuser:
        return ["*"]

    permissions = set()
    for role in user.roles:
        if not role.is_active:
            continue
        for menu in role.menus:
            if menu.menu_type == "button" and menu.permission:
                permissions.add(menu.permission)
    return list(permissions)


def create_user(db: Session, data: dict) -> User:
    if "password" in data:
        data["hashed_password"] = hash_password(data.pop("password"))
    obj = User(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_user(db: Session, pk: int, data: dict) -> Optional[User]:
    obj = get_user_by_id(db, pk)
    if not obj:
        return None
    if "password" in data:
        data["hashed_password"] = hash_password(data.pop("password"))
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_user(db: Session, pk: int) -> bool:
    obj = get_user_by_id(db, pk)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def assign_roles_to_user(db: Session, user_id: int, role_ids: List[int]) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
    user.roles = roles
    db.commit()
    db.refresh(user)
    return user
