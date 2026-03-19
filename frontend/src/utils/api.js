import axios from 'axios';

const api = axios.create({ baseURL: '' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  login:    (body) => api.post('/api/auth?action=login',    body),
  register: (body) => api.post('/api/auth?action=register', body),
  me:       ()     => api.get('/api/auth?action=me'),
  users:    ()     => api.get('/api/auth?action=users'),
};

export const assetsAPI = {
  list:       (params)    => api.get('/api/assets', { params }),
  get:        (num)       => api.get(`/api/assets/${num}`),
  create:     (body)      => api.post('/api/assets', body),
  update:     (num, body) => api.put(`/api/assets/${num}`, body),
  delete:     (num)       => api.delete(`/api/assets/${num}`),
  scans:      (num)       => api.get(`/api/assets/${num}/scans`),
  recordScan: (num, body) => api.post(`/api/assets/${num}/scans`, body),
};

export const qrAPI = {
  generate: (num, base_url) =>
    api.get('/api/qr', { params: { asset: num, base_url }, responseType: 'blob' }),
  info: (num) =>
    api.get('/api/qr', { params: { asset: num, action: 'info' } }),
};

export const dashboardAPI = {
  stats: () => api.get('/api/dashboard'),
};
