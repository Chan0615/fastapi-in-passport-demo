import { useState } from 'react';
import { Input, Popover, Empty } from 'antd';
import * as Icons from '@ant-design/icons';

interface IconPickerProps {
  value?: string;
  onChange?: (value: string) => void;
}

// 筛选出常用图标（避免渲染全部 800+ 图标）
const commonIconNames = [
  'HomeOutlined', 'AppstoreOutlined', 'SettingOutlined', 'UserOutlined',
  'TeamOutlined', 'SafetyOutlined', 'DatabaseOutlined', 'DashboardOutlined',
  'FileOutlined', 'FileTextOutlined', 'FolderOutlined', 'FolderOpenOutlined',
  'SearchOutlined', 'EditOutlined', 'DeleteOutlined', 'PlusOutlined',
  'CheckOutlined', 'CloseOutlined', 'ReloadOutlined', 'DownloadOutlined',
  'UploadOutlined', 'CloudOutlined', 'CloudServerOutlined', 'ApiOutlined',
  'ToolOutlined', 'BugOutlined', 'CodeOutlined', 'GitlabOutlined',
  'GithubOutlined', 'ContainerOutlined', 'HddOutlined', 'DesktopOutlined',
  'ServerOutlined', 'GlobalOutlined', 'WifiOutlined', 'ThunderboltOutlined',
  'BellOutlined', 'MailOutlined', 'MessageOutlined', 'NotificationOutlined',
  'CalendarOutlined', 'ClockCircleOutlined', 'HistoryOutlined', 'EyeOutlined',
  'StarOutlined', 'HeartOutlined', 'FireOutlined', 'TrophyOutlined',
  'ShoppingOutlined', 'CartOutlined', 'MoneyCollectOutlined', 'DollarOutlined',
  'BarChartOutlined', 'LineChartOutlined', 'PieChartOutlined', 'AreaChartOutlined',
  'TableOutlined', 'ProfileOutlined', 'SolutionOutlined', 'FundOutlined',
  'ClusterOutlined', 'ShareAltOutlined', 'DeploymentUnitOutlined', 'BranchesOutlined',
  'LockOutlined', 'UnlockOutlined', 'KeyOutlined', 'SafetyCertificateOutlined',
  'AlertOutlined', 'WarningOutlined', 'InfoCircleOutlined', 'QuestionCircleOutlined',
  'CheckCircleOutlined', 'CloseCircleOutlined', 'ExclamationCircleOutlined',
  'SyncOutlined', 'LoadingOutlined', 'PoweroffOutlined', 'LogoutOutlined',
  'LoginOutlined', 'EnvironmentOutlined', 'CompassOutlined', 'AimOutlined',
  'CameraOutlined', 'VideoCameraOutlined', 'SoundOutlined', 'PhoneOutlined',
  'CustomerServiceOutlined', 'ContactsOutlined', 'SolutionOutlined',
];

const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const iconNames = commonIconNames.filter(name =>
    name.toLowerCase().includes(keyword.toLowerCase())
  );

  const renderIcon = (name: string) => {
    const IconComp = (Icons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[name];
    return IconComp ? <IconComp /> : null;
  };

  const CurrentIcon = value
    ? (Icons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[value]
    : null;

  const content = (
    <div style={{ width: 320 }}>
      <Input.Search
        placeholder="搜索图标名称"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 8,
          maxHeight: 280,
          overflowY: 'auto',
        }}
      >
        {iconNames.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          iconNames.map((name) => {
            const IconComp = (Icons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[name];
            return (
              <div
                key={name}
                title={name}
                onClick={() => {
                  onChange?.(name);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 40,
                  cursor: 'pointer',
                  borderRadius: 6,
                  border: '1px solid #f0f0f0',
                  background: value === name ? '#e6f4ff' : '#fff',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f5ff';
                  e.currentTarget.style.borderColor = '#1677ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = value === name ? '#e6f4ff' : '#fff';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                }}
              >
                {IconComp && <IconComp style={{ fontSize: 18, color: value === name ? '#1677ff' : '#595959' }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="点击选择图标"
        prefix={CurrentIcon ? <CurrentIcon style={{ color: '#1677ff' }} /> : undefined}
        readOnly
        style={{ cursor: 'pointer' }}
      />
    </Popover>
  );
};

export default IconPicker;
