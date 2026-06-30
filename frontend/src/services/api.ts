import request from '../utils/request';

export interface Item {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemCreate {
  title: string;
  description?: string;
}

export const itemApi = {
  list: () => request.get<Item[]>('/items'),
  create: (data: ItemCreate) => request.post<Item>('/items', data),
  delete: (id: number) => request.delete<Item>(`/items/${id}`),
};
