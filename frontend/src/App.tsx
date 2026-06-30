import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import BasicLayout from './layouts/BasicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import UserList from './pages/user-management/UserList';
import RoleList from './pages/role-management/RoleList';
import MenuList from './pages/menu-management/MenuList';
import OperationLogList from './pages/operation-log/OperationLogList';
import { useAuth } from './contexts/AuthContext';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  // 超级管理员可访问所有系统管理页面
  if (user?.is_superuser) return <>{children}</>;

  // 非超管访问系统管理页面，重定向到首页
  if (location.pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <BasicLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route
          path="/admin/users"
          element={<AdminRoute><UserList /></AdminRoute>}
        />
        <Route
          path="/admin/roles"
          element={<AdminRoute><RoleList /></AdminRoute>}
        />
        <Route
          path="/admin/menus"
          element={<AdminRoute><MenuList /></AdminRoute>}
        />
        <Route
          path="/admin/logs"
          element={<AdminRoute><OperationLogList /></AdminRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
