import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Switch, Tree, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
import Auth from '../../components/Auth';
import { roleApi, menuApi, RoleInfo, MenuInfo } from '../../services/adminApi';

export default function RoleList() {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [menus, setMenus] = useState<MenuInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleInfo | null>(null);
  const [checkedMenuKeys, setCheckedMenuKeys] = useState<number[]>([]);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      setRoles(await roleApi.list());
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    setMenus(await menuApi.list());
  };

  useEffect(() => {
    fetchRoles();
    fetchMenus();
  }, []);

  // 构建菜单树
  const buildMenuTree = (menuList: MenuInfo[]) => {
    const map = new Map<number, any>();
    const roots: any[] = [];
    menuList.forEach(m => map.set(m.id, { key: m.id, title: m.name, children: [] }));
    menuList.forEach(m => {
      if (m.parent_id && map.has(m.parent_id)) {
        map.get(m.parent_id).children.push(map.get(m.id));
      } else {
        roots.push(map.get(m.id));
      }
    });
    return roots;
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setFormVisible(true);
  };

  const handleEdit = (record: RoleInfo) => {
    setEditingRole(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingRole) {
        await roleApi.update(editingRole.id, values);
        message.success('修改成功');
      } else {
        await roleApi.create(values);
        message.success('新增成功');
      }
      setFormVisible(false);
      fetchRoles();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await roleApi.delete(id);
      message.success('删除成功');
      fetchRoles();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleAssignMenus = (record: RoleInfo) => {
    setEditingRole(record);
    setCheckedMenuKeys(record.menus.map(m => m.id));
    setMenuVisible(true);
  };

  const handleSaveMenus = async () => {
    if (!editingRole) return;
    try {
      await roleApi.assignMenus(editingRole.id, checkedMenuKeys);
      message.success('菜单分配成功');
      setMenuVisible(false);
      fetchRoles();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '分配失败');
    }
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
    {
      title: '菜单', dataIndex: 'menus', key: 'menus',
      render: (ms: MenuInfo[]) => ms.length ? <Tag color="cyan">{ms.length} 个菜单</Tag> : <Tag>未分配</Tag>,
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 240,
      render: (_: unknown, record: RoleInfo) => (
        <Space>
          <Auth permission="role:assign">
            <Button size="small" icon={<AppstoreOutlined />} onClick={() => handleAssignMenus(record)}>分配菜单</Button>
          </Auth>
          <Auth permission="role:edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          </Auth>
          <Auth permission="role:delete">
            <Popconfirm title="确定删除该角色?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="角色管理"
      extra={
        <Auth permission="role:add">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增角色</Button>
        </Auth>
      }
    >
      <Table rowKey="id" loading={loading} dataSource={roles} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`分配菜单 - ${editingRole?.name}`}
        open={menuVisible}
        onOk={handleSaveMenus}
        onCancel={() => setMenuVisible(false)}
      >
        {menus.length === 0 ? (
          <span style={{ color: '#999' }}>暂无菜单，请先创建菜单</span>
        ) : (
          <Tree
            checkable
            defaultExpandAll
            checkedKeys={checkedMenuKeys}
            onCheck={(keys) => setCheckedMenuKeys(keys as number[])}
            treeData={buildMenuTree(menus)}
          />
        )}
      </Modal>
    </Card>
  );
}
