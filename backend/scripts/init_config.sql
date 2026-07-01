-- 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
-- 椤圭洰鍒濆鍖?SQL锛氫粎寤鸿〃锛屼笉鎻掑叆鏁版嵁
-- 鎵€鏈変笟鍔￠厤缃湪 config.yaml 涓紝鏁版嵁搴撹繛鎺ヤ俊鎭€氳繃 API 绠＄悊
-- 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?

-- 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ 鏁版嵁搴撹繛鎺ヤ俊鎭〃 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
CREATE TABLE IF NOT EXISTS mysql_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    default_db INT DEFAULT 0 COMMENT '鏄惁榛樿搴?1=鏄?0=鍚?,
    db_addr VARCHAR(64) NOT NULL COMMENT '鏁版嵁搴撳湴鍧€',
    db_port INT NOT NULL DEFAULT 3306 COMMENT '绔彛',
    db_user VARCHAR(64) NOT NULL COMMENT '鐢ㄦ埛鍚?,
    db_pass VARCHAR(128) NOT NULL COMMENT '瀵嗙爜',
    db_name VARCHAR(128) NOT NULL COMMENT '鏁版嵁搴撳悕',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='MySQL杩炴帴淇℃伅';

CREATE TABLE IF NOT EXISTS redis_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    default_db INT DEFAULT 0 COMMENT '鏄惁榛樿搴?1=鏄?0=鍚?,
    addr VARCHAR(64) NOT NULL COMMENT 'Redis 鍦板潃',
    port INT NOT NULL DEFAULT 6379 COMMENT 'Redis 绔彛',
    password VARCHAR(128) DEFAULT '' COMMENT 'Redis 瀵嗙爜',
    db INT DEFAULT 0 COMMENT 'Redis DB 缂栧彿',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Redis杩炴帴淇℃伅';

CREATE TABLE IF NOT EXISTS mongo_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    default_db INT DEFAULT 0 COMMENT '鏄惁榛樿搴?1=鏄?0=鍚?,
    mongo_url VARCHAR(512) NOT NULL COMMENT 'MongoDB 杩炴帴涓?,
    db_name VARCHAR(128) NOT NULL COMMENT '鏁版嵁搴撳悕',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='MongoDB杩炴帴淇℃伅';

-- 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ 绯荤粺绠＄悊琛?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE COMMENT '鐢ㄦ埛鍚?,
    email VARCHAR(128) NULL UNIQUE COMMENT '閭',
    hashed_password VARCHAR(256) DEFAULT '' COMMENT '鍔犲瘑瀵嗙爜锛圠DAP鐢ㄦ埛涓虹┖锛?,
    is_active BOOLEAN DEFAULT TRUE COMMENT '鏄惁婵€娲?,
    is_superuser BOOLEAN DEFAULT FALSE COMMENT '鏄惁瓒呯骇绠＄悊鍛?,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='鐢ㄦ埛琛?;

CREATE TABLE IF NOT EXISTS role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE COMMENT '瑙掕壊鍚嶇О',
    description VARCHAR(255) DEFAULT '' COMMENT '瑙掕壊鎻忚堪',
    is_active BOOLEAN DEFAULT TRUE COMMENT '鏄惁鍚敤',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='瑙掕壊琛?;

