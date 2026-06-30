import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  ClusterOutlined,
  ThunderboltOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const features = [
  {
    icon: <SafetyOutlined style={{ fontSize: 28 }} />,
    title: 'LDAP 统一认证',
    desc: '企业级 LDAP 账号登录，无需额外注册',
  },
  {
    icon: <ClusterOutlined style={{ fontSize: 28 }} />,
    title: '多数据源管理',
    desc: 'MySQL / Redis / MongoDB 连接信息集中管控',
  },
  {
    icon: <ThunderboltOutlined style={{ fontSize: 28 }} />,
    title: '快速部署运维',
    desc: '一键启停服务，Docker 容器化编排',
  },
  {
    icon: <TeamOutlined style={{ fontSize: 28 }} />,
    title: '权限精细控制',
    desc: '用户 → 角色 → 菜单三级权限体系',
  },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        background: '#f0f2f5',
        overflow: 'hidden',
      }}
    >
      {/* ── 左侧 2/3：系统介绍 ── */}
      <div
        style={{
          flex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1677ff 0%, #003a8c 100%)',
          padding: '40px 48px',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* 背景装饰圆 */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            top: -100,
            right: -100,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            bottom: -80,
            left: -60,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, width: '100%' }}>
          {/* Logo + 标题 */}
          <div style={{ marginBottom: 36 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <SafetyOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <Title level={2} style={{ color: '#fff', margin: '0 0 6px' }}>
              运维管理系统
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
              企业级运维管理平台，集中管控基础设施与业务资源
            </Text>
          </div>

          {/* 功能特性网格 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 18px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ color: '#91caff', marginBottom: 6 }}>{f.icon}</div>
                <Text strong style={{ color: '#fff', fontSize: 14, display: 'block', marginBottom: 2 }}>
                  {f.title}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                  {f.desc}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 右侧 1/3：登录入口 ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          background: '#fff',
          boxSizing: 'border-box',
        }}
      >
        <Card
          style={{
            width: '100%',
            maxWidth: 380,
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f0f0f0',
          }}
          styles={{ body: { padding: '40px 32px 32px' } }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: '#e6f4ff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <UserOutlined style={{ fontSize: 26, color: '#1677ff' }} />
            </div>
            <Title level={4} style={{ margin: 0 }}>
              欢迎登录
            </Title>
            <Paragraph type="secondary" style={{ margin: '4px 0 0', fontSize: 13 }}>
              使用 LDAP 账号登录
            </Paragraph>
          </div>

          <Form size="large" onFinish={handleLogin} autoComplete="off">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="用户名" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登 录
              </Button>
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                block
                href="http://opsflow2.ops.com/#/workflow/createWorkFlow?workflow_id=217"
                target="_blank"
              >
                申请权限
              </Button>
            </Form.Item>
          </Form>

          <Text
            type="secondary"
            style={{ display: 'block', textAlign: 'center', fontSize: 12 }}
          >
            首次登录默认获得游客权限，请联系管理员分配角色
          </Text>
        </Card>
      </div>
    </div>
  );
}
