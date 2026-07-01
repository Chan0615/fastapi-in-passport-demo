-- ═════════════════════════════════════════════════
-- 项目初始化 SQL：仅建表，不插入数据
-- 所有业务配置在 config.yaml 中，数据库连接信息通过 API 管理
-- ═════════════════════════════════════════════════

-- ──────────────── 数据库连接信息表 ────────────────
CREATE TABLE IF NOT EXISTS mysql_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    default_db INT DEFAULT 0 COMMENT '是否默认库 1=是 0=否',
    db_addr VARCHAR(64) NOT NULL COMMENT '数据库地址',
    db_port INT NOT NULL DEFAULT 3306 COMMENT '端口',
    db_user VARCHAR(64) NOT NULL COMMENT '用户名',
    db_pass VARCHAR(128) NOT NULL COMMENT '密码',
    db_name VARCHAR(128) NOT NULL COMMENT '数据库名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='MySQL连接信息';

CREATE TABLE IF NOT EXISTS redis_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    default_db INT DEFAULT 0 COMMENT '是否默认库 1=是 0=否',
    addr VARCHAR(64) NOT NULL COMMENT 'Redis 地址',
    port INT NOT NULL DEFAULT 6379 COMMENT 'Redis 端口',
    password VARCHAR(128) DEFAULT '' COMMENT 'Redis 密码',
    db INT DEFAULT 0 COMMENT 'Redis DB 编号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Redis连接信息';

CREATE TABLE IF NOT EXISTS mongo_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    default_db INT DEFAULT 0 COMMENT '是否默认库 1=是 0=否',
    mongo_url VARCHAR(512) NOT NULL COMMENT 'MongoDB 连接串',
    db_name VARCHAR(128) NOT NULL COMMENT '数据库名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='MongoDB连接信息';

-- ──────────────── 系统管理表 ────────────────
CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE COMMENT '用户名',
    email VARCHAR(128) NULL UNIQUE COMMENT '邮箱',
    hashed_password VARCHAR(256) DEFAULT '' COMMENT '加密密码（LDAP用户为空）',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    is_superuser BOOLEAN DEFAULT FALSE COMMENT '是否超级管理员',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE IF NOT EXISTS role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE COMMENT '角色名称',
    description VARCHAR(255) DEFAULT '' COMMENT '角色描述',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

CREATE TABLE IF NOT EXISTS menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL COMMENT '名称',
    menu_type VARCHAR(16) DEFAULT 'menu' COMMENT '类型：directory=目录 menu=菜单 button=按钮',
    path VARCHAR(256) DEFAULT '' COMMENT '路由路径',
    icon VARCHAR(64) DEFAULT '' COMMENT '图标',
    permission VARCHAR(128) DEFAULT '' COMMENT '权限标识，如 user:add',
    parent_id INT DEFAULT NULL COMMENT '父级 ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_visible BOOLEAN DEFAULT TRUE COMMENT '是否可见',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menu(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单/权限表';

CREATE TABLE IF NOT EXISTS user_role (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户-角色关联';

CREATE TABLE IF NOT EXISTS role_menu (
    role_id INT NOT NULL,
    menu_id INT NOT NULL,
    PRIMARY KEY (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色-菜单关联';

-- ──────────────── 种子数据 ────────────────

-- 角色
INSERT INTO role (name, description, is_active) VALUES
('guest', '游客（默认角色，仅浏览，等待管理员分配权限）', 1),
('admin', '管理员（拥有除系统管理外的所有权限）', 1),
('super_admin', '超级管理员（拥有所有权限）', 1);

-- 菜单 + 按钮权限
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
('新增数据源', 'button', '', '', 'db:add', 6, 1, 1),
('编辑数据源', 'button', '', '', 'db:edit', 6, 2, 1),
('删除数据源', 'button', '', '', 'db:delete', 6, 3, 1);

-- 角色-菜单关联
-- super_admin: 全部
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r CROSS JOIN menu m WHERE r.name = 'super_admin';

-- admin: 仅首页 + 未来的业务模块（不含系统管理）
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r CROSS JOIN menu m
WHERE r.name = 'admin' AND m.id = 1;

-- guest: 仅首页
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r CROSS JOIN menu m
WHERE r.name = 'guest' AND m.id = 1;
