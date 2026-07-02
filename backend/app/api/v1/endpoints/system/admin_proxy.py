"""管理员接口代理。

用户/角色/菜单的增删改查全部转接至 Passport 认证中心。
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.common.deps import get_current_user
from app.common import passport_client as p

router = APIRouter(prefix="/admin", tags=["admin-proxy"])


def _get_auth(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth:
        token = request.cookies.get("access_token", "")
        if token:
            auth = f"Bearer {token}"
    return auth


def _raise(resp: tuple[dict, int]):
    data, status = resp
    if status >= 400:
        detail = data.get("detail", "Passport 请求失败") if isinstance(data, dict) else str(data)
        raise HTTPException(status_code=status, detail=detail)
    return data


# ═══════════════ 用户管理 ═══════════════

@router.get("/users")
async def list_users(request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_user_list(_get_auth(request), request.query_params.get("keyword", "")))

@router.get("/users/{pk}")
async def get_user(pk: int, request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_user_get(_get_auth(request), pk))

@router.post("/users")
async def create_user(request: Request, _user=Depends(get_current_user)):
    data = await request.json()
    return _raise(await p.proxy_user_create(_get_auth(request), data))

@router.put("/users/{pk}")
async def update_user(pk: int, request: Request, _user=Depends(get_current_user)):
    data = await request.json()
    return _raise(await p.proxy_user_update(_get_auth(request), pk, data))

@router.delete("/users/{pk}")
async def delete_user(pk: int, request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_user_delete(_get_auth(request), pk))


class AssignRoles(BaseModel):
    role_ids: list[int]

@router.post("/users/{pk}/roles")
async def assign_user_roles(pk: int, payload: AssignRoles, request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_user_assign_roles(_get_auth(request), pk, payload.role_ids))


# ═══════════════ 角色管理 ═══════════════

@router.get("/roles")
async def list_roles(request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_role_list(_get_auth(request)))

@router.get("/roles/{pk}")
async def get_role(pk: int, request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_role_get(_get_auth(request), pk))

@router.post("/roles")
async def create_role(request: Request, _user=Depends(get_current_user)):
    data = await request.json()
    return _raise(await p.proxy_role_create(_get_auth(request), data))

@router.put("/roles/{pk}")
async def update_role(pk: int, request: Request, _user=Depends(get_current_user)):
    data = await request.json()
    return _raise(await p.proxy_role_update(_get_auth(request), pk, data))

@router.delete("/roles/{pk}")
async def delete_role(pk: int, request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_role_delete(_get_auth(request), pk))


class AssignMenus(BaseModel):
    menu_ids: list[int]

@router.post("/roles/{pk}/menus")
async def assign_role_menus(pk: int, payload: AssignMenus, request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_role_assign_menus(_get_auth(request), pk, payload.menu_ids))


# ═══════════════ 菜单管理 ═══════════════

@router.get("/menus")
async def list_menus(request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_menu_list(_get_auth(request)))

@router.get("/menus/tree")
async def get_menu_tree(request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_menu_tree(_get_auth(request)))

@router.get("/menus/{pk}")
async def get_menu(pk: int, request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_menu_get(_get_auth(request), pk))

@router.post("/menus")
async def create_menu(request: Request, _user=Depends(get_current_user)):
    data = await request.json()
    return _raise(await p.proxy_menu_create(_get_auth(request), data))

@router.put("/menus/{pk}")
async def update_menu(pk: int, request: Request, _user=Depends(get_current_user)):
    data = await request.json()
    return _raise(await p.proxy_menu_update(_get_auth(request), pk, data))

@router.delete("/menus/{pk}")
async def delete_menu(pk: int, request: Request, _user=Depends(get_current_user)):
    return _raise(await p.proxy_menu_delete(_get_auth(request), pk))
