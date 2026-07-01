import { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Space, Button, Typography, Modal, Descriptions, Badge } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { operationLogApi, OperationLogItem } from '../../services/operationLogApi';

const { Text } = Typography;

const actionColor: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  login: 'cyan',
  logout: 'orange',
  assign_roles: 'purple',
  assign_menus: 'purple',
};

const actionLabel: Record<string, string> = {
  create: '新增',
  update: '修改',
  delete: '删除',
  login: '登录',
  logout: '登出',
  assign_roles: '分配角色',
  assign_menus: '分配菜单',
};

export default function OperationLogList() {
  const [logs, setLogs] = useState<OperationLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterModule, setFilterModule] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLog, setDetailLog] = useState<OperationLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await operationLogApi.list({
        page,
        page_size: pageSize,
        module: filterModule,
        username: filterUsername,
      });
      setLogs(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setFilterModule('');
    setFilterUsername('');
    setPage(1);
    setTimeout(fetchLogs, 100);
  };

  const columns = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 155 },
    { title: '用户', dataIndex: 'username', key: 'username', width: 80, render: (v: string | null) => v || '-' },
    {
      title: '模块', dataIndex: 'module', key: 'module', width: 70,
      render: (v: string) => v ? <Tag>{v}</Tag> : '-',
    },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 70,
      render: (v: string) => <Tag color={actionColor[v] || 'default'}>{actionLabel[v] || v}</Tag>,
    },
    {
      title: '方法', dataIndex: 'method', key: 'method', width: 50,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true, width: 180 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 120, render: (v: string) => v || '-' },
    {
      title: '状态', dataIndex: 'status_code', key: 'status_code', width: 50,
      render: (v: number) => <Tag color={v === 200 ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: '耗时', dataIndex: 'cost_ms', key: 'cost_ms', width: 55,
      render: (v: number) => <Text type="secondary" style={{ fontSize: 12 }}>{v}ms</Text>,
    },
    {
      title: '', key: 'action_btn', width: 45,
      render: (_: unknown, record: OperationLogItem) => (
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => { setDetailLog(record); setDetailVisible(true); }} />
      ),
    },
  ];

  return (
    <Card
      title="操作日志"
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchLogs}>刷新</Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="模块名称"
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Input
          placeholder="用户名"
          value={filterUsername}
          onChange={(e) => setFilterUsername(e.target.value)}
          style={{ width: 150 }}
          allowClear
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
        <Button onClick={handleReset}>重置</Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={logs}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
        scroll={{ x: 900 }}
      />

      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={640}
      >
        {detailLog && (
          <div>
            <Descriptions
              bordered
              column={2}
              size="small"
              labelStyle={{ width: 90, background: '#fafafa', fontWeight: 600 }}
            >
              <Descriptions.Item label="时间" span={2}>
                {detailLog.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="用户">
                {detailLog.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="IP 地址">
                {detailLog.ip || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="模块">
                {detailLog.module ? <Tag>{detailLog.module}</Tag> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作">
                <Tag color={actionColor[detailLog.action] || 'default'}>
                  {actionLabel[detailLog.action] || detailLog.action}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="请求方法">
                <Tag color="blue">{detailLog.method}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态码">
                <Badge
                  status={detailLog.status_code === 200 ? 'success' : 'error'}
                  text={detailLog.status_code}
                />
              </Descriptions.Item>
              <Descriptions.Item label="请求路径" span={2}>
                <Text code copyable>{detailLog.path}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="耗时" span={2}>
                <Text type={detailLog.cost_ms > 1000 ? 'danger' : 'secondary'}>
                  {detailLog.cost_ms} ms
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {detailLog.error_msg && (
              <div style={{ marginTop: 16 }}>
                <Text type="danger" strong>错误信息</Text>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: '#fff2f0',
                    border: '1px solid #ffccc7',
                    borderRadius: 6,
                    color: '#cf1322',
                    fontSize: 13,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {detailLog.error_msg}
                </div>
              </div>
            )}

            {detailLog.params && (
              <div style={{ marginTop: 16 }}>
                <Text strong>请求参数</Text>
                <pre
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: '#f6f8fa',
                    border: '1px solid #e1e4e8',
                    borderRadius: 6,
                    fontSize: 13,
                    maxHeight: 240,
                    overflow: 'auto',
                    margin: '8px 0 0',
                  }}
                >
                  {(() => {
                    try { return JSON.stringify(JSON.parse(detailLog.params), null, 2); }
                    catch { return detailLog.params; }
                  })()}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
