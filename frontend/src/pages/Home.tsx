import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Space, Progress, Avatar } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
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

  const activeUsers = users.filter((u) => u.is_active).length;
  const superUsers = users.filter((u) => u.is_superuser).length;
  const activeRoles = roles.filter((r) => r.is_active).length;
  const visibleMenus = menus.filter((m) => m.is_visible).length;

  const recentUsers = [...users]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5);

  const recentColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (v: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#fa8c16' }} />
          {v}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (v: string | null) => v || '-',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roleItems: { name: string }[]) =>
        roleItems.length ? roleItems.map((r) => <Tag color="orange" key={r.name}>{r.name}</Tag>) : <Tag>游客</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
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

  const statCards = [
    {
      title: '用户总数',
      value: users.length,
      icon: <UserOutlined />,
      color: '#fa8c16',
      bg: '#fff7e6',
      sub: (
        <>
          <CheckCircleOutlined style={{ color: '#52c41a' }} /> 活跃 {activeUsers}
          <span style={{ margin: '0 6px' }} />
          <TeamOutlined style={{ color: '#faad14' }} /> 超管 {superUsers}
        </>
      ),
    },
    {
      title: '角色总数',
      value: roles.length,
      icon: <TeamOutlined />,
      color: '#52c41a',
      bg: '#f6ffed',
      sub: (
        <>
          <CheckCircleOutlined style={{ color: '#52c41a' }} /> 启用 {activeRoles}
          <span style={{ margin: '0 6px' }} />
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} /> 禁用 {roles.length - activeRoles}
        </>
      ),
    },
    {
      title: '菜单总数',
      value: menus.length,
      icon: <AppstoreOutlined />,
      color: '#722ed1',
      bg: '#f9f0ff',
      sub: (
        <>
          <CheckCircleOutlined style={{ color: '#52c41a' }} /> 可见 {visibleMenus}
          <span style={{ margin: '0 6px' }} />
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} /> 隐藏 {menus.length - visibleMenus}
        </>
      ),
    },
    {
      title: '数据源连接',
      value: 3,
      icon: <DatabaseOutlined />,
      color: '#13c2c2',
      bg: '#e6fffb',
      sub: 'MySQL / Redis / MongoDB',
    },
  ];

  return (
    <div>
      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1c1c1c 0%, #3d2817 40%, #8c4513 80%, #fa8c16 100%)',
          border: 'none',
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
        }}
        styles={{ body: { padding: 28 } }}
      >
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,140,22,0.2) 0%, transparent 70%)',
            top: -100,
            right: -50,
          }}
        />
        <Row align="middle" justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(250,140,22,0.4)',
                }}
              >
                <SafetyOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                {greeting}，{user?.username}
              </Title>
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              欢迎使用运维管理系统，祝您工作顺利。
            </Text>
          </Col>
          <Col>
            <div
              style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.08)',
                padding: '12px 20px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 20, marginBottom: 4 }} />
              <div style={{ fontSize: 13 }}>
                {now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statCards.map((s, i) => (
          <Col span={6} key={i}>
            <Card
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1c1c1c' }}>{s.value}</div>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: s.bg,
                    color: s.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {s.icon}
                </div>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{s.sub}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            title={<span style={{ fontWeight: 600 }}>最近注册用户</span>}
            extra={<Text type="secondary">共 {users.length} 人</Text>}
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Table
              rowKey="id"
              dataSource={recentUsers}
              columns={recentColumns}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={<span style={{ fontWeight: 600 }}>角色分布</span>}
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {roles.length === 0 ? (
              <Text type="secondary">暂无角色数据</Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {roles.map((role) => {
                  const count = users.filter((u) => u.roles.some((r) => r.id === role.id)).length;
                  const percent = users.length ? (count / users.length) * 100 : 0;
                  return (
                    <div key={role.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontWeight: 500 }}>{role.name}</Text>
                        <Text type="secondary">{count} 人</Text>
                      </div>
                      <Progress
                        percent={percent}
                        showInfo={false}
                        strokeColor={{
                          '0%': '#fa8c16',
                          '100%': '#ffa940',
                        }}
                        trailColor="#fff0e6"
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
