"""系统管理接口：用户管理、角色管理、菜单管理。"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.admin import schemas as s
from app.admin import services as svc

router = APIRouter()


# ═══════════════════ 用户管理 ═══════════════════

@router.get("/users", response_model=list[s.UserOut], tags=["用户管理"])
def list_users(db: Session = Depends(get_db)):
    return svc.get_user_list(db)


@router.get("/users/{pk}", response_model=s.UserOut, tags=["用户管理"])
def get_user(pk: int, db: Session = Depends(get_db)):
    obj = svc.get_user_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="用户不存在")
    return obj


@router.post("/users", response_model=s.UserOut, status_code=201, tags=["用户管理"])
def create_user(payload: s.UserCreate, db: Session = Depends(get_db)):
    existing = svc.get_user_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    return svc.create_user(db, payload.model_dump())


@router.put("/users/{pk}", response_model=s.UserOut, tags=["用户管理"])
def update_user(pk: int, payload: s.UserUpdate, db: Session = Depends(get_db)):
    obj = svc.update_user(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="用户不存在")
    return obj


@router.delete("/users/{pk}", tags=["用户管理"])
def delete_user(pk: int, db: Session = Depends(get_db)):
    if not svc.delete_user(db, pk):
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"msg": "已删除"}


@router.post("/users/{pk}/roles", response_model=s.UserOut, tags=["用户管理"])
def assign_user_roles(pk: int, payload: s.UserRoleAssign, db: Session = Depends(get_db)):
    obj = svc.assign_roles_to_user(db, pk, payload.role_ids)
    if not obj:
        raise HTTPException(status_code=404, detail="用户不存在")
    return obj


# ═══════════════════ 角色管理 ═══════════════════

@router.get("/roles", response_model=list[s.RoleOut], tags=["角色管理"])
def list_roles(db: Session = Depends(get_db)):
    return svc.get_role_list(db)


@router.get("/roles/{pk}", response_model=s.RoleOut, tags=["角色管理"])
def get_role(pk: int, db: Session = Depends(get_db)):
    obj = svc.get_role_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="角色不存在")
    return obj


@router.post("/roles", response_model=s.RoleOut, status_code=201, tags=["角色管理"])
def create_role(payload: s.RoleCreate, db: Session = Depends(get_db)):
    return svc.create_role(db, payload.model_dump())


@router.put("/roles/{pk}", response_model=s.RoleOut, tags=["角色管理"])
def update_role(pk: int, payload: s.RoleUpdate, db: Session = Depends(get_db)):
    obj = svc.update_role(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="角色不存在")
    return obj


@router.delete("/roles/{pk}", tags=["角色管理"])
def delete_role(pk: int, db: Session = Depends(get_db)):
    if not svc.delete_role(db, pk):
        raise HTTPException(status_code=404, detail="角色不存在")
    return {"msg": "已删除"}


@router.post("/roles/{pk}/menus", response_model=s.RoleOut, tags=["角色管理"])
def assign_role_menus(pk: int, payload: s.RoleMenuAssign, db: Session = Depends(get_db)):
    obj = svc.assign_menus_to_role(db, pk, payload.menu_ids)
    if not obj:
        raise HTTPException(status_code=404, detail="角色不存在")
    return obj


# ═══════════════════ 菜单管理 ═══════════════════

@router.get("/menus", response_model=list[s.MenuOut], tags=["菜单管理"])
def list_menus(db: Session = Depends(get_db)):
    return svc.get_menu_list(db)


@router.get("/menus/tree", response_model=list[s.MenuOut], tags=["菜单管理"])
def get_menu_tree(db: Session = Depends(get_db)):
    return svc.get_menu_tree(db)


@router.get("/menus/{pk}", response_model=s.MenuOut, tags=["菜单管理"])
def get_menu(pk: int, db: Session = Depends(get_db)):
    obj = svc.get_menu_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="菜单不存在")
    return obj


@router.post("/menus", response_model=s.MenuOut, status_code=201, tags=["菜单管理"])
def create_menu(payload: s.MenuCreate, db: Session = Depends(get_db)):
    return svc.create_menu(db, payload.model_dump())


@router.put("/menus/{pk}", response_model=s.MenuOut, tags=["菜单管理"])
def update_menu(pk: int, payload: s.MenuUpdate, db: Session = Depends(get_db)):
    obj = svc.update_menu(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="菜单不存在")
    return obj


@router.delete("/menus/{pk}", tags=["菜单管理"])
def delete_menu(pk: int, db: Session = Depends(get_db)):
    if not svc.delete_menu(db, pk):
        raise HTTPException(status_code=404, detail="菜单不存在")
    return {"msg": "已删除"}
