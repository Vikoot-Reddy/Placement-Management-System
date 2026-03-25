
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

  const refreshAll = async () => {
    await Promise.all([loadStudents(0), loadCompanies(0), loadPlaced(), loadPlacements(), loadNotifications(), loadAnalytics()]);
  };

  useEffect(() => {
    if (auth.token) {
      refreshAll().catch((e) => setError(e.message));
    }
  }, [auth.token]);

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
        <h3 className="mb-3">Login</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={onLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input className="form-control" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary w-100" type="submit">Login</button>
          <div className="text-muted small mt-3">Default users: admin/admin123, officer/officer123, student/student123</div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Placement System</span>
          <div className="navbar-nav">
            <button className={`nav-link btn btn-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
            <button className={`nav-link btn btn-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>Students</button>
            <button className={`nav-link btn btn-link ${activeTab === 'companies' ? 'active' : ''}`} onClick={() => setActiveTab('companies')}>Companies</button>
            <button className={`nav-link btn btn-link ${activeTab === 'placement' ? 'active' : ''}`} onClick={() => setActiveTab('placement')}>Placement</button>
            <button className={`nav-link btn btn-link ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Reports</button>
            <button className={`nav-link btn btn-link ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Notifications</button>
          </div>
          <div className="text-white ms-auto d-flex gap-3 align-items-center">
            <span className="small">{auth.username} ({auth.role})</span>
            <button className="btn btn-sm btn-outline-light" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted">Total Students</div>
                <div className="fs-3 fw-semibold">{totalStudents}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted">Placed</div>
                <div className="fs-3 fw-semibold text-success">{totalPlaced}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted">Unplaced</div>
                <div className="fs-3 fw-semibold text-warning">{totalUnplaced}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted">Companies</div>
                <div className="fs-3 fw-semibold">{companyTotal}</div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card shadow-sm">
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
              <div className="card shadow-sm">
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
              <div className="card shadow-sm">
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
              <div className="card shadow-sm">
                <div className="card-header fw-semibold">Average CGPA</div>
                <div className="card-body">
                  <div className="display-4">{Number(analytics.averageCgpa || 0).toFixed(2)}</div>
                  <div className="text-muted">Across all students</div>
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

              <div className="card shadow-sm">
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
                          <th>Backlogs</th>
                          <th role="button" onClick={() => toggleStudentSort('placed')}>Placed</th>
                          <th>Company</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length === 0 && (
                          <tr>
                            <td colSpan="9" className="text-center text-muted">No students found.</td>
                          </tr>
                        )}
                        {students.map((s) => (
                          <tr key={s.id}>
                            <td>{s.id}</td>
                            <td>{s.name}</td>
                            <td>{s.email}</td>
                            <td>{s.branch}</td>
                            <td>{s.cgpa}</td>
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
              <div className="card shadow-sm">
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

              <div className="card shadow-sm">
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
              <div className="card shadow-sm">
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
              <div className="card shadow-sm">
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
              <div className="card shadow-sm">
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
              <div className="card shadow-sm">
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

        {activeTab === 'notifications' && (
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow-sm">
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
  );
}
