import api from './api'

export const authApi = {
  sendOtp: (identifier) => api.post('/auth/send-otp', { identifier }),
  verifyOtp: (identifier, otp) => api.post('/auth/verify-otp', { identifier, otp }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  applicationStats: () => api.get('/dashboard/application-stats'),
  loanStats: () => api.get('/dashboard/loan-stats'),
  repaymentStats: () => api.get('/dashboard/repayment-stats'),
}

export const applicationsApi = {
  list: (params) => api.get('/applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  approve: (id, payload) => api.post(`/applications/${id}/approve`, payload),
  counter: (id, payload) => api.post(`/applications/${id}/counter`, payload),
  reject: (id, payload) => api.post(`/applications/${id}/reject`, payload),
}

export const loansApi = {
  list: (params) => api.get('/loans', { params }),
  get: (id) => api.get(`/loans/${id}`),
  disburse: (id) => api.post(`/loans/${id}/disburse`),
  close: (id) => api.post(`/loans/${id}/close`),
}

export const repaymentsApi = {
  list: () => api.get('/repayments'),
  record: (loanId, payload) => api.post(`/loans/${loanId}/repayments`, payload),
}

export const loanTermsApi = {
  list: () => api.get('/loan-terms'),
  create: (payload) => api.post('/loan-terms', payload),
  update: (id, payload) => api.put(`/loan-terms/${id}`, payload),
  expire: (id) => api.post(`/loan-terms/${id}/expire`),
}

export const lenderApi = {
  profile: () => api.get('/lender/profile'),
  updateProfile: (payload) => api.put('/lender/profile', payload),
  officers: () => api.get('/lender/officers'),
}
