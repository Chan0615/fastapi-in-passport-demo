"""系统管理 Pydantic 校验模型。"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ═══════════════ 菜单 ═══════════════

class MenuBase(BaseModel):
    name: str
    menu_type: str = "menu"
    path: str = ""
    icon: str = ""
    permission: str = ""
    parent_id: Optional[int] = None
    sort_order: int = 0
    is_visible: Optional[bool] = True


class MenuCreate(MenuBase):
    pass


class MenuUpdate(BaseModel):
    name: Optional[str] = None
    menu_type: Optional[str] = None
    path: Optional[str] = None
    icon: Optional[str] = None
    permission: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None
    is_visible: Optional[bool] = None


class MenuOut(MenuBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════ 角色 ═══════════════

class RoleBase(BaseModel):
    name: str
    description: str = ""
    is_active: Optional[bool] = True


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RoleOut(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    menus: List[MenuOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class RoleBrief(BaseModel):
    """角色简要信息（嵌套在用户返回中）。"""
    id: int
    name: str
    description: str = ""


class RoleMenuAssign(BaseModel):
    """为角色分配菜单/按钮权限。"""
    menu_ids: List[int]


# ═══════════════ 用户 ═══════════════

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    roles: List[RoleBrief] = []
    permissions: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserRoleAssign(BaseModel):
    """为用户分配角色。"""
    role_ids: List[int]
