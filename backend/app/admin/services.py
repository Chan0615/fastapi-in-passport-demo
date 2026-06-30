"""系统管理业务逻辑：用户、角色、菜单 CRUD。"""
import logging
from typing import List, Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload

from app.admin.models import User, Role, Menu

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ═══════════════ 工具函数 ═══════════════

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ═══════════════ 用户 ═══════════════

def get_user_list(db: Session) -> List[User]:
    return db.query(User).options(joinedload(User.roles)).all()


def get_user_by_id(db: Session, pk: int) -> Optional[User]:
    return db.query(User).options(joinedload(User.roles)).filter(User.id == pk).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_permissions(db: Session, user: User) -> List[str]:
    """获取用户所有权限标识（通过角色关联的按钮权限）。"""
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


# ═══════════════ 角色 ═══════════════

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


# ═══════════════ 菜单 ═══════════════

def get_menu_list(db: Session) -> List[Menu]:
    return db.query(Menu).all()


def get_menu_tree(db: Session) -> List[Menu]:
    """获取菜单树（仅顶级菜单，子菜单通过 children 属性访问）。"""
    return db.query(Menu).filter(Menu.parent_id.is_(None)).order_by(Menu.sort_order).all()


def get_menu_by_id(db: Session, pk: int) -> Optional[Menu]:
    return db.query(Menu).filter(Menu.id == pk).first()


def create_menu(db: Session, data: dict) -> Menu:
    obj = Menu(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_menu(db: Session, pk: int, data: dict) -> Optional[Menu]:
    obj = get_menu_by_id(db, pk)
    if not obj:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_menu(db: Session, pk: int) -> bool:
    obj = get_menu_by_id(db, pk)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


# ═══════════════ 用户菜单树 ═══════════════

def get_user_menus(db: Session, user: User) -> List[dict]:
    """获取当前用户可见的菜单树（仅 directory 和 menu，不含 button）。

    超级管理员拥有全部菜单；普通用户根据角色关联的菜单过滤。
    """
    if user.is_superuser:
        menus = (
            db.query(Menu)
            .filter(Menu.menu_type != "button")
            .filter(Menu.is_visible == True)
            .order_by(Menu.sort_order)
            .all()
        )
    else:
        # 收集用户所有启用角色关联的菜单
        menu_ids = set()
        for role in user.roles:
            if not role.is_active:
                continue
            for m in role.menus:
                menu_ids.add(m.id)

        if not menu_ids:
            return []

        menus = (
            db.query(Menu)
            .filter(Menu.id.in_(menu_ids))
            .filter(Menu.menu_type != "button")
            .filter(Menu.is_visible == True)
            .order_by(Menu.sort_order)
            .all()
        )

    # 构建树形结构
    menu_map = {}
    for m in menus:
        menu_map[m.id] = {
            "id": m.id,
            "name": m.name,
            "path": m.path,
            "icon": m.icon,
            "parent_id": m.parent_id,
            "sort_order": m.sort_order,
            "children": [],
        }

    tree = []
    for m in menus:
        node = menu_map[m.id]
        if m.parent_id and m.parent_id in menu_map:
            menu_map[m.parent_id]["children"].append(node)
        else:
            tree.append(node)

    return tree
