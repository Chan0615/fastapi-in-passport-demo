"""角色管理接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.admin import schemas as s
from app.common.database import get_db
from app.services.system import role_service as svc

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[s.RoleOut])
def list_roles(db: Session = Depends(get_db)):
    return svc.get_role_list(db)


@router.get("/{pk}", response_model=s.RoleOut)
def get_role(pk: int, db: Session = Depends(get_db)):
    obj = svc.get_role_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="角色不存在")
    return obj


@router.post("", response_model=s.RoleOut, status_code=201)
def create_role(payload: s.RoleCreate, db: Session = Depends(get_db)):
    return svc.create_role(db, payload.model_dump())


@router.put("/{pk}", response_model=s.RoleOut)
def update_role(pk: int, payload: s.RoleUpdate, db: Session = Depends(get_db)):
    obj = svc.update_role(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="角色不存在")
    return obj


@router.delete("/{pk}")
def delete_role(pk: int, db: Session = Depends(get_db)):
    if not svc.delete_role(db, pk):
        raise HTTPException(status_code=404, detail="角色不存在")
    return {"msg": "已删除"}


@router.post("/{pk}/menus", response_model=s.RoleOut)
def assign_role_menus(pk: int, payload: s.RoleMenuAssign, db: Session = Depends(get_db)):
    obj = svc.assign_menus_to_role(db, pk, payload.menu_ids)
    if not obj:
        raise HTTPException(status_code=404, detail="角色不存在")
    return obj
