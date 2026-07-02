"""Passport 认证中心 HTTP 客户端。

提供登录/菜单获取 + 管理接口代理（转接所有 CRUD 到 passport）。
"""
import logging
from typing import Optional

import httpx

from app.config import bootstrap_config

logger = logging.getLogger(__name__)

PROJECT_CODE = "fastapi-ant-demo"
_project_id_cache: Optional[int] = None


def _get_passport_base() -> str:
    import os

    env_url = os.getenv("PASSPORT_URL")
    if env_url:
        return env_url.rstrip("/")
    return bootstrap_config.passport_url.rstrip("/")


async def _get_project_id() -> int:
    """获取 fastapi-ant-demo 在 passport 中的项目 ID（带缓存）。"""
    global _project_id_cache
    if _project_id_cache is not None:
        return _project_id_cache

    url = f"{_get_passport_base()}/api/v1/public/project-code/{PROJECT_CODE}"
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(url)
        if resp.status_code == 200:
            _project_id_cache = resp.json()["id"]
            return _project_id_cache
    raise RuntimeError(f"无法获取项目 {PROJECT_CODE} 的 ID，请确认 passport 种子 SQL 已执行")


# ═══════════════ 认证接口 ═══════════════

async def passport_login(username: str, password: str) -> Optional[dict]:
    url = f"{_get_passport_base()}/api/v1/auth/login"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={
                "username": username, "password": password, "project_code": PROJECT_CODE,
            })
            data = resp.json()
            if resp.status_code != 200:
                logger.warning(f"Passport 登录失败: {data}")
            return data
    except httpx.RequestError as e:
        logger.error(f"Passport 请求异常: {e}")
        return {"detail": f"Passport 服务不可用: {str(e)}"}


async def passport_menus(token: str) -> list[dict]:
    url = f"{_get_passport_base()}/api/v1/auth/menus"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={"project_code": PROJECT_CODE},
                                    headers={"Authorization": f"Bearer {token}"})
            return resp.json() if resp.status_code == 200 else []
    except httpx.RequestError:
        return []


async def passport_logout() -> None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"{_get_passport_base()}/api/v1/auth/logout")
    except httpx.RequestError:
        pass


async def passport_me(token: str) -> Optional[dict]:
    """获取当前用户信息（含 is_superuser）。"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{_get_passport_base()}/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
            return resp.json() if resp.status_code == 200 else None
    except httpx.RequestError:
        return None


async def passport_user_permissions(token: str) -> list[str]:
    """获取当前用户在 fastapi-ant-demo 项目下的按钮权限。"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{_get_passport_base()}/api/v1/auth/permissions",
                params={"project_code": PROJECT_CODE},
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code == 200:
                return resp.json().get("permissions", [])
            return []
    except httpx.RequestError:
        return []


# ═══════════════ 管理接口代理 ═══════════════

def _headers(auth_header: str) -> dict:
    return {"Authorization": auth_header, "Content-Type": "application/json"}


def _base() -> str:
    return _get_passport_base()


# ── 用户管理 ──

async def proxy_user_list(auth: str, keyword: str = ""):
    params = {"keyword": keyword} if keyword else {}
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{_base()}/api/v1/admin/users", params=params, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_user_get(auth: str, pk: int):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{_base()}/api/v1/admin/users/{pk}", headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_user_create(auth: str, data: dict):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.post(f"{_base()}/api/v1/admin/users", json=data, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_user_update(auth: str, pk: int, data: dict):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.put(f"{_base()}/api/v1/admin/users/{pk}", json=data, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_user_delete(auth: str, pk: int):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.delete(f"{_base()}/api/v1/admin/users/{pk}", headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_user_assign_roles(auth: str, pk: int, role_ids: list[int]):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.post(f"{_base()}/api/v1/admin/users/{pk}/roles", json={"role_ids": role_ids}, headers=_headers(auth))
        return r.json(), r.status_code


# ── 角色管理 ──

async def _get_project_id_safe(auth: str):
    """尝试通过公开接口获取项目 ID，失败则返回 None。"""
    global _project_id_cache
    if _project_id_cache is not None:
        return _project_id_cache
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            r = await c.get(f"{_base()}/api/v1/public/project-code/{PROJECT_CODE}")
            if r.status_code == 200:
                _project_id_cache = r.json()["id"]
                return _project_id_cache
    except Exception:
        pass
    return None


async def proxy_role_list(auth: str):
    pid = await _get_project_id_safe(auth) or await _get_project_id()
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{_base()}/api/v1/admin/roles", params={"project_id": pid}, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_role_get(auth: str, pk: int):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{_base()}/api/v1/admin/roles/{pk}", headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_role_create(auth: str, data: dict):
    pid = await _get_project_id_safe(auth) or await _get_project_id()
    data["project_id"] = pid
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.post(f"{_base()}/api/v1/admin/roles", json=data, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_role_update(auth: str, pk: int, data: dict):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.put(f"{_base()}/api/v1/admin/roles/{pk}", json=data, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_role_delete(auth: str, pk: int):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.delete(f"{_base()}/api/v1/admin/roles/{pk}", headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_role_assign_menus(auth: str, pk: int, menu_ids: list[int]):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.post(f"{_base()}/api/v1/admin/roles/{pk}/menus", json={"menu_ids": menu_ids}, headers=_headers(auth))
        return r.json(), r.status_code


# ── 菜单管理 ──

async def proxy_menu_list(auth: str):
    pid = await _get_project_id_safe(auth) or await _get_project_id()
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{_base()}/api/v1/admin/menus", params={"project_id": pid}, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_menu_tree(auth: str):
    pid = await _get_project_id_safe(auth) or await _get_project_id()
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{_base()}/api/v1/admin/menus/tree", params={"project_id": pid}, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_menu_get(auth: str, pk: int):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{_base()}/api/v1/admin/menus/{pk}", headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_menu_create(auth: str, data: dict):
    pid = await _get_project_id_safe(auth) or await _get_project_id()
    data["project_id"] = pid
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.post(f"{_base()}/api/v1/admin/menus", json=data, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_menu_update(auth: str, pk: int, data: dict):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.put(f"{_base()}/api/v1/admin/menus/{pk}", json=data, headers=_headers(auth))
        return r.json(), r.status_code

async def proxy_menu_delete(auth: str, pk: int):
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.delete(f"{_base()}/api/v1/admin/menus/{pk}", headers=_headers(auth))
        return r.json(), r.status_code
