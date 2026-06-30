import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthProps {
  permission: string;
  children: ReactNode;
}

/**
 * 按钮级权限控制组件。
 * 超级管理员或拥有指定权限的用户才渲染子元素。
 *
 * 用法：<Auth permission="user:edit"><Button>编辑</Button></Auth>
 */
export default function Auth({ permission, children }: AuthProps) {
  const { user } = useAuth();

  if (!user) return null;

  // 超级管理员拥有所有权限
  if (user.is_superuser) return <>{children}</>;

  // 检查是否拥有该权限
  if (user.permissions?.includes(permission) || user.permissions?.includes('*')) {
    return <>{children}</>;
  }

  return null;
}
