import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  me: () => client.get('/auth/me'),
};

export const dashboardApi = {
  overview: () => client.get('/dashboard/overview'),
};

export const transactionsApi = {
  list: (params) => client.get('/transactions', { params }),
  get: (id) => client.get(`/transactions/${id}`),
  submit: (payload) => client.post('/transactions', payload),
};

export const alertsApi = {
  list: (params) => client.get('/alerts', { params }),
  get: (id) => client.get(`/alerts/${id}`),
  assign: (id) => client.patch(`/alerts/${id}/assign`),
  updateStatus: (id, payload) => client.patch(`/alerts/${id}/status`, payload),
};
