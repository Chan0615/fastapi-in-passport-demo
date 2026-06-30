import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, LoginRequest, UserInfo, MenuItem } from '../services/authApi';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  menus: MenuItem[];
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshMenus: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const TOKEN_KEY = 'access_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenus = useCallback(() => {
    return authApi.menus().then(setMenus).catch(() => setMenus([]));
  }, []);

  // 启动时用已存 token 获取用户信息和菜单
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([authApi.me(), authApi.menus()])
      .then(([u, m]) => {
        setUser(u);
        setMenus(m);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    // 登录后获取菜单
    const m = await authApi.menus();
    setMenus(m);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setMenus([]);
  }, []);

  const refreshMenus = useCallback(async () => {
    await fetchMenus();
  }, [fetchMenus]);

  return (
    <AuthContext.Provider value={{ user, token, menus, loading, login, logout, refreshMenus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
