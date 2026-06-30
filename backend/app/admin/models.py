"""系统管理数据模型：用户、角色、菜单。"""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.common.database import Base

# ─────────────────── 关联表 ───────────────────

user_role = Table(
    "user_role",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("user.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("role.id", ondelete="CASCADE"), primary_key=True),
)

role_menu = Table(
    "role_menu",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("role.id", ondelete="CASCADE"), primary_key=True),
    Column("menu_id", Integer, ForeignKey("menu.id", ondelete="CASCADE"), primary_key=True),
)


# ─────────────────── 用户 ───────────────────

class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True, comment="用户名")
    email = Column(String(128), unique=True, nullable=True, comment="邮箱")
    hashed_password = Column(String(256), default="", comment="加密密码（LDAP用户为空）")
    is_active = Column(Boolean, default=True, comment="是否激活")
    is_superuser = Column(Boolean, default=False, comment="是否超级管理员")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    roles = relationship("Role", secondary=user_role, back_populates="users")


# ─────────────────── 角色 ───────────────────

class Role(Base):
    __tablename__ = "role"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(64), unique=True, nullable=False, comment="角色名称")
    description = Column(String(255), default="", comment="角色描述")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    users = relationship("User", secondary=user_role, back_populates="roles")
    menus = relationship("Menu", secondary=role_menu, back_populates="roles")


# ─────────────────── 菜单 ───────────────────

class Menu(Base):
    __tablename__ = "menu"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(64), nullable=False, comment="菜单/按钮名称")
    menu_type = Column(String(16), default="menu", comment="类型：directory=目录 menu=菜单 button=按钮")
    path = Column(String(256), default="", comment="路由路径")
    icon = Column(String(64), default="", comment="图标")
    permission = Column(String(128), default="", comment="权限标识，如 user:add")
    parent_id = Column(Integer, ForeignKey("menu.id"), nullable=True, default=None, comment="父菜单 ID")
    sort_order = Column(Integer, default=0, comment="排序")
    is_visible = Column(Boolean, default=True, comment="是否可见")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    children = relationship("Menu", backref="parent", remote_side=[id])
    roles = relationship("Role", secondary=role_menu, back_populates="menus")


# ─────────────────── 为 UserRole / RoleMenu 提供独立引用 ───────────────────
UserRole = user_role
RoleMenu = role_menu
