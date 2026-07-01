"""用户管理接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.admin import schemas as s
from app.common.database import get_db
from app.services.system import user_service as svc

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[s.UserOut])
def list_users(db: Session = Depends(get_db)):
    return svc.get_user_list(db)


@router.get("/{pk}", response_model=s.UserOut)
def get_user(pk: int, db: Session = Depends(get_db)):
    obj = svc.get_user_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="用户不存在")
    return obj


@router.post("", response_model=s.UserOut, status_code=201)
def create_user(payload: s.UserCreate, db: Session = Depends(get_db)):
    existing = svc.get_user_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    return svc.create_user(db, payload.model_dump())


@router.put("/{pk}", response_model=s.UserOut)
def update_user(pk: int, payload: s.UserUpdate, db: Session = Depends(get_db)):
    obj = svc.update_user(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="用户不存在")
    return obj


@router.delete("/{pk}")
def delete_user(pk: int, db: Session = Depends(get_db)):
    if not svc.delete_user(db, pk):
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"msg": "已删除"}


@router.post("/{pk}/roles", response_model=s.UserOut)
def assign_user_roles(pk: int, payload: s.UserRoleAssign, db: Session = Depends(get_db)):
    obj = svc.assign_roles_to_user(db, pk, payload.role_ids)
    if not obj:
        raise HTTPException(status_code=404, detail="用户不存在")
    return obj
