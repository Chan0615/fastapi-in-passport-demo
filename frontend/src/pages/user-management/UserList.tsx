import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Switch, message, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import Auth from '../../components/Auth';
import { userApi, roleApi, UserInfo, RoleBrief } from '../../services/adminApi';

export default function UserList() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<RoleBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [roleVisible, setRoleVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      setUsers(await userApi.list());
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRoles(await roleApi.list());
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleEdit = (record: UserInfo) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      is_active: record.is_active,
      is_superuser: record.is_superuser,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (!editingUser) return;
    try {
      await userApi.update(editingUser.id, {
        email: values.email,
        is_active: values.is_active,
        is_superuser: values.is_superuser,
      });
      message.success('修改成功');
      setFormVisible(false);
      fetchUsers();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id);
      message.success('删除成功');
      fetchUsers();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleAssignRoles = (record: UserInfo) => {
    setEditingUser(record);
    setSelectedRoleIds(record.roles.map(r => r.id));
    setRoleVisible(true);
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;
    try {
      await userApi.assignRoles(editingUser.id, selectedRoleIds);
      message.success('角色分配成功');
      setRoleVisible(false);
      fetchUsers();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '分配失败');
    }
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v: string | null) => v || '-' },
    {
      title: '角色', dataIndex: 'roles', key: 'roles',
      render: (roles: RoleBrief[]) =>
        roles.length ? (
          <Space size={[0, 4]} wrap>
            {roles.map(r => <Tag color="blue" key={r.id}>{r.name}</Tag>)}
          </Space>
        ) : <Tag>游客</Tag>,
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '超管', dataIndex: 'is_superuser', key: 'is_superuser', width: 80,
      render: (v: boolean) => (v ? <Tag color="gold">是</Tag> : '否'),
    },
    {
      title: '操作', key: 'action', width: 240,
      render: (_: unknown, record: UserInfo) => (
        <Space>
          <Auth permission="user:assign">
            <Button size="small" icon={<TeamOutlined />} onClick={() => handleAssignRoles(record)}>分配角色</Button>
          </Auth>
          <Auth permission="user:edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          </Auth>
          <Auth permission="user:delete">
            <Popconfirm title="确定删除该用户?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  return (
    <Card title="用户管理" extra={<span style={{ color: '#999', fontSize: 13 }}>用户通过 LDAP 登录自动创建</span>}>
      <Table rowKey="id" loading={loading} dataSource={users} columns={columns} pagination={{ pageSize: 10 }} />

      {/* 编辑弹窗 */}
      <Modal
        title="编辑用户"
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="用户名">
            <Input value={editingUser?.username} disabled />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="is_superuser" label="超级管理员" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配角色弹窗 */}
      <Modal
        title={`分配角色 - ${editingUser?.username}`}
        open={roleVisible}
        onOk={handleSaveRoles}
        onCancel={() => setRoleVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {roles.map(role => (
            <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <input
                type="checkbox"
                checked={selectedRoleIds.includes(role.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRoleIds([...selectedRoleIds, role.id]);
                  } else {
                    setSelectedRoleIds(selectedRoleIds.filter(id => id !== role.id));
                  }
                }}
              />
              <span>{role.name}</span>
              {role.description && <span style={{ color: '#999', fontSize: 12 }}>({role.description})</span>}
            </label>
          ))}
          {roles.length === 0 && <span style={{ color: '#999' }}>暂无角色，请先创建角色</span>}
        </Space>
      </Modal>
    </Card>
  );
}
