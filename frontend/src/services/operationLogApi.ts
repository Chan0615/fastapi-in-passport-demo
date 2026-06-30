import request from '../utils/request';

export interface OperationLogItem {
  id: number;
  user_id: number | null;
  username: string | null;
  module: string;
  action: string;
  method: string;
  path: string;
  params: string;
  ip: string;
  status_code: number;
  cost_ms: number;
  error_msg: string;
  created_at: string;
}

export interface OperationLogList {
  total: number;
  page: number;
  page_size: number;
  items: OperationLogItem[];
}

export const operationLogApi = {
  list: (params: { page: number; page_size: number; module?: string; username?: string }) =>
    request.get<OperationLogList>('/operation-logs/', { params }),
};
