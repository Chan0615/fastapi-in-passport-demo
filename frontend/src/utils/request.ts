import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  withCredentials: true,  // 跨域携带 Cookie，支持 *.ops.com SSO
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动注入 JWT 令牌
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      if (window.location.pathname !== '/login') {
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    }
    const msg =
      error.response?.data?.detail ||
      error.message ||
      '请求失败';
    return Promise.reject(new Error(msg));
  }
);

export default request;