CREATE TABLE IF NOT EXISTS menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL COMMENT '鍚嶇О',
    menu_type VARCHAR(16) DEFAULT 'menu' COMMENT '绫诲瀷锛歞irectory=鐩綍 menu=鑿滃崟 button=鎸夐挳',
    path VARCHAR(256) DEFAULT '' COMMENT '璺敱璺緞',
    icon VARCHAR(64) DEFAULT '' COMMENT '鍥炬爣',
    permission VARCHAR(128) DEFAULT '' COMMENT '鏉冮檺鏍囪瘑锛屽 user:add',
    parent_id INT DEFAULT NULL COMMENT '鐖剁骇 ID',
    sort_order INT DEFAULT 0 COMMENT '鎺掑簭',
    is_visible BOOLEAN DEFAULT TRUE COMMENT '鏄惁鍙',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menu(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='鑿滃崟/鏉冮檺琛?;

CREATE TABLE IF NOT EXISTS user_role (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='鐢ㄦ埛-瑙掕壊鍏宠仈';

CREATE TABLE IF NOT EXISTS role_menu (
    role_id INT NOT NULL,
    menu_id INT NOT NULL,
    PRIMARY KEY (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='瑙掕壊-鑿滃崟鍏宠仈';

-- 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ 绉嶅瓙鏁版嵁 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

-- 瑙掕壊
INSERT INTO role (name, description, is_active) VALUES
('guest', '娓稿锛堥粯璁よ鑹诧紝浠呮祻瑙堬紝绛夊緟绠＄悊鍛樺垎閰嶆潈闄愶級', 1),
('admin', '绠＄悊鍛橈紙鎷ユ湁闄ょ郴缁熺鐞嗗鐨勬墍鏈夋潈闄愶級', 1),
('super_admin', '瓒呯骇绠＄悊鍛橈紙鎷ユ湁鎵€鏈夋潈闄愶級', 1);

-- 鑿滃崟 + 鎸夐挳鏉冮檺
INSERT INTO menu (name, menu_type, path, icon, permission, parent_id, sort_order, is_visible) VALUES
('棣栭〉', 'menu', '/', 'HomeOutlined', '', NULL, 1, 1),
('绯荤粺绠＄悊', 'directory', '', 'SettingOutlined', '', NULL, 2, 1),
('鐢ㄦ埛绠＄悊', 'menu', '/admin/users', 'UserOutlined', '', 2, 1, 1),
('瑙掕壊绠＄悊', 'menu', '/admin/roles', 'SafetyOutlined', '', 2, 2, 1),
('鑿滃崟绠＄悊', 'menu', '/admin/menus', 'AppstoreOutlined', '', 2, 3, 1),
('鏂板鐢ㄦ埛', 'button', '', '', 'user:add', 3, 1, 1),
('缂栬緫鐢ㄦ埛', 'button', '', '', 'user:edit', 3, 2, 1),
('鍒犻櫎鐢ㄦ埛', 'button', '', '', 'user:delete', 3, 3, 1),
('鍒嗛厤瑙掕壊', 'button', '', '', 'user:assign', 3, 4, 1),
('鏂板瑙掕壊', 'button', '', '', 'role:add', 4, 1, 1),
('缂栬緫瑙掕壊', 'button', '', '', 'role:edit', 4, 2, 1),
('鍒犻櫎瑙掕壊', 'button', '', '', 'role:delete', 4, 3, 1),
('鍒嗛厤鑿滃崟', 'button', '', '', 'role:assign', 4, 4, 1),
('鏂板鑿滃崟', 'button', '', '', 'menu:add', 5, 1, 1),
('缂栬緫鑿滃崟', 'button', '', '', 'menu:edit', 5, 2, 1),
('鍒犻櫎鑿滃崟', 'button', '', '', 'menu:delete', 5, 3, 1),
('鎿嶄綔鏃ュ織', 'menu', '/admin/logs', 'FileTextOutlined', '', 2, 4, 1),
('鏁版嵁婧愮鐞?, 'menu', '/admin/db-config', 'DatabaseOutlined', '', 2, 5, 1),
('鏂板鏁版嵁婧?, 'button', '', '', 'db:add', 6, 1, 1),
('缂栬緫鏁版嵁婧?, 'button', '', '', 'db:edit', 6, 2, 1),
('鍒犻櫎鏁版嵁婧?, 'button', '', '', 'db:delete', 6, 3, 1);

-- 瑙掕壊-鑿滃崟鍏宠仈
-- super_admin: 鍏ㄩ儴
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r CROSS JOIN menu m WHERE r.name = 'super_admin';

-- admin: 浠呴椤?+ 鏈潵鐨勪笟鍔℃ā鍧楋紙涓嶅惈绯荤粺绠＄悊锛?
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r CROSS JOIN menu m
WHERE r.name = 'admin' AND m.id = 1;

-- guest: 浠呴椤?
INSERT INTO role_menu (role_id, menu_id)
SELECT r.id, m.id FROM role r CROSS JOIN menu m
WHERE r.name = 'guest' AND m.id = 1;

-- ===== 2026-07-01: db_section 扩展 =====
-- 说明：用于区分业务分区，例如 kefu_attack_system。
ALTER TABLE mysql_info ADD COLUMN IF NOT EXISTS db_section VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT '业务分区';
ALTER TABLE redis_info ADD COLUMN IF NOT EXISTS db_section VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT '业务分区';
ALTER TABLE mongo_info ADD COLUMN IF NOT EXISTS db_section VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT '业务分区';

-- 客服攻防系统菜单（可重复执行）
INSERT INTO menu (name, menu_type, path, icon, permission, parent_id, sort_order, is_visible)
SELECT '客服攻防系统', 'menu', '/admin/kefu-attack-system', 'BugOutlined', '', NULL, 3, 1
WHERE NOT EXISTS (
    SELECT 1 FROM menu WHERE path = '/admin/kefu-attack-system'
);


-- 迁移客服攻防系统为顶级菜单（历史数据）
UPDATE menu SET parent_id = NULL, sort_order = 3 WHERE path = '/admin/kefu-attack-system';

