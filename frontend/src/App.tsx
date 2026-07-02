import { Navigate, Route, Routes } from 'react-router-dom';
import BasicLayout from './layouts/BasicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import UserList from './pages/user-management/UserList';
import RoleList from './pages/role-management/RoleList';
import MenuList from './pages/menu-management/MenuList';
import OperationLogList from './pages/operation-log/OperationLogList';
import DbConfigList from './pages/db-config/DbConfigList';
import KefuAttackSystem from './pages/kefu-attack-system/KefuAttackSystem';

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
        <Route path="/admin/users" element={<UserList />} />
        <Route path="/admin/roles" element={<RoleList />} />
        <Route path="/admin/menus" element={<MenuList />} />
        <Route path="/admin/logs" element={<OperationLogList />} />
        <Route path="/admin/db-config" element={<DbConfigList />} />
        <Route path="/admin/kefu-attack-system" element={<KefuAttackSystem />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
