"""菜单管理接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.admin import schemas as s
from app.common.database import get_db
from app.services.system import menu_service as svc

router = APIRouter(prefix="/menus", tags=["menus"])


@router.get("", response_model=list[s.MenuOut])
def list_menus(db: Session = Depends(get_db)):
    return svc.get_menu_list(db)


@router.get("/tree", response_model=list[s.MenuOut])
def get_menu_tree(db: Session = Depends(get_db)):
    return svc.get_menu_tree(db)


@router.get("/{pk}", response_model=s.MenuOut)
def get_menu(pk: int, db: Session = Depends(get_db)):
    obj = svc.get_menu_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="菜单不存在")
    return obj


@router.post("", response_model=s.MenuOut, status_code=201)
def create_menu(payload: s.MenuCreate, db: Session = Depends(get_db)):
    return svc.create_menu(db, payload.model_dump())


@router.put("/{pk}", response_model=s.MenuOut)
def update_menu(pk: int, payload: s.MenuUpdate, db: Session = Depends(get_db)):
    obj = svc.update_menu(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="菜单不存在")
    return obj


@router.delete("/{pk}")
def delete_menu(pk: int, db: Session = Depends(get_db)):
    if not svc.delete_menu(db, pk):
        raise HTTPException(status_code=404, detail="菜单不存在")
    return {"msg": "已删除"}
