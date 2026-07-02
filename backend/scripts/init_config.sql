-- =============================================================
-- 业务配置表初始化 SQL（用户/角色/菜单已迁移至 Passport 认证中心）
-- 用法：mysql -u root -p kefu_fastapi_ant_demo < init_config.sql
-- =============================================================

-- ────── 数据库连接信息表 ──────
CREATE TABLE IF NOT EXISTS mysql_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    default_db INT DEFAULT 0 COMMENT '是否默认库 1=是 0=否',
    db_addr VARCHAR(64) NOT NULL COMMENT '数据库地址',
    db_port INT NOT NULL DEFAULT 3306 COMMENT '端口',
    db_user VARCHAR(64) NOT NULL COMMENT '用户名',
    db_pass VARCHAR(128) NOT NULL COMMENT '密码',
    db_name VARCHAR(128) NOT NULL COMMENT '数据库名',
    db_section VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT '业务分区',
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
    db_section VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT '业务分区',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Redis连接信息';

CREATE TABLE IF NOT EXISTS mongo_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    default_db INT DEFAULT 0 COMMENT '是否默认库 1=是 0=否',
    mongo_url VARCHAR(512) NOT NULL COMMENT 'MongoDB 连接串',
    db_name VARCHAR(128) NOT NULL COMMENT '数据库名',
    db_section VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT '业务分区',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='MongoDB连接信息';

-- ────── 操作日志表 ──────
CREATE TABLE IF NOT EXISTS operation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT '操作用户 ID',
    username VARCHAR(64) NULL COMMENT '操作用户名',
    module VARCHAR(64) DEFAULT '' COMMENT '功能模块',
    action VARCHAR(64) DEFAULT '' COMMENT '操作类型',
    method VARCHAR(10) DEFAULT '' COMMENT 'HTTP 方法',
    path VARCHAR(256) DEFAULT '' COMMENT '请求路径',
    params TEXT COMMENT '请求参数',
    ip VARCHAR(64) DEFAULT '' COMMENT '客户端 IP',
    status_code INT DEFAULT 0 COMMENT '响应状态码',
    cost_ms INT DEFAULT 0 COMMENT '耗时(毫秒)',
    error_msg TEXT DEFAULT '' COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志';

-- ────── 注意 ──────
-- user / role / menu / user_role / role_menu 表已删除
-- 这些功能已迁移至 Passport 认证中心（passport 数据库）
-- 通过 http://localhost:8888 管理
