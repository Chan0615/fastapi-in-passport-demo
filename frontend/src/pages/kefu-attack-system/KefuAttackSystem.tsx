import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, InputNumber, Space, Table, Tag, Typography } from 'antd';
import { BugOutlined, DatabaseOutlined, ReloadOutlined } from '@ant-design/icons';
import { kefuAttackSystemApi, KefuDdosEventsResponse } from '../../services/kefuAttackSystemApi';

const { Text } = Typography;

export default function KefuAttackSystem() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KefuDdosEventsResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [limit, setLimit] = useState(200);

  const fetchEvents = async (nextLimit = limit) => {
    setLoading(true);
    setError('');
    try {
      const res = await kefuAttackSystemApi.listAliyunDdosEvents(nextLimit);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取 aliyun_ddos_events 失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const columns = useMemo(() => {
    if (!data?.columns?.length) return [];
    return data.columns.map((col) => ({
      title: col,
      dataIndex: col,
      key: col,
      ellipsis: true as const,
      render: (value: unknown) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      },
    }));
  }, [data]);

  return (
    <div>
      <Card
        title={<span><BugOutlined /> 客服攻防系统</span>}
        extra={
          <Space>
            <Text type="secondary">查询行数</Text>
            <InputNumber
              min={1}
              max={1000}
              value={limit}
              onChange={(v) => setLimit(v || 200)}
              style={{ width: 120 }}
            />
            <Tag icon={<ReloadOutlined />} color="processing" onClick={() => fetchEvents()} style={{ cursor: 'pointer' }}>
              刷新
            </Tag>
          </Space>
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text>
            当前展示表：<Tag color="blue">aliyun_ddos_events</Tag>
          </Text>

          {data?.datasource && (
            <Alert
              type="info"
              showIcon
              icon={<DatabaseOutlined />}
              message={`数据源: ${data.datasource.db_addr}:${data.datasource.db_port}/${data.datasource.db_name}`}
              description={`db_section=${data.datasource.db_section}，用户=${data.datasource.db_user}，默认库标记=${data.datasource.default_db}`}
            />
          )}

          {error ? <Alert type="error" showIcon message={error} /> : null}

          <Table
            rowKey={(row, index) => {
              const id = row.id;
              if (typeof id === 'string' || typeof id === 'number') return String(id);
              return `row-${index}`;
            }}
            loading={loading}
            columns={columns}
            dataSource={data?.rows || []}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: 'max-content' }}
          />
        </Space>
      </Card>
    </div>
  );
}
