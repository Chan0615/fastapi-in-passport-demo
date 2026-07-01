import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Switch, Tabs, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined } from '@ant-design/icons';
import Auth from '../../components/Auth';
import { dbConfigApi, MysqlInfo, RedisInfo, MongoInfo } from '../../services/dbConfigApi';

type TabKey = 'mysql' | 'redis' | 'mongo';

export default function DbConfigList() {
  const [activeTab, setActiveTab] = useState<TabKey>('mysql');
  const [mysqlList, setMysqlList] = useState<MysqlInfo[]>([]);
  const [redisList, setRedisList] = useState<RedisInfo[]>([]);
  const [mongoList, setMongoList] = useState<MongoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, r, mo] = await Promise.all([
        dbConfigApi.listMysql(),
        dbConfigApi.listRedis(),
        dbConfigApi.listMongo(),
      ]);
      setMysqlList(m);
      setRedisList(r);
      setMongoList(mo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── 通用 CRUD ──
  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    if (activeTab === 'mysql') form.setFieldsValue({ default_db: 0, db_port: 3306 });
    if (activeTab === 'redis') form.setFieldsValue({ default_db: 0, port: 6379, db: 0, password: '' });
    if (activeTab === 'mongo') form.setFieldsValue({ default_db: 0 });
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditing(record);
    if (activeTab === 'mysql') {
      form.setFieldsValue(record);
    } else if (activeTab === 'redis') {
      form.setFieldsValue(record);
    } else {
      form.setFieldsValue(record);
    }
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (activeTab === 'mysql') {
        if (editing) await dbConfigApi.updateMysql(editing.id, values);
        else await dbConfigApi.createMysql(values);
      } else if (activeTab === 'redis') {
        if (editing) await dbConfigApi.updateRedis(editing.id, values);
        else await dbConfigApi.createRedis(values);
      } else {
        if (editing) await dbConfigApi.updateMongo(editing.id, values);
        else await dbConfigApi.createMongo(values);
      }
      message.success(editing ? '修改成功' : '新增成功');
      setFormVisible(false);
      fetchAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      if (activeTab === 'mysql') await dbConfigApi.deleteMysql(id);
      else if (activeTab === 'redis') await dbConfigApi.deleteRedis(id);
      else await dbConfigApi.deleteMongo(id);
      message.success('删除成功');
      fetchAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  // ── 表单字段 ──
  const renderFormFields = () => {
    if (activeTab === 'mysql') {
      return (
        <>
          <Form.Item name="default_db" label="设为默认" valuePropName="checked" getValueFromEvent={(v) => v ? 1 : 0}>
            <Switch />
          </Form.Item>
          <Form.Item name="db_addr" label="地址" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="db_port" label="端口" rules={[{ required: true }]}><InputNumber min={1} max={65535} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="db_user" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="db_pass" label="密码" rules={[{ required: true }]}><Input.Password /></Form.Item>
          <Form.Item name="db_name" label="数据库名" rules={[{ required: true }]}><Input /></Form.Item>
        </>
      );
    }
    if (activeTab === 'redis') {
      return (
        <>
          <Form.Item name="default_db" label="设为默认" valuePropName="checked" getValueFromEvent={(v) => v ? 1 : 0}>
            <Switch />
          </Form.Item>
          <Form.Item name="addr" label="地址" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="port" label="端口" rules={[{ required: true }]}><InputNumber min={1} max={65535} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="password" label="密码"><Input.Password /></Form.Item>
          <Form.Item name="db" label="DB 编号"><InputNumber min={0} max={15} style={{ width: '100%' }} /></Form.Item>
        </>
      );
    }
    return (
      <>
        <Form.Item name="default_db" label="设为默认" valuePropName="checked" getValueFromEvent={(v) => v ? 1 : 0}>
          <Switch />
        </Form.Item>
        <Form.Item name="mongo_url" label="连接串" rules={[{ required: true }]}><Input placeholder="mongodb://host:port" /></Form.Item>
        <Form.Item name="db_name" label="数据库名" rules={[{ required: true }]}><Input /></Form.Item>
      </>
    );
  };

  // ── 表格列 ──
  const mysqlColumns = [
    {
      title: '默认', dataIndex: 'default_db', width: 60,
      render: (v: number) => v ? <Tag color="green">是</Tag> : '-',
    },
    { title: '地址', dataIndex: 'db_addr' },
    { title: '端口', dataIndex: 'db_port', width: 80 },
    { title: '用户名', dataIndex: 'db_user', width: 100 },
    { title: '密码', dataIndex: 'db_pass', width: 100, render: (v: string) => '••••••' },
    { title: '数据库', dataIndex: 'db_name', width: 150 },
    {
      title: '操作', width: 150,
      render: (_: unknown, record: MysqlInfo) => (
        <Space>
          <Auth permission="db:edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          </Auth>
          <Auth permission="db:delete">
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  const redisColumns = [
    {
      title: '默认', dataIndex: 'default_db', width: 60,
      render: (v: number) => v ? <Tag color="green">是</Tag> : '-',
    },
    { title: '地址', dataIndex: 'addr' },
    { title: '端口', dataIndex: 'port', width: 80 },
    { title: '密码', dataIndex: 'password', width: 100, render: (v: string) => v ? '••••••' : '-' },
    { title: 'DB', dataIndex: 'db', width: 60 },
    {
      title: '操作', width: 150,
      render: (_: unknown, record: RedisInfo) => (
        <Space>
          <Auth permission="db:edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          </Auth>
          <Auth permission="db:delete">
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  const mongoColumns = [
    {
      title: '默认', dataIndex: 'default_db', width: 60,
      render: (v: number) => v ? <Tag color="green">是</Tag> : '-',
    },
    { title: '连接串', dataIndex: 'mongo_url' },
    { title: '数据库', dataIndex: 'db_name', width: 150 },
    {
      title: '操作', width: 150,
      render: (_: unknown, record: MongoInfo) => (
        <Space>
          <Auth permission="db:edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          </Auth>
          <Auth permission="db:delete">
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'mysql' as TabKey,
      label: 'MySQL',
      children: (
        <Table rowKey="id" loading={loading} dataSource={mysqlList} columns={mysqlColumns} pagination={false} size="middle" />
      ),
    },
    {
      key: 'redis' as TabKey,
      label: 'Redis',
      children: (
        <Table rowKey="id" loading={loading} dataSource={redisList} columns={redisColumns} pagination={false} size="middle" />
      ),
    },
    {
      key: 'mongo' as TabKey,
      label: 'MongoDB',
      children: (
        <Table rowKey="id" loading={loading} dataSource={mongoList} columns={mongoColumns} pagination={false} size="middle" />
      ),
    },
  ];

  return (
    <Card
      title={<span><DatabaseOutlined /> 数据源管理</span>}
      extra={
        <Auth permission="db:add">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
        </Auth>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Modal
        title={`${activeTab === 'mysql' ? 'MySQL' : activeTab === 'redis' ? 'Redis' : 'MongoDB'} - ${editing ? '编辑' : '新增'}`}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {renderFormFields()}
        </Form>
      </Modal>
    </Card>
  );
}
