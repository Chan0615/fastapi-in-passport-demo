import request from '../utils/request';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string | null;
  is_superuser: boolean;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}

export interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: string;
  parent_id: number | null;
  sort_order: number;
  children: MenuItem[];
}

export const authApi = {
  login: (data: LoginRequest) =>
    request.post<LoginResponse>('/auth/login', data),

  me: () => request.get<UserInfo>('/auth/me'),

  menus: () => request.get<MenuItem[]>('/auth/menus'),
};
