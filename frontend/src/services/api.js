import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ── Clients ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: () => api.get('/clients/').then(r => r.data),
  get: (id) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data) => api.post('/clients/', data).then(r => r.data),
  update: (id, data) => api.put(`/clients/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/clients/${id}`),
}

// ── Rate Cards ────────────────────────────────────────────────────────────────
export const rateCardsApi = {
  listDefault: () => api.get('/rate-cards/default').then(r => r.data),
  createDefault: (data) => api.post('/rate-cards/default', data).then(r => r.data),
  updateDefault: (id, data) => api.put(`/rate-cards/default/${id}`, data).then(r => r.data),
  deleteDefault: (id) => api.delete(`/rate-cards/default/${id}`),

  listClient: (clientId) => api.get(`/rate-cards/client/${clientId}`).then(r => r.data),
  createClient: (data) => api.post('/rate-cards/client', data).then(r => r.data),
  updateClient: (id, data) => api.put(`/rate-cards/client/${id}`, data).then(r => r.data),
  deleteClient: (id) => api.delete(`/rate-cards/client/${id}`),
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoicesApi = {
  list: (params) => api.get('/invoices/', { params }).then(r => r.data),
  get: (id) => api.get(`/invoices/${id}`).then(r => r.data),
  create: (data) => api.post('/invoices/', data).then(r => r.data),
  update: (id, data) => api.patch(`/invoices/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/invoices/${id}`),
  sendEmail: (data) => api.post('/invoices/send-email', data).then(r => r.data),
}

// ── Dashboard & Misc ──────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/dashboard').then(r => r.data),
}

export const statesApi = {
  list: () => api.get('/states').then(r => r.data),
}

export default api
