"""首次启动时写入基础角色与菜单。"""
import logging

from sqlalchemy import text

from app.common.database import SessionLocal

logger = logging.getLogger(__name__)

ROLES_SQL = """
INSERT INTO role (name, description, is_active)
VALUES
  ('guest', '游客（默认角色，仅浏览）', 1),
  ('admin', '管理员（拥有除系统管理外的大部分权限）', 1),
  ('super_admin', '超级管理员（拥有全部权限）', 1)
"""

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
('操作日志', 'menu', '/admin/logs', 'FileTextOutlined', '', 2, 4, 1),
('数据源管理', 'menu', '/admin/db-config', 'DatabaseOutlined', '', 2, 5, 1),
('客服攻防系统', 'menu', '/admin/kefu-attack-system', 'BugOutlined', '', NULL, 3, 1),
('新增数据源', 'button', '', '', 'db:add', 6, 1, 1),
('编辑数据源', 'button', '', '', 'db:edit', 6, 2, 1),
('删除数据源', 'button', '', '', 'db:delete', 6, 3, 1)
"""

ROLE_MENU_SQL = """
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r CROSS JOIN menu m WHERE r.name = 'super_admin'
UNION ALL
SELECT r.id, m.id FROM role r CROSS JOIN menu m WHERE r.name = 'admin' AND m.id = 1
UNION ALL
SELECT r.id, m.id FROM role r CROSS JOIN menu m WHERE r.name = 'guest' AND m.id = 1
"""


def seed_initial_data() -> None:
    db = SessionLocal()
    try:
        role_count = db.execute(text("SELECT COUNT(*) FROM role")).scalar() or 0
        if role_count == 0:
            db.execute(text(ROLES_SQL))
            db.commit()
            logger.info("初始化角色数据完成")

        menu_count = db.execute(text("SELECT COUNT(*) FROM menu")).scalar() or 0
        if menu_count == 0:
            db.execute(text(MENUS_SQL))
            db.commit()
            logger.info("初始化菜单数据完成")

        rm_count = db.execute(text("SELECT COUNT(*) FROM role_menu")).scalar() or 0
        if rm_count == 0:
            db.execute(text(ROLE_MENU_SQL))
            db.commit()
            logger.info("初始化角色菜单关联完成")

        # 兼容历史环境：补齐“客服攻防系统”菜单
        db.execute(text("""
            INSERT INTO menu (name, menu_type, path, icon, permission, parent_id, sort_order, is_visible)
            SELECT '客服攻防系统', 'menu', '/admin/kefu-attack-system', 'BugOutlined', '', NULL, 3, 1
            WHERE NOT EXISTS (
                SELECT 1 FROM menu WHERE path = '/admin/kefu-attack-system'
            )
        """))
        db.commit()

        # 兼容历史环境：已存在菜单时迁移为顶级菜单
        db.execute(text("""
            UPDATE menu
            SET parent_id = NULL, sort_order = 3
            WHERE path = '/admin/kefu-attack-system'
        """))
        db.commit()

        # 兼容历史环境：补齐 super_admin 授权
        db.execute(text("""
            INSERT INTO role_menu (role_id, menu_id)
            SELECT r.id, m.id
            FROM role r
            JOIN menu m ON m.path = '/admin/kefu-attack-system'
            WHERE r.name = 'super_admin'
              AND NOT EXISTS (
                SELECT 1 FROM role_menu rm
                WHERE rm.role_id = r.id AND rm.menu_id = m.id
              )
        """))
        db.commit()
    finally:
        db.close()
