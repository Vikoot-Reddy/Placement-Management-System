
import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545'];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [companiesPage, setCompaniesPage] = useState([]);
  const [companiesAll, setCompaniesAll] = useState([]);
  const [placedStudents, setPlacedStudents] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({ averageCgpa: 0, placement: { total: 0, placed: 0, percentage: 0 } });
  const [branchChart, setBranchChart] = useState([]);
  const [companyChart, setCompanyChart] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ database: null, openaiKeyConfigured: null, lastSeedRefresh: null });
  const [settings, setSettings] = useState(null);
  const [insights, setInsights] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [openAiTest, setOpenAiTest] = useState(null);

  const [lastPlaced, setLastPlaced] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({ students: false, companies: false, placement: false });

  const [studentTotal, setStudentTotal] = useState(0);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [companyTotal, setCompanyTotal] = useState(0);
  const [companyTotalPages, setCompanyTotalPages] = useState(1);

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    branch: '',
    cgpa: '',
    backlogs: 0
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    role: '',
    minCgpa: '',
    eligibleBranches: '',
    maxBacklogs: 0
  });

  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingCompanyId, setEditingCompanyId] = useState(null);

  const [studentFilter, setStudentFilter] = useState({
    name: '',
    branch: '',
    placed: 'all',
    cgpaMin: '',
    cgpaMax: '',
    companyName: ''
  });

  const [companyFilter, setCompanyFilter] = useState({
    name: '',
    minCgpa: ''
  });

  const [studentPage, setStudentPage] = useState(0);
  const [companyPage, setCompanyPage] = useState(0);
  const studentPageSize = 10;
  const companyPageSize = 10;

  const [studentSort, setStudentSort] = useState({ field: 'id', dir: 'asc' });
  const [companySort, setCompanySort] = useState({ field: 'id', dir: 'asc' });

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [eligibleCompanyName, setEligibleCompanyName] = useState('');
  const [predictionMap, setPredictionMap] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [recommendedStudent, setRecommendedStudent] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState('');
  const [resumeDetails, setResumeDetails] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeStudentId, setResumeStudentId] = useState('');
  const [aiQueryText, setAiQueryText] = useState('');
  const [aiQueryResult, setAiQueryResult] = useState(null);

  const [assignForm, setAssignForm] = useState({
    studentId: '',
    companyId: '',
    offerStatus: 'OFFERED',
    packageAmount: '',
    placementDate: ''
  });

  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || '',
    role: localStorage.getItem('role') || '',
    username: localStorage.getItem('username') || ''
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', role: 'STUDENT' });
  const [showRegister, setShowRegister] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = auth.role === 'ADMIN';
  const isOfficer = auth.role === 'PLACEMENT_OFFICER';
  const canEdit = isAdmin || isOfficer;

  const loadStudents = async (page = studentPage) => {
    setLoading((l) => ({ ...l, students: true }));
    const data = await api.getStudents({
      name: studentFilter.name,
      branch: studentFilter.branch,
      placed: studentFilter.placed,
      cgpaMin: studentFilter.cgpaMin,
      cgpaMax: studentFilter.cgpaMax,
      companyName: studentFilter.companyName,
      page,
      size: studentPageSize,
      sort: studentSort.field,
      dir: studentSort.dir
    });
    setStudents(data.content || []);
    setStudentTotal(data.totalElements || 0);
    setStudentTotalPages(data.totalPages || 1);
    setStudentPage(data.number || 0);
    setLoading((l) => ({ ...l, students: false }));
  };

  const loadCompanies = async (page = companyPage) => {
    setLoading((l) => ({ ...l, companies: true }));
    const data = await api.getCompanies({
      name: companyFilter.name,
      minCgpa: companyFilter.minCgpa,
      page,
      size: companyPageSize,
      sort: companySort.field,
      dir: companySort.dir
    });
    setCompaniesPage(data.content || []);
    setCompanyTotal(data.totalElements || 0);
    setCompanyTotalPages(data.totalPages || 1);
    setCompanyPage(data.number || 0);

    const all = await api.getCompanies({
      page: 0,
      size: 1000,
      sort: 'name',
      dir: 'asc'
    });
    setCompaniesAll(all.content || []);
    if (all.content && all.content.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(String(all.content[0].id));
      setAssignForm((f) => ({ ...f, companyId: String(all.content[0].id) }));
    }
    setLoading((l) => ({ ...l, companies: false }));
  };

  const loadPlaced = async () => {
    const data = await api.getPlacedStudents();
    setPlacedStudents(data || []);
  };

  const loadPlacements = async () => {
    const data = await api.getPlacements();
    setPlacements(data || []);
  };

  const loadNotifications = async () => {
    const data = await api.getNotifications();
    setNotifications(data || []);
  };

  const loadAnalytics = async () => {
    const overview = await api.getAnalyticsOverview();
    const perBranch = await api.getStudentsPerBranch();
    const perCompany = await api.getPlacedPerCompany();

    setAnalytics(overview);
    setBranchChart(perBranch.map((r) => ({ branch: r[0], count: r[1] })));
    setCompanyChart(perCompany.map((r) => ({ company: r[0], count: r[1] })));
  };

  const loadSettings = async () => {
    const data = await api.getSettings();
    setSettings(data);
  };

  const loadInsights = async () => {
    const data = await api.getInsights();
    setInsights(data);
  };

  const refreshAll = async () => {
    await Promise.all([
      loadStudents(0),
      loadCompanies(0),
      loadPlaced(),
      loadPlacements(),
      loadNotifications(),
      loadAnalytics(),
      loadStatus(),
      loadSettings(),
      loadInsights()
    ]);
  };

  const loadStatus = async () => {
    const data = await api.getStatus();
    setSystemStatus(data);
  };

  useEffect(() => {
    if (auth.token) {
      refreshAll().catch((e) => setError(e.message));
    }
  }, [auth.token]);

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme.toLowerCase());
    }
  }, [settings]);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (auth.token) {
      loadStudents(0).catch((e) => setError(e.message));
    }
  }, [studentFilter, studentSort]);

  useEffect(() => {
    if (auth.token) {
      loadCompanies(0).catch((e) => setError(e.message));
    }
  }, [companyFilter, companySort]);

  const onLogin = async (e) => {
    e.preventDefault();
    setError('');
    const res = await api.login(loginForm);
    localStorage.setItem('token', res.token);
    localStorage.setItem('role', res.role);
    localStorage.setItem('username', res.username);
    setAuth({ token: res.token, role: res.role, username: res.username });
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setError('');
    const res = await api.register(registerForm);
    localStorage.setItem('token', res.token);
    localStorage.setItem('role', res.role);
    localStorage.setItem('username', res.username);
    setAuth({ token: res.token, role: res.role, username: res.username });
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setAuth({ token: '', role: '', username: '' });
  };

  const onAddOrUpdateStudent = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...studentForm,
      cgpa: Number(studentForm.cgpa),
      backlogs: Number(studentForm.backlogs)
    };

    if (editingStudentId) {
      await api.updateStudent(editingStudentId, payload);
      setEditingStudentId(null);
    } else {
      await api.addStudent(payload);
    }

    setStudentForm({ name: '', email: '', branch: '', cgpa: '', backlogs: 0 });
    await loadStudents(0);
    await loadPlaced();
    await loadAnalytics();
  };

  const onDeleteStudent = async (id) => {
    setError('');
    await api.deleteStudent(id);
    await loadStudents(0);
    await loadPlaced();
    await loadAnalytics();
  };

  const onEditStudent = (student) => {
    setEditingStudentId(student.id);
    setStudentForm({
      name: student.name || '',
      email: student.email || '',
      branch: student.branch || '',
      cgpa: student.cgpa ?? '',
      backlogs: student.backlogs ?? 0
    });
  };

  const onCancelStudentEdit = () => {
    setEditingStudentId(null);
    setStudentForm({ name: '', email: '', branch: '', cgpa: '', backlogs: 0 });
  };

  const onAddOrUpdateCompany = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...companyForm,
      minCgpa: Number(companyForm.minCgpa),
      maxBacklogs: Number(companyForm.maxBacklogs)
    };

    if (editingCompanyId) {
      await api.updateCompany(editingCompanyId, payload);
      setEditingCompanyId(null);
    } else {
      await api.addCompany(payload);
    }

    setCompanyForm({ name: '', role: '', minCgpa: '', eligibleBranches: '', maxBacklogs: 0 });
    await loadCompanies(0);
    await loadAnalytics();
  };

  const onEditCompany = (company) => {
    setEditingCompanyId(company.id);
    setCompanyForm({
      name: company.name || '',
      role: company.role || '',
      minCgpa: company.minCgpa ?? '',
      eligibleBranches: company.eligibleBranches || '',
      maxBacklogs: company.maxBacklogs ?? 0
    });
  };

  const onCancelCompanyEdit = () => {
    setEditingCompanyId(null);
    setCompanyForm({ name: '', role: '', minCgpa: '', eligibleBranches: '', maxBacklogs: 0 });
  };

  const onRunPlacement = async () => {
    if (!selectedCompanyId) return;
    setError('');
    setLoading((l) => ({ ...l, placement: true }));
    const count = await api.runPlacement(selectedCompanyId);
    setLastPlaced(count);
    await refreshAll();
    setLoading((l) => ({ ...l, placement: false }));
  };

  const onRunSmartPlacement = async () => {
    setError('');
    setLoading((l) => ({ ...l, placement: true }));
    const count = await api.runSmartPlacement();
    setLastPlaced(count);
    await refreshAll();
    setLoading((l) => ({ ...l, placement: false }));
  };

  const onAssignPlacement = async (e) => {
    e.preventDefault();
    setError('');
    await api.assignPlacement({
      ...assignForm,
      studentId: Number(assignForm.studentId),
      companyId: Number(assignForm.companyId),
      packageAmount: assignForm.packageAmount ? Number(assignForm.packageAmount) : null,
      placementDate: assignForm.placementDate || null
    });
    await refreshAll();
  };

  const onFetchEligible = async (company) => {
    const data = await api.eligibleStudents(company.id);
    setEligibleCompanyName(company.name);
    setEligibleStudents(data || []);
  };

  const onPredict = async (studentId) => {
    const res = await api.predictPlacement(studentId);
    setPredictionMap((prev) => ({ ...prev, [studentId]: { probability: res.probability, tag: res.tag } }));
  };

  const onRecommend = async (studentId) => {
    const res = await api.recommendCompanies(studentId);
    setRecommendations(res || []);
    const student = students.find((s) => s.id === studentId);
    setRecommendedStudent(student ? student.name : '');
  };

  const onUploadResume = async (e) => {
    e.preventDefault();
    setError('');
    if (!resumeFile) {
      setError('Please choose a resume file first.');
      return;
    }
    try {
      const res = await api.uploadResume(resumeFile, resumeStudentId || null);
      setResumeAnalysis(res.analysis || 'No analysis returned.');
      setResumeDetails(res);
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.message || 'Resume analysis failed.');
    }
  };

  const onAiQuery = async (e) => {
    e.preventDefault();
    if (!aiQueryText.trim()) return;
    const res = await api.aiQuery({ query: aiQueryText, limit: 10 });
    setAiQueryResult(res);
  };

  const onUpdateSettings = async (e) => {
    e.preventDefault();
    if (!settings) return;
    const updated = await api.updateSettings(settings);
    setSettings(updated);
  };

  const onTestOpenAi = async () => {
    setError('');
    try {
      const res = await api.testOpenAI();
      setOpenAiTest(res);
    } catch (err) {
      setOpenAiTest({ ok: false, message: err.message || 'Test failed' });
    }
  };

  const markNotificationRead = async (id) => {
    await api.markNotificationRead(id);
    await loadNotifications();
  };

  const downloadFile = async (url, filename) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } });
    if (!res.ok) {
      setError(`Download failed: ${res.status}`);
      return;
    }
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const toggleStudentSort = (field) => {
    setStudentSort((prev) => {
      const dir = prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc';
      return { field, dir };
    });
    setStudentPage(0);
  };

  const toggleCompanySort = (field) => {
    setCompanySort((prev) => {
      const dir = prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc';
      return { field, dir };
    });
    setCompanyPage(0);
  };

  const totalStudents = studentTotal;
  const totalPlaced = placedStudents.length;
  const totalUnplaced = totalStudents - totalPlaced;
  const placementByBranchInsights = (insights?.placementByBranch || []).map((r) => ({
    branch: r[0],
    placed: Number(r[1]),
    total: Number(r[2]),
    rate: Number(r[2]) === 0 ? 0 : Math.round((Number(r[1]) * 100) / Number(r[2]))
  }));

  const resetStudentFilters = () => {
    setStudentFilter({ name: '', branch: '', placed: 'all', cgpaMin: '', cgpaMax: '', companyName: '' });
    setStudentPage(0);
  };

  const resetCompanyFilters = () => {
    setCompanyFilter({ name: '', minCgpa: '' });
    setCompanyPage(0);
  };

  const studentExportParams = useMemo(() => ({
    name: studentFilter.name,
    branch: studentFilter.branch,
    placed: studentFilter.placed,
    cgpaMin: studentFilter.cgpaMin,
    cgpaMax: studentFilter.cgpaMax,
    companyName: studentFilter.companyName
  }), [studentFilter]);

  const companyExportParams = useMemo(() => ({
    name: companyFilter.name,
    minCgpa: companyFilter.minCgpa
  }), [companyFilter]);

  if (!auth.token) {
    return (
      <div className="container py-5" style={{ maxWidth: 420 }}>
        <h3 className="mb-3">{showRegister ? 'Create Account' : 'Login'}</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        {!showRegister ? (
          <form onSubmit={onLogin}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input className="form-control" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </div>
            <button className="btn btn-primary w-100" type="submit">Sign In</button>
            <button type="button" className="btn btn-outline-light w-100 mt-2" onClick={() => setShowRegister(true)}>Create Account</button>
            <div className="text-muted small mt-3">Default users: admin/admin123, officer/officer123, student/student123</div>
          </form>
        ) : (
          <form onSubmit={onRegister}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input className="form-control" value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <select className="form-select" value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
                <option value="STUDENT">Student</option>
                <option value="PLACEMENT_OFFICER">Placement Officer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button className="btn btn-primary w-100" type="submit">Register</button>
            <button type="button" className="btn btn-outline-light w-100 mt-2" onClick={() => setShowRegister(false)}>Back to Sign In</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="d-flex">
      {sidebarOpen && (
        <div className="sidebar p-3">
        <div className="sidebar-navbar glass mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="fw-semibold text-white">Placement System</div>
            <span className="badge bg-primary">AI</span>
          </div>
          <div className="small text-muted">Admin Console</div>
        </div>
        <div className="nav flex-column gap-1">
          <button className={`nav-link btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={`nav-link btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>Students</button>
          <button className={`nav-link btn ${activeTab === 'companies' ? 'active' : ''}`} onClick={() => setActiveTab('companies')}>Companies</button>
          <button className={`nav-link btn ${activeTab === 'placement' ? 'active' : ''}`} onClick={() => setActiveTab('placement')}>Placement</button>
          <button className={`nav-link btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Reports</button>
          <button className={`nav-link btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Notifications</button>
          <button className={`nav-link btn ${activeTab === 'ai-insights' ? 'active' : ''}`} onClick={() => setActiveTab('ai-insights')}>AI Insights</button>
          <button className={`nav-link btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
        </div>
        <div className="glass p-3 mt-4">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
              {auth.username ? auth.username[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="fw-semibold text-white">{auth.username}</div>
              <div className="small text-muted">{auth.role}</div>
            </div>
          </div>
          <div className="mt-3 small">
            <div className="d-flex justify-content-between">
              <span className="text-muted">DB</span>
              <span className={systemStatus.database ? 'text-success' : 'text-danger'}>
                {systemStatus.database === null ? '...' : (systemStatus.database ? 'OK' : 'DOWN')}
              </span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">OpenAI</span>
              <span className={systemStatus.openaiKeyConfigured ? 'text-success' : 'text-danger'}>
                {systemStatus.openaiKeyConfigured === null ? '...' : (systemStatus.openaiKeyConfigured ? 'OK' : 'MISSING')}
              </span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Last Refresh</span>
              <span className="text-white small">{systemStatus.lastSeedRefresh || '—'}</span>
            </div>
          </div>
          <button className="btn btn-sm btn-outline-light mt-3 w-100" onClick={onLogout}>Logout</button>
        </div>
      </div>
      )}

      <div className="flex-grow-1">
        <div className="topbar d-flex align-items-center justify-content-between px-3">
          <button className="btn btn-outline-light" onClick={() => setSidebarOpen((s) => !s)}>
            &#9776;
          </button>
          <div className="small text-muted">Student Placement Management System</div>
        </div>
        <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm glass">
              <div className="card-body">
                <div className="text-muted">Total Students</div>
                <div className="fs-3 fw-semibold">{totalStudents}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm glass">
              <div className="card-body">
                <div className="text-muted">Placed</div>
                <div className="fs-3 fw-semibold text-success">{totalPlaced}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm glass">
              <div className="card-body">
                <div className="text-muted">Unplaced</div>
                <div className="fs-3 fw-semibold text-warning">{totalUnplaced}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm glass">
              <div className="card-body">
                <div className="text-muted">Companies</div>
                <div className="fs-3 fw-semibold">{companyTotal}</div>
              </div>
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="mb-3">
            <button className="btn btn-outline-warning" onClick={() => api.refreshDataset().then(refreshAll).catch((e) => setError(e.message))}>
              Refresh Dataset Now
            </button>
            <span className="small text-muted ms-2">Hourly auto-refresh is enabled.</span>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Students per Branch</div>
                <div className="card-body" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchChart}>
                      <XAxis dataKey="branch" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0d6efd" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Placed per Company</div>
                <div className="card-body" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={companyChart}>
                      <XAxis dataKey="company" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#198754" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="small text-muted mt-2">Hover bars to see company name</div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Placement Percentage</div>
                <div className="card-body" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie dataKey="value" data={[
                        { name: 'Placed', value: analytics.placement.placed || 0 },
                        { name: 'Unplaced', value: (analytics.placement.total || 0) - (analytics.placement.placed || 0) }
                      ]} outerRadius={90} label>
                        {PIE_COLORS.map((c, idx) => <Cell key={idx} fill={c} />)}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Average CGPA</div>
                <div className="card-body">
                  <div className="display-4">{Number(analytics.averageCgpa || 0).toFixed(2)}</div>
                  <div className="text-muted">Across all students</div>
                </div>
              </div>

              <div className="card shadow-sm mt-3">
                <div className="card-header fw-semibold">AI Tools</div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Resume Upload (OpenAI Analysis)</label>
                    <input type="file" className="form-control" onChange={(e) => setResumeFile(e.target.files[0])} />
                    <select className="form-select mt-2" value={resumeStudentId} onChange={(e) => setResumeStudentId(e.target.value)}>
                      <option value="">Select Student (optional)</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button className="btn btn-outline-primary w-100 mt-2" onClick={onUploadResume}>Analyze Resume</button>
                  </div>
                  <div className="glass p-3">
                    <div className="fw-semibold mb-2">Analysis Results</div>
                    {!resumeAnalysis && !resumeDetails && (
                      <div className="text-muted small">Upload a resume to see analysis results here.</div>
                    )}
                    {resumeAnalysis && (
                      <div className="alert alert-info small" style={{ whiteSpace: 'pre-wrap' }}>
                        {resumeAnalysis}
                      </div>
                    )}
                    {resumeDetails && (
                      <div className="mt-2 small">
                        {resumeDetails.detectedSkills && <div><strong>Skills:</strong> {resumeDetails.detectedSkills}</div>}
                        {resumeDetails.missingSkills && <div><strong>Missing:</strong> {resumeDetails.missingSkills}</div>}
                        {resumeDetails.suggestions && <div><strong>Suggestions:</strong> {resumeDetails.suggestions}</div>}
                        {resumeDetails.placementChance !== null && resumeDetails.placementChance !== undefined && (
                          <div><strong>Placement Chance:</strong> {resumeDetails.placementChance}%</div>
                        )}
                      </div>
                    )}
                  </div>

                  {recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="fw-semibold mb-2">Recommended Companies {recommendedStudent && `for ${recommendedStudent}`}</div>
                      <ul className="list-group">
                        {recommendations.slice(0, 5).map((r) => (
                          <li key={r.companyId} className="list-group-item d-flex justify-content-between">
                            <span>{r.companyName}</span>
                            <span>{r.eligible ? 'Eligible' : 'Low chance'} | Score: {r.score.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow-sm mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Search / Filter Students</span>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-success" onClick={() => downloadFile(api.exportStudentsCsv(studentExportParams), 'students.csv')}>Export CSV</button>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => downloadFile(api.exportStudentsExcel(studentExportParams), 'students.xlsx')}>Export Excel</button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={resetStudentFilters}>Clear</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input className="form-control" placeholder="Search name" value={studentFilter.name}
                             onChange={(e) => setStudentFilter({ ...studentFilter, name: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" placeholder="Search branch" value={studentFilter.branch}
                             onChange={(e) => setStudentFilter({ ...studentFilter, branch: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <select className="form-select" value={studentFilter.placed}
                              onChange={(e) => setStudentFilter({ ...studentFilter, placed: e.target.value })}>
                        <option value="all">All</option>
                        <option value="yes">Placed</option>
                        <option value="no">Not Placed</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" placeholder="CGPA min" type="number" step="0.01"
                             value={studentFilter.cgpaMin}
                             onChange={(e) => setStudentFilter({ ...studentFilter, cgpaMin: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" placeholder="CGPA max" type="number" step="0.01"
                             value={studentFilter.cgpaMax}
                             onChange={(e) => setStudentFilter({ ...studentFilter, cgpaMax: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" placeholder="Company name" value={studentFilter.companyName}
                             onChange={(e) => setStudentFilter({ ...studentFilter, companyName: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold d-flex justify-content-between">
                  <span>Students</span>
                  {loading.students && <span className="text-muted">Loading...</span>}
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped align-middle">
                      <thead>
                        <tr>
                          <th role="button" onClick={() => toggleStudentSort('id')}>ID</th>
                          <th role="button" onClick={() => toggleStudentSort('name')}>Name</th>
                          <th role="button" onClick={() => toggleStudentSort('email')}>Email</th>
                          <th role="button" onClick={() => toggleStudentSort('branch')}>Branch</th>
                          <th role="button" onClick={() => toggleStudentSort('cgpa')}>CGPA</th>
                          <th>Score</th>
                          <th>Tag</th>
                          <th>Backlogs</th>
                          <th role="button" onClick={() => toggleStudentSort('placed')}>Placed</th>
                          <th>Company</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length === 0 && (
                          <tr>
                            <td colSpan="11" className="text-center text-muted">No students found.</td>
                          </tr>
                        )}
                        {students.map((s) => (
                          <tr key={s.id}>
                            <td>{s.id}</td>
                            <td>{s.name}</td>
                            <td>{s.email}</td>
                            <td>{s.branch}</td>
                            <td>{s.cgpa}</td>
                            <td>{s.placementScore ? `${s.placementScore.toFixed(1)}%` : '—'}</td>
                            <td>{s.tag ? <span className="badge bg-info">{s.tag}</span> : '—'}</td>
                            <td>{s.backlogs}</td>
                            <td>{s.placed ? <span className="badge bg-success">Yes</span> : <span className="badge bg-secondary">No</span>}</td>
                            <td>{s.company ? s.company.name : '—'}</td>
                            <td>
                              {canEdit && (
                                <div className="btn-group">
                                  <button className="btn btn-sm btn-outline-secondary" onClick={() => onEditStudent(s)}>Edit</button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDeleteStudent(s.id)}>Delete</button>
                                </div>
                              )}
                              <div className="mt-2 d-flex gap-2">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => onPredict(s.id)}>Predict</button>
                                <button className="btn btn-sm btn-outline-info" onClick={() => onRecommend(s.id)}>Recommend</button>
                              </div>
                              {predictionMap[s.id] !== undefined && (
                                <div className="small text-muted mt-1">
                                  Probability: {predictionMap[s.id].probability.toFixed(2)}% | {predictionMap[s.id].tag}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted">Page {studentPage + 1} of {studentTotalPages} (Total: {studentTotal})</div>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-secondary" disabled={studentPage === 0} onClick={() => loadStudents(studentPage - 1)}>Prev</button>
                      <button className="btn btn-sm btn-outline-secondary" disabled={studentPage + 1 >= studentTotalPages} onClick={() => loadStudents(studentPage + 1)}>Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">{editingStudentId ? 'Edit Student' : 'Add Student'}</div>
                <div className="card-body">
                  {canEdit ? (
                    <form onSubmit={onAddOrUpdateStudent}>
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input className="form-control" value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Branch</label>
                        <input className="form-control" value={studentForm.branch} onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">CGPA</label>
                        <input type="number" step="0.01" min="0" className="form-control" value={studentForm.cgpa} onChange={(e) => setStudentForm({ ...studentForm, cgpa: e.target.value })} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Backlogs</label>
                        <input type="number" min="0" className="form-control" value={studentForm.backlogs} onChange={(e) => setStudentForm({ ...studentForm, backlogs: e.target.value })} required />
                      </div>
                      <button type="submit" className="btn btn-primary w-100">{editingStudentId ? 'Save Changes' : 'Add Student'}</button>
                      {editingStudentId && (
                        <button type="button" className="btn btn-outline-secondary w-100 mt-2" onClick={onCancelStudentEdit}>Cancel</button>
                      )}
                    </form>
                  ) : (
                    <div className="text-muted">You don't have permission to edit students.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow-sm mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Search / Filter Companies</span>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-success" onClick={() => downloadFile(api.exportCompaniesCsv(companyExportParams), 'companies.csv')}>Export CSV</button>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => downloadFile(api.exportCompaniesExcel(companyExportParams), 'companies.xlsx')}>Export Excel</button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={resetCompanyFilters}>Clear</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input className="form-control" placeholder="Search name" value={companyFilter.name}
                             onChange={(e) => setCompanyFilter({ ...companyFilter, name: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <input type="number" step="0.01" min="0" className="form-control" placeholder="Min CGPA (>=)"
                             value={companyFilter.minCgpa}
                             onChange={(e) => setCompanyFilter({ ...companyFilter, minCgpa: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold d-flex justify-content-between">
                  <span>Companies</span>
                  {loading.companies && <span className="text-muted">Loading...</span>}
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped align-middle">
                      <thead>
                        <tr>
                          <th role="button" onClick={() => toggleCompanySort('id')}>ID</th>
                          <th role="button" onClick={() => toggleCompanySort('name')}>Name</th>
                          <th role="button" onClick={() => toggleCompanySort('role')}>Role</th>
                          <th role="button" onClick={() => toggleCompanySort('minCgpa')}>Min CGPA</th>
                          <th>Branches</th>
                          <th>Max Backlogs</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companiesPage.length === 0 && (
                          <tr>
                            <td colSpan="7" className="text-center text-muted">No companies found.</td>
                          </tr>
                        )}
                        {companiesPage.map((c) => (
                          <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.name}</td>
                            <td>{c.role}</td>
                            <td>{c.minCgpa}</td>
                            <td>{c.eligibleBranches || 'Any'}</td>
                            <td>{c.maxBacklogs}</td>
                            <td>
                              <div className="btn-group">
                                {canEdit && <button className="btn btn-sm btn-outline-secondary" onClick={() => onEditCompany(c)}>Edit</button>}
                                <button className="btn btn-sm btn-outline-info" onClick={() => onFetchEligible(c)}>Eligible</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted">Page {companyPage + 1} of {companyTotalPages} (Total: {companyTotal})</div>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-secondary" disabled={companyPage === 0} onClick={() => loadCompanies(companyPage - 1)}>Prev</button>
                      <button className="btn btn-sm btn-outline-secondary" disabled={companyPage + 1 >= companyTotalPages} onClick={() => loadCompanies(companyPage + 1)}>Next</button>
                    </div>
                  </div>
                </div>
              </div>

              {eligibleStudents.length > 0 && (
                <div className="card shadow-sm mt-3">
                  <div className="card-header fw-semibold">Eligible Students for {eligibleCompanyName}</div>
                  <div className="card-body">
                    <ul className="list-group">
                      {eligibleStudents.map((s) => (
                        <li key={s.id} className="list-group-item d-flex justify-content-between">
                          <span>{s.name} ({s.branch})</span>
                          <span>CGPA: {s.cgpa} | Backlogs: {s.backlogs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">{editingCompanyId ? 'Edit Company' : 'Add Company'}</div>
                <div className="card-body">
                  {canEdit ? (
                    <form onSubmit={onAddOrUpdateCompany}>
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input className="form-control" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <input className="form-control" value={companyForm.role} onChange={(e) => setCompanyForm({ ...companyForm, role: e.target.value })} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Min CGPA</label>
                        <input type="number" step="0.01" min="0" className="form-control" value={companyForm.minCgpa} onChange={(e) => setCompanyForm({ ...companyForm, minCgpa: e.target.value })} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Eligible Branches (comma separated)</label>
                        <input className="form-control" value={companyForm.eligibleBranches} onChange={(e) => setCompanyForm({ ...companyForm, eligibleBranches: e.target.value })} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Max Backlogs</label>
                        <input type="number" min="0" className="form-control" value={companyForm.maxBacklogs} onChange={(e) => setCompanyForm({ ...companyForm, maxBacklogs: e.target.value })} required />
                      </div>
                      <button type="submit" className="btn btn-primary w-100">{editingCompanyId ? 'Save Changes' : 'Add Company'}</button>
                      {editingCompanyId && (
                        <button type="button" className="btn btn-outline-secondary w-100 mt-2" onClick={onCancelCompanyEdit}>Cancel</button>
                      )}
                    </form>
                  ) : (
                    <div className="text-muted">You don't have permission to edit companies.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'placement' && (
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Run Placement</div>
                <div className="card-body">
                  {companiesAll.length === 0 ? (
                    <div className="alert alert-warning mb-0">Add a company first to run placement.</div>
                  ) : (
                    <div>
                      <label className="form-label">Select Company</label>
                      <select className="form-select mb-3" value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}>
                        {companiesAll.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} - {c.role} (Min CGPA: {c.minCgpa})</option>
                        ))}
                      </select>
                      {canEdit && <button className="btn btn-success w-100" onClick={onRunPlacement} disabled={loading.placement}>Run Placement</button>}
                      {canEdit && <button className="btn btn-outline-primary w-100 mt-2" onClick={onRunSmartPlacement} disabled={loading.placement}>Run Smart Placement</button>}
                      <div className="text-muted small mt-2">Runs placement for unplaced students meeting the CGPA criteria.</div>
                    </div>
                  )}
                </div>
              </div>
              {lastPlaced !== null && (
                <div className="alert alert-info mt-3">Placement completed. Students placed: <strong>{lastPlaced}</strong></div>
              )}

              <div className="card shadow-sm mt-3">
                <div className="card-header fw-semibold">Assign Placement</div>
                <div className="card-body">
                  {canEdit ? (
                    <form onSubmit={onAssignPlacement}>
                      <div className="mb-3">
                        <label className="form-label">Student</label>
                        <select className="form-select" value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} required>
                          <option value="">Select Student</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Company</label>
                        <select className="form-select" value={assignForm.companyId} onChange={(e) => setAssignForm({ ...assignForm, companyId: e.target.value })} required>
                          <option value="">Select Company</option>
                          {companiesAll.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Offer Status</label>
                        <select className="form-select" value={assignForm.offerStatus} onChange={(e) => setAssignForm({ ...assignForm, offerStatus: e.target.value })}>
                          <option value="OFFERED">OFFERED</option>
                          <option value="ACCEPTED">ACCEPTED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Package Amount</label>
                        <input type="number" step="0.01" className="form-control" value={assignForm.packageAmount} onChange={(e) => setAssignForm({ ...assignForm, packageAmount: e.target.value })} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Placement Date</label>
                        <input type="date" className="form-control" value={assignForm.placementDate} onChange={(e) => setAssignForm({ ...assignForm, placementDate: e.target.value })} />
                      </div>
                      <button type="submit" className="btn btn-primary w-100">Assign</button>
                    </form>
                  ) : (
                    <div className="text-muted">You don't have permission to assign placements.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Placements</div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped align-middle">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Student</th>
                          <th>Company</th>
                          <th>Status</th>
                          <th>Package</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {placements.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center text-muted">No placements yet.</td>
                          </tr>
                        )}
                        {placements.map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.student?.name}</td>
                            <td>{p.company?.name}</td>
                            <td>{p.offerStatus}</td>
                            <td>{p.packageAmount ?? '—'}</td>
                            <td>{p.placementDate ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="row">
            <div className="col-md-6">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Reports</div>
                <div className="card-body d-grid gap-2">
                  <button className="btn btn-outline-primary" onClick={() => downloadFile(api.reportPlacementStats(), 'placement-stats.csv')}>Placement Statistics</button>
                  <button className="btn btn-outline-primary" onClick={() => downloadFile(api.reportCompanyWise(), 'company-wise.csv')}>Company-wise Placements</button>
                  <button className="btn btn-outline-primary" onClick={() => downloadFile(api.reportBranchWise(), 'branch-wise.csv')}>Branch-wise Placements</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-insights' && (
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">AI Insights</div>
                <div className="card-body">
                  {insights?.disabled && (
                    <div className="alert alert-info">AI insights are disabled in settings.</div>
                  )}
                  <div className="mb-2">
                    <div className="text-muted small">Top Branch (Avg CGPA)</div>
                    <div className="fw-semibold">
                      {insights?.topBranchByCgpa ? `${insights.topBranchByCgpa[0]} (${Number(insights.topBranchByCgpa[1]).toFixed(2)})` : '—'}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-muted small">Top Company Hiring</div>
                    <div className="fw-semibold">
                      {insights?.topCompanyHiring ? `${insights.topCompanyHiring[0]} (${insights.topCompanyHiring[1]})` : '—'}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-muted small">High Potential Students</div>
                    <div className="fw-semibold">{insights?.highPotentialCount ?? 0}</div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm glass mt-3">
                <div className="card-header fw-semibold">AI Query</div>
                <div className="card-body">
                  <form onSubmit={onAiQuery}>
                    <input className="form-control" placeholder="e.g., List unplaced CSE students" value={aiQueryText}
                           onChange={(e) => setAiQueryText(e.target.value)} />
                    <button className="btn btn-outline-primary w-100 mt-2" type="submit">Ask</button>
                  </form>
                  {aiQueryResult && (
                    <div className="mt-3">
                      <div className="small text-muted">Filters: {JSON.stringify(aiQueryResult.filters)}</div>
                      <ul className="list-group mt-2">
                        {aiQueryResult.results.length === 0 && (
                          <li className="list-group-item text-muted">No results</li>
                        )}
                        {aiQueryResult.results.map((s) => (
                          <li key={s.id} className="list-group-item d-flex justify-content-between">
                            <span>{s.name} ({s.branch})</span>
                            <span>CGPA: {s.cgpa}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Placement Rate by Branch</div>
                <div className="card-body" style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={placementByBranchInsights}>
                      <XAxis dataKey="branch" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="rate" fill="#0d6efd" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Settings</div>
                <div className="card-body">
                  {!settings ? (
                    <div className="text-muted">Loading settings...</div>
                  ) : (
                    <form onSubmit={onUpdateSettings}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Default Minimum CGPA</label>
                          <input type="number" step="0.01" min="0" className="form-control"
                                 value={settings.defaultMinCgpa ?? ''}
                                 onChange={(e) => setSettings({ ...settings, defaultMinCgpa: Number(e.target.value) })} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Allowed Branches (CSV)</label>
                          <input className="form-control" value={settings.allowedBranches || ''}
                                 onChange={(e) => setSettings({ ...settings, allowedBranches: e.target.value })} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Theme</label>
                          <select className="form-select" value={settings.theme || 'DARK'}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSettings({ ...settings, theme: value });
                                    setTheme(value.toLowerCase());
                                  }}>
                            <option value="DARK">Dark</option>
                            <option value="LIGHT">Light</option>
                          </select>
                        </div>
                        <div className="col-12">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" checked={settings.oneStudentOneCompany}
                                   onChange={(e) => setSettings({ ...settings, oneStudentOneCompany: e.target.checked })} />
                            <label className="form-check-label">One student → one company</label>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="fw-semibold mb-2">AI Features</div>
                          <div className="row g-2">
                            <div className="col-md-6">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" checked={settings.aiPredictionEnabled}
                                       onChange={(e) => setSettings({ ...settings, aiPredictionEnabled: e.target.checked })} />
                                <label className="form-check-label">Placement Prediction</label>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" checked={settings.aiRecommendationEnabled}
                                       onChange={(e) => setSettings({ ...settings, aiRecommendationEnabled: e.target.checked })} />
                                <label className="form-check-label">Company Recommendations</label>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" checked={settings.aiResumeEnabled}
                                       onChange={(e) => setSettings({ ...settings, aiResumeEnabled: e.target.checked })} />
                                <label className="form-check-label">Resume Analyzer</label>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" checked={settings.aiQueryEnabled}
                                       onChange={(e) => setSettings({ ...settings, aiQueryEnabled: e.target.checked })} />
                                <label className="form-check-label">Natural Language Query</label>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" checked={settings.aiInsightsEnabled}
                                       onChange={(e) => setSettings({ ...settings, aiInsightsEnabled: e.target.checked })} />
                                <label className="form-check-label">AI Insights</label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {isAdmin ? (
                        <button className="btn btn-primary mt-3" type="submit">Save Settings</button>
                      ) : (
                        <div className="text-muted mt-3">Only admin can update settings.</div>
                      )}
                    </form>
                  )}

                  <div className="mt-4">
                    <div className="fw-semibold">Dataset</div>
                    <div className="text-muted small">Hourly auto-refresh enabled. Use manual refresh if needed.</div>
                    {canEdit && (
                      <button className="btn btn-outline-warning mt-2" onClick={() => api.refreshDataset().then(refreshAll).catch((e) => setError(e.message))}>
                        Refresh Dataset Now
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="fw-semibold">OpenAI</div>
                    <div className="text-muted small">Set OPENAI_API_KEY in backend environment to enable resume analysis.</div>
                    <div className="small">Status: {systemStatus.openaiKeyConfigured ? 'Configured' : 'Missing'}</div>
                    <button className="btn btn-outline-info mt-2" onClick={onTestOpenAi}>Test OpenAI Key</button>
                    {openAiTest && (
                      <div className={`small mt-2 ${openAiTest.ok ? 'text-success' : 'text-danger'}`}>
                        {openAiTest.message}
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="fw-semibold">Account</div>
                    <div className="text-muted small">Logged in as {auth.username} ({auth.role}).</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Quick Links</div>
                <div className="card-body d-grid gap-2">
                  <button className="btn btn-outline-primary" onClick={() => setActiveTab('dashboard')}>Go to Dashboard</button>
                  <button className="btn btn-outline-primary" onClick={() => setActiveTab('students')}>Manage Students</button>
                  <button className="btn btn-outline-primary" onClick={() => setActiveTab('companies')}>Manage Companies</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow-sm glass">
                <div className="card-header fw-semibold">Notifications</div>
                <div className="card-body">
                  <ul className="list-group">
                    {notifications.length === 0 && (
                      <li className="list-group-item text-muted">No notifications</li>
                    )}
                    {notifications.map((n) => (
                      <li key={n.id} className="list-group-item d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{n.title}</div>
                          <div className="small text-muted">{n.message}</div>
                        </div>
                        {!n.readFlag && (
                          <button className="btn btn-sm btn-outline-success" onClick={() => markNotificationRead(n.id)}>Mark Read</button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}



