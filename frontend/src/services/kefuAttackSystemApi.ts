import request from '../utils/request';

export interface KefuDatasourceInfo {
  id: number;
  db_section: string;
  db_addr: string;
  db_port: number;
  db_name: string;
  db_user: string;
  default_db: number;
}

export interface KefuDdosEventsResponse {
  datasource: KefuDatasourceInfo;
  table: string;
  count: number;
  columns: string[];
  rows: Record<string, unknown>[];
}

export const kefuAttackSystemApi = {
  listAliyunDdosEvents: (limit = 200) =>
    request.get<KefuDdosEventsResponse>('/kefu-attack-system/aliyun-ddos-events', {
      params: { limit },
    }),
};
