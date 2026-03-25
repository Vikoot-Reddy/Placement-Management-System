const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(options.headers || {}) },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  getStudents: (params) => request(`/students${toQuery(params)}`),
  addStudent: (payload) => request('/students/add', { method: 'POST', body: JSON.stringify(payload) }),
  updateStudent: (id, payload) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteStudent: (id) => request(`/students/delete/${id}`),
  exportStudentsCsv: (params) => `${API_BASE}/students/export/csv${toQuery(params)}`,
  exportStudentsExcel: (params) => `${API_BASE}/students/export/excel${toQuery(params)}`,

  getCompanies: (params) => request(`/companies${toQuery(params)}`),
  addCompany: (payload) => request('/companies/add', { method: 'POST', body: JSON.stringify(payload) }),
  updateCompany: (id, payload) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  exportCompaniesCsv: (params) => `${API_BASE}/companies/export/csv${toQuery(params)}`,
  exportCompaniesExcel: (params) => `${API_BASE}/companies/export/excel${toQuery(params)}`,
  eligibleStudents: (companyId) => request(`/companies/${companyId}/eligible-students`),

  runPlacement: (companyId) => request(`/placement/run/${companyId}`),
  getPlacedStudents: () => request('/placement/placed'),
  assignPlacement: (payload) => request('/placement/assign', { method: 'POST', body: JSON.stringify(payload) }),
  getPlacements: () => request('/placement/all'),

  getAnalyticsOverview: () => request('/analytics/overview'),
  getStudentsPerBranch: () => request('/analytics/students-per-branch'),
  getPlacedPerCompany: () => request('/analytics/placed-per-company'),

  getNotifications: () => request('/notifications'),
  getUnreadNotifications: () => request('/notifications/unread'),
  markNotificationRead: (id) => request(`/notifications/mark-read/${id}`, { method: 'POST' }),

  predictPlacement: (studentId) => request(`/ai/predict/${studentId}`),
  recommendCompanies: (studentId) => request(`/ai/recommend/${studentId}`),
  aiQuery: (payload) => request('/ai/query', { method: 'POST', body: JSON.stringify(payload) }),
  getInsights: () => request('/analytics/insights'),
  testOpenAI: () => request('/ai/test'),

  uploadResume: async (file, studentId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (studentId) formData.append('studentId', studentId);
    const res = await fetch(`${API_BASE}/ai/analyze-resume`, {
      method: 'POST',
      headers: { ...authHeader() },
      body: formData
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  refreshDataset: () => request('/admin/refresh-dataset', { method: 'POST' }),
  getStatus: () => request('/admin/status'),
  getSettings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  runSmartPlacement: () => request('/placement/smart-run', { method: 'POST' }),

  reportPlacementStats: () => `${API_BASE}/reports/placement-stats.csv`,
  reportCompanyWise: () => `${API_BASE}/reports/company-wise.csv`,
  reportBranchWise: () => `${API_BASE}/reports/branch-wise.csv`
};
