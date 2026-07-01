import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { DatabaseOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import Auth from '../../components/Auth';
import { dbConfigApi, MongoInfo, MysqlInfo, RedisInfo } from '../../services/dbConfigApi';

type TabKey = 'mysql' | 'redis' | 'mongo';
type DbRecord = MysqlInfo | RedisInfo | MongoInfo;

export default function DbConfigList() {
  const [activeTab, setActiveTab] = useState<TabKey>('mysql');
  const [mysqlList, setMysqlList] = useState<MysqlInfo[]>([]);
  const [redisList, setRedisList] = useState<RedisInfo[]>([]);
  const [mongoList, setMongoList] = useState<MongoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<DbRecord | null>(null);
  const [form] = Form.useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mysql, redis, mongo] = await Promise.all([
        dbConfigApi.listMysql(),
        dbConfigApi.listRedis(),
        dbConfigApi.listMongo(),
      ]);
      setMysqlList(mysql);
      setRedisList(redis);
      setMongoList(mongo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    if (activeTab === 'mysql') {
      form.setFieldsValue({ db_section: 'default', default_db: false, db_port: 3306 });
    }
    if (activeTab === 'redis') {
      form.setFieldsValue({ db_section: 'default', default_db: false, port: 6379, db: 0, password: '' });
    }
    if (activeTab === 'mongo') {
      form.setFieldsValue({ db_section: 'default', default_db: false });
    }
    setFormVisible(true);
  };

  const handleEdit = (record: DbRecord) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      default_db: record.default_db === 1,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      default_db: values.default_db ? 1 : 0,
    };

    try {
      if (activeTab === 'mysql') {
        if (editing) {
          await dbConfigApi.updateMysql(editing.id, payload);
        } else {
          await dbConfigApi.createMysql(payload);
        }
      } else if (activeTab === 'redis') {
        if (editing) {
          await dbConfigApi.updateRedis(editing.id, payload);
        } else {
          await dbConfigApi.createRedis(payload);
        }
      } else {
        if (editing) {
          await dbConfigApi.updateMongo(editing.id, payload);
        } else {
          await dbConfigApi.createMongo(payload);
        }
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
      if (activeTab === 'mysql') {
        await dbConfigApi.deleteMysql(id);
      } else if (activeTab === 'redis') {
        await dbConfigApi.deleteRedis(id);
      } else {
        await dbConfigApi.deleteMongo(id);
      }
      message.success('删除成功');
      fetchAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const commonColumns = [
    {
      title: '业务分区',
      dataIndex: 'db_section',
      width: 180,
      render: (value: string) => <Tag color="blue">{value || 'default'}</Tag>,
    },
    {
      title: '默认',
      dataIndex: 'default_db',
      width: 80,
      render: (value: number) => (value ? <Tag color="green">是</Tag> : '-'),
    },
  ];

  const actionColumn = {
    title: '操作',
    width: 170,
    fixed: 'right' as const,
    render: (_: unknown, record: DbRecord) => (
      <Space>
        <Auth permission="db:edit">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Auth>
        <Auth permission="db:delete">
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Auth>
      </Space>
    ),
  };

  const mysqlColumns = [
    ...commonColumns,
    { title: '地址', dataIndex: 'db_addr' },
    { title: '端口', dataIndex: 'db_port', width: 90 },
    { title: '用户名', dataIndex: 'db_user', width: 120 },
    { title: '密码', dataIndex: 'db_pass', width: 120, render: () => '******' },
    { title: '数据库', dataIndex: 'db_name', width: 180 },
    actionColumn,
  ];

  const redisColumns = [
    ...commonColumns,
    { title: '地址', dataIndex: 'addr' },
    { title: '端口', dataIndex: 'port', width: 90 },
    { title: '密码', dataIndex: 'password', width: 120, render: (value: string) => (value ? '******' : '-') },
    { title: 'DB', dataIndex: 'db', width: 90 },
    actionColumn,
  ];

  const mongoColumns = [
    ...commonColumns,
    { title: '连接串', dataIndex: 'mongo_url' },
    { title: '数据库', dataIndex: 'db_name', width: 180 },
    actionColumn,
  ];

  const tabItems = useMemo(
    () => [
      {
        key: 'mysql',
        label: 'MySQL',
        children: (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={mysqlList}
            columns={mysqlColumns}
            pagination={false}
            scroll={{ x: 1100 }}
          />
        ),
      },
      {
        key: 'redis',
        label: 'Redis',
        children: (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={redisList}
            columns={redisColumns}
            pagination={false}
            scroll={{ x: 1000 }}
          />
        ),
      },
      {
        key: 'mongo',
        label: 'MongoDB',
        children: (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={mongoList}
            columns={mongoColumns}
            pagination={false}
            scroll={{ x: 1000 }}
          />
        ),
      },
    ],
    [loading, mongoList, mysqlList, redisList],
  );

  return (
    <Card
      title={<span><DatabaseOutlined /> 数据源管理</span>}
      extra={
        <Auth permission="db:add">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增
          </Button>
        </Auth>
      }
    >
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)} items={tabItems} />

      <Modal
        title={`${activeTab.toUpperCase()} - ${editing ? '编辑' : '新增'}`}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="db_section"
            label="业务分区"
            rules={[{ required: true, message: '请输入业务分区' }]}
          >
            <Input placeholder="例如：kefu_attack_system" />
          </Form.Item>
          <Form.Item name="default_db" label="设为默认" valuePropName="checked">
            <Switch />
          </Form.Item>

          {activeTab === 'mysql' && (
            <>
              <Form.Item name="db_addr" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="db_port" label="端口" rules={[{ required: true, message: '请输入端口' }]}>
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="db_user" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="db_pass" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password />
              </Form.Item>
              <Form.Item name="db_name" label="数据库名" rules={[{ required: true, message: '请输入数据库名' }]}>
                <Input />
              </Form.Item>
            </>
          )}

          {activeTab === 'redis' && (
            <>
              <Form.Item name="addr" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口' }]}>
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="password" label="密码">
                <Input.Password />
              </Form.Item>
              <Form.Item name="db" label="DB 编号">
                <InputNumber min={0} max={15} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}

          {activeTab === 'mongo' && (
            <>
              <Form.Item name="mongo_url" label="连接串" rules={[{ required: true, message: '请输入连接串' }]}>
                <Input placeholder="mongodb://host:27017" />
              </Form.Item>
              <Form.Item name="db_name" label="数据库名" rules={[{ required: true, message: '请输入数据库名' }]}>
                <Input />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
