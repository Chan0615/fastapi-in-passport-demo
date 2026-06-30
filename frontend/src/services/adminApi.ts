import request from '../utils/request';

// ────── 类型定义 ──────

export interface RoleBrief {
  id: number;
  name: string;
  description: string;
}

export interface MenuInfo {
  id: number;
  name: string;
  menu_type: string;
  path: string;
  icon: string;
  permission: string;
  parent_id: number | null;
  sort_order: number;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleInfo {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  menus: MenuInfo[];
  created_at?: string;
  updated_at?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string | null;
  is_active: boolean;
  is_superuser: boolean;
  roles: RoleBrief[];
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

// ────── 用户管理 ──────

export const userApi = {
  list: () => request.get<UserInfo[]>('/admin/users'),
  get: (id: number) => request.get<UserInfo>(`/admin/users/${id}`),
  create: (data: { username: string; email?: string; password: string; is_active?: boolean; is_superuser?: boolean }) =>
    request.post<UserInfo>('/admin/users', data),
  update: (id: number, data: Partial<{ username: string; email: string; password: string; is_active: boolean; is_superuser: boolean }>) =>
    request.put<UserInfo>(`/admin/users/${id}`, data),
  delete: (id: number) => request.delete(`/admin/users/${id}`),
  assignRoles: (id: number, role_ids: number[]) =>
    request.post<UserInfo>(`/admin/users/${id}/roles`, { role_ids }),
};

// ────── 角色管理 ──────

export const roleApi = {
  list: () => request.get<RoleInfo[]>('/admin/roles'),
  get: (id: number) => request.get<RoleInfo>(`/admin/roles/${id}`),
  create: (data: { name: string; description?: string; is_active?: boolean }) =>
    request.post<RoleInfo>('/admin/roles', data),
  update: (id: number, data: Partial<{ name: string; description: string; is_active: boolean }>) =>
    request.put<RoleInfo>(`/admin/roles/${id}`, data),
  delete: (id: number) => request.delete(`/admin/roles/${id}`),
  assignMenus: (id: number, menu_ids: number[]) =>
    request.post<RoleInfo>(`/admin/roles/${id}/menus`, { menu_ids }),
};

// ────── 菜单管理 ──────

export const menuApi = {
  list: () => request.get<MenuInfo[]>('/admin/menus'),
  tree: () => request.get<MenuInfo[]>('/admin/menus/tree'),
  get: (id: number) => request.get<MenuInfo>(`/admin/menus/${id}`),
  create: (data: { name: string; path?: string; icon?: string; parent_id?: number | null; sort_order?: number; is_visible?: boolean }) =>
    request.post<MenuInfo>('/admin/menus', data),
  update: (id: number, data: Partial<{ name: string; path: string; icon: string; parent_id: number | null; sort_order: number; is_visible: boolean }>) =>
    request.put<MenuInfo>(`/admin/menus/${id}`, data),
  delete: (id: number) => request.delete(`/admin/menus/${id}`),
};
