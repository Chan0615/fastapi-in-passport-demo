import request from '../utils/request';

export interface MysqlInfo {
  id: number;
  db_section: string;
  default_db: number;
  db_addr: string;
  db_port: number;
  db_user: string;
  db_pass: string;
  db_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface RedisInfo {
  id: number;
  db_section: string;
  default_db: number;
  addr: string;
  port: number;
  password: string;
  db: number;
  created_at?: string;
  updated_at?: string;
}

export interface MongoInfo {
  id: number;
  db_section: string;
  default_db: number;
  mongo_url: string;
  db_name: string;
  created_at?: string;
  updated_at?: string;
}

export const dbConfigApi = {
  listMysql: () => request.get<MysqlInfo[]>('/db-config/mysql'),
  getMysql: (id: number) => request.get<MysqlInfo>(`/db-config/mysql/${id}`),
  getDefaultMysql: () => request.get<MysqlInfo>('/db-config/mysql/default'),
  createMysql: (data: Omit<MysqlInfo, 'id' | 'created_at' | 'updated_at'>) =>
    request.post<MysqlInfo>('/db-config/mysql', data),
  updateMysql: (id: number, data: Partial<MysqlInfo>) =>
    request.put<MysqlInfo>(`/db-config/mysql/${id}`, data),
  deleteMysql: (id: number) => request.delete(`/db-config/mysql/${id}`),

  listRedis: () => request.get<RedisInfo[]>('/db-config/redis'),
  getRedis: (id: number) => request.get<RedisInfo>(`/db-config/redis/${id}`),
  getDefaultRedis: () => request.get<RedisInfo>('/db-config/redis/default'),
  createRedis: (data: Omit<RedisInfo, 'id' | 'created_at' | 'updated_at'>) =>
    request.post<RedisInfo>('/db-config/redis', data),
  updateRedis: (id: number, data: Partial<RedisInfo>) =>
    request.put<RedisInfo>(`/db-config/redis/${id}`, data),
  deleteRedis: (id: number) => request.delete(`/db-config/redis/${id}`),

  listMongo: () => request.get<MongoInfo[]>('/db-config/mongo'),
  getMongo: (id: number) => request.get<MongoInfo>(`/db-config/mongo/${id}`),
  getDefaultMongo: () => request.get<MongoInfo>('/db-config/mongo/default'),
  createMongo: (data: Omit<MongoInfo, 'id' | 'created_at' | 'updated_at'>) =>
    request.post<MongoInfo>('/db-config/mongo', data),
  updateMongo: (id: number, data: Partial<MongoInfo>) =>
    request.put<MongoInfo>(`/db-config/mongo/${id}`, data),
  deleteMongo: (id: number) => request.delete(`/db-config/mongo/${id}`),
};
