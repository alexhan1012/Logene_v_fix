import axios from 'axios';

const DEFAULT_SERVER = 'http://localhost:3001';

function getServerBase() {
  try {
    return localStorage.getItem('server_url') || DEFAULT_SERVER;
  } catch {
    return DEFAULT_SERVER;
  }
}

export function getServerBaseUrl() {
  return getServerBase();
}

export const SERVER_BASE = DEFAULT_SERVER;

const client = axios.create({
  timeout: 120000,
});

client.interceptors.request.use((config) => {
  config.baseURL = `${getServerBase()}/api`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.error || error.message || '请求失败';
    return Promise.reject(new Error(msg));
  }
);

const knowledge = {
  list(page = 1, pageSize = 20) {
    return client.get('/knowledge', { params: { page, pageSize } });
  },
  get(id) {
    return client.get(`/knowledge/${id}`);
  },
  create(formData) {
    return client.post('/knowledge', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update(id, formData) {
    return client.put(`/knowledge/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete(id) {
    return client.delete(`/knowledge/${id}`);
  },
};

const search = (formData) => {
  return client.post('/search', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

const settings = {
  get() {
    return client.get('/settings');
  },
  update(data) {
    return client.put('/settings', data);
  },
};

const models = {
  list() {
    return client.get('/models');
  },
};

export default { knowledge, search, settings, models };
