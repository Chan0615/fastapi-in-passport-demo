import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Typography, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  ClusterOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const features = [
  { icon: <SafetyOutlined />, title: 'LDAP 统一认证', desc: '企业级账号登录' },
  { icon: <ClusterOutlined />, title: '多数据源管理', desc: 'MySQL/Redis/Mongo' },
  { icon: <ThunderboltOutlined />, title: '快速部署运维', desc: 'Docker 容器编排' },
  { icon: <TeamOutlined />, title: '权限精细控制', desc: '按钮级权限管控' },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        overflow: 'hidden',
        background: 'linear-gradient(105deg, #0c3d7a 0%, #1677ff 40%, #4096ff 55%, #e6f4ff 70%, #ffffff 100%)',
      }}
    >
      {/* ── 左侧 2/3：系统介绍 ── */}
      <div
        style={{
          flex: 2,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '40px 56px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* 网格背景 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* 光晕 */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(64,150,255,0.15) 0%, transparent 70%)',
            top: -180,
            right: -120,
          }}
        />

        {/* 内容 */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, width: '100%', textAlign: 'center', margin: '0 auto' }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <SafetyOutlined style={{ fontSize: 26, color: '#fff' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                运维管理系统
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>
                Ops Management Platform
              </div>
            </div>
          </div>

          {/* 标语 */}
          <div style={{ marginBottom: 32 }}>
            <Title style={{ color: '#fff', margin: '0 0 10px', fontSize: 26, lineHeight: 1.35 }}>
              集中管控基础设施，让运维更简单
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              统一认证 · 数据源管理 · 权限控制 · 操作审计
            </Text>
          </div>

          {/* 功能特性 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '12px 8px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#91caff', fontSize: 20 }}>{f.icon}</div>
                <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{f.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 版权 */}
        <div style={{ position: 'absolute', bottom: 20, left: 56, color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
          © {new Date().getFullYear()} 运维管理系统 · MIT License
        </div>
      </div>

      {/* ── 右侧 1/3：登录入口 ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '100%', maxWidth: 340 }}>
          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 4px 12px rgba(22,119,255,0.3)',
              }}
            >
              <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <Title level={3} style={{ margin: '0 0 4px', fontWeight: 600 }}>
              欢迎登录
            </Title>
            <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
              请使用 LDAP 账号登录系统
            </Text>
          </div>

          {/* 表单 */}
          <Form size="large" onFinish={handleLogin} autoComplete="off">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#1677ff' }} />}
                placeholder="用户名"
                style={{ borderRadius: 10, height: 46, borderColor: '#d9d9d9' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#1677ff' }} />}
                placeholder="密码"
                style={{ borderRadius: 10, height: 46, borderColor: '#d9d9d9' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 10, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 46,
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(22,119,255,0.25)',
                }}
              >
                登 录
              </Button>
            </Form.Item>

            <Button
              block
              href="http://opsflow2.ops.com/#/workflow/createWorkFlow?workflow_id=217"
              target="_blank"
              style={{ height: 40, borderRadius: 10, borderColor: '#d9d9d9', fontWeight: 500 }}
            >
              申请权限 <ArrowRightOutlined />
            </Button>
          </Form>

          {/* 提示 */}
          <div
            style={{
              marginTop: 24,
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)',
              borderRadius: 10,
              border: '1px solid #bae0ff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#1677ff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              i
            </div>
            <Text style={{ color: '#0958d9', fontSize: 12, lineHeight: 1.5 }}>
              首次登录默认获得游客权限，请联系管理员分配角色
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
