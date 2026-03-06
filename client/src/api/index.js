import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
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
