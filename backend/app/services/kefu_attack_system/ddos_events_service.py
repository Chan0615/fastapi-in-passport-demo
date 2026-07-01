"""客服攻防系统数据查询服务。"""
from __future__ import annotations

from typing import Any, Dict, List, Tuple

import pymysql
from sqlalchemy.orm import Session

from app.models.db_config import MysqlInfo


def get_kefu_mysql_config(db: Session) -> MysqlInfo | None:
    return (
        db.query(MysqlInfo)
        .filter(MysqlInfo.db_section == "kefu_attack_system")
        .order_by(MysqlInfo.default_db.desc(), MysqlInfo.id.asc())
        .first()
    )


def query_aliyun_ddos_events(mysql_conf: MysqlInfo, limit: int = 200) -> Tuple[List[str], List[Dict[str, Any]]]:
    rows: List[Dict[str, Any]] = []
    columns: List[str] = []

    conn = pymysql.connect(
        host=mysql_conf.db_addr,
        port=int(mysql_conf.db_port),
        user=mysql_conf.db_user,
        password=mysql_conf.db_pass,
        database=mysql_conf.db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=5,
        read_timeout=10,
        write_timeout=10,
    )

    try:
        with conn.cursor() as cursor:
            safe_limit = max(1, min(limit, 1000))
            cursor.execute("SELECT * FROM aliyun_ddos_events LIMIT %s", (safe_limit,))
            rows = list(cursor.fetchall())
            if rows:
                columns = list(rows[0].keys())
            else:
                cursor.execute("SHOW COLUMNS FROM aliyun_ddos_events")
                columns = [item["Field"] for item in cursor.fetchall()]
    finally:
        conn.close()

    return columns, rows
