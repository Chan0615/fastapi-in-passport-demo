import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Switch, TreeSelect, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import IconPicker from '../../components/IconPicker';
import Auth from '../../components/Auth';
import { menuApi, MenuInfo } from '../../services/adminApi';

const renderIcon = (iconName: string) => {
  if (!iconName) return '-';
  const IconComp = (Icons as Record<string, React.ComponentType>)[iconName];
  return IconComp ? <IconComp /> : iconName;
};

const menuTypeTag: Record<string, { color: string; label: string }> = {
  directory: { color: 'blue', label: '目录' },
  menu: { color: 'green', label: '菜单' },
  button: { color: 'orange', label: '按钮' },
};

export default function MenuList() {
  const [menus, setMenus] = useState<MenuInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuInfo | null>(null);
  const [form] = Form.useForm();

  const fetchMenus = async () => {
    setLoading(true);
    try {
      setMenus(await menuApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const buildTreeSelect = (menuList: MenuInfo[], excludeId?: number) => {
    const filtered = excludeId ? menuList.filter(m => m.id !== excludeId && m.menu_type !== 'button') : menuList.filter(m => m.menu_type !== 'button');
    const map = new Map<number, any>();
    const roots: any[] = [];
    filtered.forEach(m => map.set(m.id, { value: m.id, title: m.name, children: [] }));
    filtered.forEach(m => {
      if (m.parent_id && map.has(m.parent_id)) {
        map.get(m.parent_id).children.push(map.get(m.id));
      } else {
        roots.push(map.get(m.id));
      }
    });
    return roots;
  };

  const handleAdd = () => {
    setEditingMenu(null);
    form.resetFields();
    form.setFieldsValue({ menu_type: 'menu', sort_order: 0, is_visible: true, parent_id: null });
    setFormVisible(true);
  };

  const handleEdit = (record: MenuInfo) => {
    setEditingMenu(record);
    form.setFieldsValue({
      name: record.name,
      menu_type: record.menu_type,
      path: record.path,
      icon: record.icon,
      permission: record.permission,
      parent_id: record.parent_id,
      sort_order: record.sort_order,
      is_visible: record.is_visible,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    // 按钮类型清空路径和图标
    if (values.menu_type === 'button') {
      values.path = '';
      values.icon = '';
    }
    try {
      if (editingMenu) {
        await menuApi.update(editingMenu.id, values);
        message.success('修改成功');
      } else {
        await menuApi.create(values);
        message.success('新增成功');
      }
      setFormVisible(false);
      fetchMenus();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await menuApi.delete(id);
      message.success('删除成功');
      fetchMenus();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型', dataIndex: 'menu_type', key: 'menu_type', width: 80,
      render: (v: string) => {
        const cfg = menuTypeTag[v] || menuTypeTag.menu;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '路径', dataIndex: 'path', key: 'path', render: (v: string) => v || '-' },
    { title: '图标', dataIndex: 'icon', key: 'icon', width: 60, render: (v: string) => renderIcon(v) },
    {
      title: '权限标识', dataIndex: 'permission', key: 'permission',
      render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-',
    },
    {
      title: '父级', dataIndex: 'parent_id', key: 'parent_id',
      render: (pid: number | null) => {
        if (!pid) return <Tag>顶级</Tag>;
        const parent = menus.find(m => m.id === pid);
        return parent?.name || '-';
      },
    },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 60 },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: unknown, record: MenuInfo) => (
        <Space>
          <Auth permission="menu:edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          </Auth>
          <Auth permission="menu:delete">
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="菜单管理"
      extra={
        <Auth permission="menu:add">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
        </Auth>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        dataSource={menus}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingMenu ? '编辑' : '新增'}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="menu_type" label="类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'directory', label: '目录' },
                { value: 'menu', label: '菜单' },
                { value: 'button', label: '按钮' },
              ]}
            />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="菜单/按钮名称" />
          </Form.Item>
          <Form.Item name="permission" label="权限标识">
            <Input placeholder="如 user:add（按钮类型必填）" />
          </Form.Item>
          <Form.Item name="path" label="路由路径">
            <Input placeholder="如 /admin/users（按钮类型无需）" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <IconPicker />
          </Form.Item>
          <Form.Item name="parent_id" label="父级">
            <TreeSelect
              allowClear
              treeData={buildTreeSelect(menus, editingMenu?.id)}
              placeholder="留空为顶级"
            />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_visible" label="是否可见" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
