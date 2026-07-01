"""客服攻防系统事件查询接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.services.kefu_attack_system import ddos_events_service as service

router = APIRouter(prefix="/kefu-attack-system", tags=["kefu-attack-system"])


@router.get("/aliyun-ddos-events")
def list_aliyun_ddos_events(limit: int = Query(200, ge=1, le=1000), db: Session = Depends(get_db)):
    mysql_conf = service.get_kefu_mysql_config(db)
    if not mysql_conf:
        raise HTTPException(status_code=404, detail="未找到 db_section=kefu_attack_system 的 MySQL 配置")

    try:
        columns, rows = service.query_aliyun_ddos_events(mysql_conf, limit)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"查询 aliyun_ddos_events 失败: {exc}") from exc

    return {
        "datasource": {
            "id": mysql_conf.id,
            "db_section": mysql_conf.db_section,
            "db_addr": mysql_conf.db_addr,
            "db_port": mysql_conf.db_port,
            "db_name": mysql_conf.db_name,
            "db_user": mysql_conf.db_user,
            "default_db": mysql_conf.default_db,
        },
        "table": "aliyun_ddos_events",
        "count": len(rows),
        "columns": columns,
        "rows": rows,
    }
