"""首次启动种子数据初始化。

包含：
- 角色：游客、管理员、超级管理员
- 菜单：首页、系统管理（用户/角色/菜单）+ 按钮权限
- 角色-菜单/权限关联：超级管理员拥有全部，管理员拥有除系统管理外的全部
"""
import logging

from sqlalchemy import text

from app.common.database import SessionLocal

logger = logging.getLogger(__name__)

# ─────────────────── SQL 定义 ───────────────────

# 角色
ROLES_SQL = """
            INSERT INTO role (name, description, is_active)
            VALUES ('guest', '游客（默认角色，仅浏览，等待管理员分配权限）', 1),
                   ('admin', '管理员（拥有除系统管理外的所有权限）', 1),
                   ('super_admin', '超级管理员（拥有所有权限）', 1) \
            """

# 菜单 + 按钮权限
MENUS_SQL = """
INSERT INTO menu (name, menu_type, path, icon, permission, parent_id, sort_order, is_visible) VALUES
('首页', 'menu', '/', 'HomeOutlined', '', NULL, 1, 1),
('系统管理', 'directory', '', 'SettingOutlined', '', NULL, 2, 1),
('用户管理', 'menu', '/admin/users', 'UserOutlined', '', 2, 1, 1),
('角色管理', 'menu', '/admin/roles', 'SafetyOutlined', '', 2, 2, 1),
('菜单管理', 'menu', '/admin/menus', 'AppstoreOutlined', '', 2, 3, 1),
('新增用户', 'button', '', '', 'user:add', 3, 1, 1),
('编辑用户', 'button', '', '', 'user:edit', 3, 2, 1),
('删除用户', 'button', '', '', 'user:delete', 3, 3, 1),
('分配角色', 'button', '', '', 'user:assign', 3, 4, 1),
('新增角色', 'button', '', '', 'role:add', 4, 1, 1),
('编辑角色', 'button', '', '', 'role:edit', 4, 2, 1),
('删除角色', 'button', '', '', 'role:delete', 4, 3, 1),
('分配菜单', 'button', '', '', 'role:assign', 4, 4, 1),
('新增菜单', 'button', '', '', 'menu:add', 5, 1, 1),
('编辑菜单', 'button', '', '', 'menu:edit', 5, 2, 1),
('删除菜单', 'button', '', '', 'menu:delete', 5, 3, 1),
('操作日志', 'menu', '/admin/logs', 'FileTextOutlined', '', 2, 4, 1)
"""

# 角色-菜单关联
# super_admin: 全部菜单 + 按钮（系统管理相关）
# admin: 首页 + 未来的业务模块（不含系统管理）
# guest: 仅首页
ROLE_MENU_SQL = """
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r CROSS JOIN menu m
WHERE r.name = 'super_admin'
UNION ALL
SELECT r.id, m.id FROM role r CROSS JOIN menu m
WHERE r.name = 'admin' AND m.id = 1
UNION ALL
SELECT r.id, m.id FROM role r CROSS JOIN menu m
WHERE r.name = 'guest' AND m.id = 1
"""


def seed_initial_data() -> None:
    """首次启动种子数据：角色 + 菜单 + 角色权限关联。"""
    db = SessionLocal()
    try:
        # 角色
        role_count = db.execute(text("SELECT COUNT(*) FROM role")).scalar()
        if role_count == 0:
            db.execute(text(ROLES_SQL))
            db.commit()
            logger.info("初始化角色数据：guest / admin / super_admin")

        # 菜单 + 按钮权限
        menu_count = db.execute(text("SELECT COUNT(*) FROM menu")).scalar()
        if menu_count == 0:
            db.execute(text(MENUS_SQL))
            db.commit()
            logger.info("初始化菜单数据：首页 + 系统管理 + 按钮权限")

        # 角色-菜单关联
        rm_count = db.execute(text("SELECT COUNT(*) FROM role_menu")).scalar()
        if rm_count == 0:
            db.execute(text(ROLE_MENU_SQL))
            db.commit()
            logger.info("初始化角色-菜单权限关联")
    finally:
        db.close()
