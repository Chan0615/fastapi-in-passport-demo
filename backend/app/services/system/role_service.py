"""角色菜单相关服务。"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.admin.models import Menu, Role


def get_role_list(db: Session) -> List[Role]:
    return db.query(Role).options(joinedload(Role.menus)).all()


def get_role_by_id(db: Session, pk: int) -> Optional[Role]:
    return db.query(Role).options(joinedload(Role.menus)).filter(Role.id == pk).first()


def create_role(db: Session, data: dict) -> Role:
    obj = Role(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_role(db: Session, pk: int, data: dict) -> Optional[Role]:
    obj = get_role_by_id(db, pk)
    if not obj:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_role(db: Session, pk: int) -> bool:
    obj = get_role_by_id(db, pk)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def assign_menus_to_role(db: Session, role_id: int, menu_ids: List[int]) -> Optional[Role]:
    role = get_role_by_id(db, role_id)
    if not role:
        return None
    menus = db.query(Menu).filter(Menu.id.in_(menu_ids)).all()
    role.menus = menus
    db.commit()
    db.refresh(role)
    return role
