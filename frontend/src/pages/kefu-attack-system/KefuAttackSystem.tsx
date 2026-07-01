import { useEffect, useMemo, useState } from 'react';
import { Card, InputNumber, Space, Table, Tag, Typography, Button, Row, Col, Statistic, Tooltip } from 'antd';
import {
  BugOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  EyeOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { kefuAttackSystemApi, KefuDdosEventsResponse } from '../../services/kefuAttackSystemApi';

const { Text } = Typography;

const cellRender = (value: unknown) => {
  if (value === null || value === undefined) return <Text type="secondary">-</Text>;
  if (typeof value === 'object') return <Text code>{JSON.stringify(value)}</Text>;
  const str = String(value);
  // 时间列自动格式化
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
    return <Text style={{ fontSize: 13, color: '#595959' }}>{str.replace('T', ' ').slice(0, 19)}</Text>;
  }
  // 长文本省略 + hover 查看
  if (str.length > 50) {
    return (
      <Tooltip title={str}>
        <Text ellipsis style={{ maxWidth: 250 }}>{str}</Text>
      </Tooltip>
    );
  }
  return <Text style={{ fontSize: 13 }}>{str}</Text>;
};

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
      setError(err instanceof Error ? err.message : '读取数据失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const columns = useMemo(() => {
    if (!data?.columns?.length) return [];
    return data.columns.map((col) => ({
      title: <span style={{ fontWeight: 600, fontSize: 13 }}>{col}</span>,
      dataIndex: col,
      key: col,
      ellipsis: true as const,
      render: cellRender,
    }));
  }, [data]);

  return (
    <div>
      {/* 统计卡片 */}
      {data && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card style={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              styles={{ body: { padding: 18 } }}>
              <Statistic
                title={<span style={{ fontSize: 13, color: '#8c8c8c' }}>事件总数</span>}
                value={data.count}
                valueStyle={{ fontSize: 26, fontWeight: 700, color: '#fa8c16' }}
                prefix={<BugOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              styles={{ body: { padding: 18 } }}>
              <Statistic
                title={<span style={{ fontSize: 13, color: '#8c8c8c' }}>数据表</span>}
                value={data.table || '-'}
                valueStyle={{ fontSize: 18, fontWeight: 600, color: '#262626' }}
                prefix={<TableOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              styles={{ body: { padding: 18 } }}>
              <Statistic
                title={<span style={{ fontSize: 13, color: '#8c8c8c' }}>字段数</span>}
                value={data.columns.length}
                valueStyle={{ fontSize: 26, fontWeight: 700, color: '#722ed1' }}
                prefix={<EyeOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              styles={{ body: { padding: 18 } }}>
              <Statistic
                title={<span style={{ fontSize: 13, color: '#8c8c8c' }}>查询行数</span>}
                value={limit}
                valueStyle={{ fontSize: 26, fontWeight: 700, color: '#13c2c2' }}
                suffix={<Text style={{ fontSize: 14 }}>条</Text>}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 错误提示 */}
      {error && (
        <Card
          style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #ffccc7', background: '#fff2f0' }}
          styles={{ body: { padding: 14 } }}
        >
          <Text type="danger" style={{ fontSize: 14 }}>⚠ {error}</Text>
          <Button type="link" icon={<ReloadOutlined />} onClick={() => fetchEvents()} style={{ marginLeft: 16 }}>
            重试
          </Button>
        </Card>
      )}

      {/* 主表格 */}
      <Card
        title={
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <BugOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 16 }}>DDoS 攻击事件</span>
            {data?.datasource && (
              <Tag color="orange" icon={<DatabaseOutlined />}>
                {data.datasource.db_addr}:{data.datasource.db_port}/{data.datasource.db_name}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 13 }}>行数</Text>
            <InputNumber
              min={1} max={2000}
              value={limit}
              onChange={(v) => setLimit(v || 200)}
              style={{ width: 100, borderRadius: 6 }}
              size="small"
            />
            <Button
              type="primary"
              ghost
              icon={<ReloadOutlined />}
              onClick={() => fetchEvents()}
              size="small"
              style={{ borderRadius: 6 }}
            >
              查询
            </Button>
          </Space>
        }
        style={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table
          rowKey={(row, index) => {
            const id = row.id as string | number | undefined;
            return id !== undefined && id !== null ? String(id) : `row-${index}`;
          }}
          loading={loading}
          columns={columns}
          dataSource={data?.rows || []}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 'max-content' }}
          size="middle"
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>
    </div>
  );
}
