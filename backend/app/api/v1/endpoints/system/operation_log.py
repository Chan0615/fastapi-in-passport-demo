"""操作日志查询接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.admin.models import User
from app.common.database import get_db
from app.common.deps import get_current_user
from app.models.operation_log import OperationLog

router = APIRouter(prefix="/operation-logs", tags=["operation-log"])


@router.get("/")
def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    module: str = Query(""),
    username: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    query = db.query(OperationLog)
    if module:
        query = query.filter(OperationLog.module == module)
    if username:
        query = query.filter(OperationLog.username.like(f"%{username}%"))

    total = query.count()
    items = query.order_by(OperationLog.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "username": log.username,
                "module": log.module,
                "action": log.action,
                "method": log.method,
                "path": log.path,
                "params": log.params,
                "ip": log.ip,
                "status_code": log.status_code,
                "cost_ms": log.cost_ms,
                "error_msg": log.error_msg,
                "created_at": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
            }
            for log in items
        ],
    }
