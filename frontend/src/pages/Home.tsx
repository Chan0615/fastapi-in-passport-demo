import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Space, Progress, Avatar } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { userApi, roleApi, menuApi, UserInfo, RoleInfo, MenuInfo } from '../services/adminApi';

const { Title, Text } = Typography;

export default function Home() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [menus, setMenus] = useState<MenuInfo[]>([]);

  useEffect(() => {
    Promise.all([userApi.list(), roleApi.list(), menuApi.list()]).then(([u, r, m]) => {
      setUsers(u);
      setRoles(r);
      setMenus(m);
    });
  }, []);

  const activeUsers = users.filter(u => u.is_active).length;
  const superUsers = users.filter(u => u.is_superuser).length;
  const activeRoles = roles.filter(r => r.is_active).length;
  const visibleMenus = menus.filter(m => m.is_visible).length;

  const recentUsers = [...users]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5);

  const recentColumns = [
    {
      title: '用户名', dataIndex: 'username', key: 'username',
      render: (v: string) => (
        <Space><Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />{v}</Space>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v: string | null) => v || '-' },
    {
      title: '角色', dataIndex: 'roles', key: 'roles',
      render: (roles: { name: string }[]) =>
        roles.length ? roles.map(r => <Tag color="blue" key={r.name}>{r.name}</Tag>) : <Tag>游客</Tag>,
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>,
    },
  ];

  const now = new Date();
  const hour = now.getHours();
  let greeting = '晚上好';
  if (hour < 6) greeting = '凌晨好';
  else if (hour < 12) greeting = '早上好';
  else if (hour < 14) greeting = '中午好';
  else if (hour < 18) greeting = '下午好';

  return (
    <div>
      {/* 欢迎卡片 */}
      <Card
        style={{ marginBottom: 16, background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)', border: 'none' }}
        styles={{ body: { padding: 24 } }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ color: '#fff', margin: '0 0 4px' }}>
              {greeting}，{user?.username} 👋
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              欢迎使用运维管理系统，祝您工作顺利！
            </Text>
          </Col>
          <Col>
            <Space size="large">
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <ClockCircleOutlined style={{ fontSize: 24, marginBottom: 4 }} />
                <div style={{ fontSize: 13 }}>
                  {now.toLocaleDateString('zh-CN')}
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={users.length}
              prefix={<UserOutlined style={{ color: '#1677ff' }} />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 活跃 {activeUsers}　
                <TeamOutlined style={{ color: '#faad14' }} /> 超管 {superUsers}
              </Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="角色总数"
              value={roles.length}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 启用 {activeRoles}　
                <ClockCircleOutlined style={{ color: '#8c8c8c' }} /> 禁用 {roles.length - activeRoles}
              </Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="菜单总数"
              value={menus.length}
              prefix={<AppstoreOutlined style={{ color: '#722ed1' }} />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 可见 {visibleMenus}　
                <ClockCircleOutlined style={{ color: '#8c8c8c' }} /> 隐藏 {menus.length - visibleMenus}
              </Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据源连接"
              value={3}
              prefix={<DatabaseOutlined style={{ color: '#13c2c2' }} />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                MySQL / Redis / MongoDB
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 下方区域 */}
      <Row gutter={16}>
        {/* 最近用户 */}
        <Col span={16}>
          <Card title="最近注册用户" extra={<Text type="secondary">共 {users.length} 人</Text>}>
            <Table
              rowKey="id"
              dataSource={recentUsers}
              columns={recentColumns}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        {/* 角色分布 */}
        <Col span={8}>
          <Card title="角色分布">
            {roles.length === 0 ? (
              <Text type="secondary">暂无角色数据</Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {roles.map(role => {
                  const count = users.filter(u =>
                    u.roles.some(r => r.id === role.id)
                  ).length;
                  const percent = users.length ? (count / users.length) * 100 : 0;
                  return (
                    <div key={role.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text>{role.name}</Text>
                        <Text type="secondary">{count} 人</Text>
                      </div>
                      <Progress
                        percent={percent}
                        showInfo={false}
                        strokeColor={{
                          '0%': '#1677ff',
                          '100%': '#52c41a',
                        }}
                      />
                    </div>
                  );
                })}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
