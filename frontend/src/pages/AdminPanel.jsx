import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'gigs', label: 'Gigs' },
  { id: 'bids', label: 'Bids' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
  { id: 'administrators', label: 'Administrators' },
  { id: 'logs', label: 'Activity Logs' }
];

const ADMIN_TAB_STORAGE_KEY = 'taskvraAdminActiveTab';
const ADMIN_THEME_STORAGE_KEY = 'taskvraAdminTheme';
const validTabIds = new Set(tabs.map((tab) => tab.id));

const getInitialAdminTab = () => {
  if (typeof window === 'undefined') return 'dashboard';
  const savedTab = window.localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
  return validTabIds.has(savedTab) ? savedTab : 'dashboard';
};

const getInitialAdminTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const savedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
  return savedTheme === 'dark' ? 'dark' : 'light';
};

const formatCurrency = (value, currency = 'INR') => {
  if (!Number.isFinite(Number(value))) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(value));
};

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
};

const csvCell = (value) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

function StatCard({ label, value, helper }) {
  const isDarkMode = typeof window !== 'undefined' && window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) === 'dark';
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <p className={`text-xs uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{value}</p>
      <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{helper}</p>
    </div>
  );
}

function LineChart({ title, points, valueKey, colorClass }) {
  const isDarkMode = typeof window !== 'undefined' && window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) === 'dark';
  const maxValue = useMemo(() => {
    if (!Array.isArray(points) || points.length === 0) return 1;
    return Math.max(...points.map((point) => Number(point?.[valueKey] || 0)), 1);
  }, [points, valueKey]);

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h3>
      <div className="mt-4 h-44">
        <div className="flex h-36 items-end gap-3">
          {(points || []).map((point) => {
            const value = Number(point?.[valueKey] || 0);
            const percent = Math.max((value / maxValue) * 100, 4);
            return (
              <div key={`${point.label}-${valueKey}`} className="flex flex-1 flex-col items-center gap-2">
                <div className={`h-28 w-full rounded-lg p-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div
                    className={`w-full rounded-md ${colorClass}`}
                    style={{ height: `${percent}%`, marginTop: `${100 - percent}%` }}
                  />
                </div>
                <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{point.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DataTable({ columns, rows, emptyText = 'No records found.' }) {
  const isDarkMode = typeof window !== 'undefined' && window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) === 'dark';
  if (!rows || rows.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed p-6 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <table className={`min-w-full text-left text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
        <thead className={isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || row._id || rowIndex} className={isDarkMode ? 'border-t border-slate-700 bg-slate-900' : 'border-t border-slate-200 bg-white'}>
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2 align-top text-xs sm:text-sm">
                  {typeof column.render === 'function' ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState(getInitialAdminTab);
  const [adminTheme, setAdminTheme] = useState(getInitialAdminTheme);
  const [loadingTab, setLoadingTab] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState({ rows: [], page: 1, total: 0, search: '', role: '', status: '' });
  const [administrators, setAdministrators] = useState({ rows: [], page: 1, total: 0, search: '' });
  const [projects, setProjects] = useState({ rows: [], page: 1, total: 0, search: '', status: '' });
  const [bids, setBids] = useState({ rows: [], page: 1, total: 0, search: '' });
  const [transactions, setTransactions] = useState({ rows: [], page: 1, total: 0, escrowStatus: '' });
  const [withdrawals, setWithdrawals] = useState({ rows: [], page: 1, total: 0, status: '' });
  const [disputes, setDisputes] = useState({ rows: [], page: 1, total: 0, status: '' });
  const [reviews, setReviews] = useState({ rows: [], page: 1, total: 0, search: '' });
  const [reports, setReports] = useState(null);
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState({ rows: [], page: 1, total: 0 });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', audience: 'all', sendEmail: true });
  const [createAdminForm, setCreateAdminForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [showCreateGigModal, setShowCreateGigModal] = useState(false);
  const [createGigForm, setCreateGigForm] = useState({ clientEmail: '', title: '', description: '', budget: '' });
  const [clientEmailSuggestions, setClientEmailSuggestions] = useState([]);
  const [showClientEmailSuggestions, setShowClientEmailSuggestions] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ _id: '', name: '', email: '', role: 'client', originalRole: 'client' });
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editAdminForm, setEditAdminForm] = useState({ _id: '', name: '', email: '', role: 'admin' });

  const limit = 20;
  const isDarkMode = adminTheme === 'dark';
  const handleToggleTheme = () => {
    setAdminTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, next);
      }
      return next;
    });
  };

  const loadDashboard = async () => {
    const { data } = await api.get('/admin/dashboard');
    setDashboard(data.dashboard);
  };

  const loadUsers = async (custom = {}) => {
    const query = { ...users, ...custom };

    const requestedRole = query.role;
    const apiRole = requestedRole === 'client_only'
      ? 'client'
      : requestedRole === 'freelancer_only'
        ? 'freelancer'
        : requestedRole;

    const { data } = await api.get('/admin/users', {
      params: {
        page: query.page,
        limit,
        search: query.search || undefined,
        role: apiRole || undefined,
        status: query.status || undefined
      }
    });

    let filteredRows = data.users || [];
    // Exclude admin and moderator users from users list
    filteredRows = filteredRows.filter((user) => !['admin', 'moderator'].includes(user.role));
    
    if (requestedRole === 'client_only') {
      filteredRows = filteredRows.filter((user) => user.role === 'client');
    } else if (requestedRole === 'freelancer_only') {
      filteredRows = filteredRows.filter((user) => user.role === 'freelancer');
    }

    setUsers((prev) => ({ ...prev, ...query, rows: filteredRows, total: filteredRows.length }));
  };

  const loadAdmins = async (custom = {}) => {
    const query = { ...administrators, ...custom };

    const { data } = await api.get('/admin/users', {
      params: {
        page: query.page,
        limit,
        search: query.search || undefined,
        role: 'admin'
      }
    });

    const adminRows = (data.users || []).filter((user) => ['admin', 'moderator'].includes(user.role));

    setAdministrators((prev) => ({ ...prev, ...query, rows: adminRows, total: adminRows.length }));
  };

  const loadProjects = async (custom = {}) => {
    const query = { ...projects, ...custom };
    const { data } = await api.get('/admin/projects', {
      params: {
        page: query.page,
        limit,
        search: query.search || undefined,
        status: query.status || undefined
      }
    });
    setProjects((prev) => ({ ...prev, ...query, rows: data.projects || [], total: data.total || 0 }));
  };

  const loadBids = async (custom = {}) => {
    const query = { ...bids, ...custom };
    const { data } = await api.get('/admin/bids', {
      params: {
        page: query.page,
        limit,
        search: query.search || undefined
      }
    });
    setBids((prev) => ({ ...prev, ...query, rows: data.bids || [], total: data.total || 0 }));
  };

  const loadTransactions = async (custom = {}) => {
    const query = { ...transactions, ...custom };
    const txRes = await api.get('/admin/transactions', {
      params: {
        page: query.page,
        limit,
        escrowStatus: query.escrowStatus || undefined
      }
    });
    const wrRes = await api.get('/admin/withdrawals', {
      params: {
        page: withdrawals.page,
        limit,
        status: withdrawals.status || undefined
      }
    });

    setTransactions((prev) => ({ ...prev, ...query, rows: txRes.data.transactions || [], total: txRes.data.total || 0 }));
    setWithdrawals((prev) => ({
      ...prev,
      rows: wrRes.data.withdrawals || [],
      total: wrRes.data.total || 0
    }));
  };

  const loadDisputes = async (custom = {}) => {
    const query = { ...disputes, ...custom };
    const { data } = await api.get('/admin/disputes', {
      params: {
        page: query.page,
        limit,
        status: query.status || undefined
      }
    });
    setDisputes((prev) => ({ ...prev, ...query, rows: data.disputes || [], total: data.total || 0 }));
  };

  const loadReviews = async (custom = {}) => {
    const query = { ...reviews, ...custom };
    const { data } = await api.get('/admin/reviews', {
      params: {
        page: query.page,
        limit,
        search: query.search || undefined
      }
    });
    setReviews((prev) => ({ ...prev, ...query, rows: data.reviews || [], total: data.total || 0 }));
  };

  const loadReports = async () => {
    const { data } = await api.get('/admin/reports');
    setReports(data.reports);
  };

  const loadSettings = async () => {
    const { data } = await api.get('/admin/settings');
    setSettings(data.settings);
  };

  const loadLogs = async (custom = {}) => {
    const query = { ...logs, ...custom };
    const { data } = await api.get('/admin/activity-logs', {
      params: {
        page: query.page,
        limit
      }
    });

    setLogs((prev) => ({ ...prev, ...query, rows: data.logs || [], total: data.total || 0 }));
  };

  const loadTabData = async (tabId) => {
    setLoadingTab(true);
    setError('');
    try {
      if (tabId === 'dashboard') await loadDashboard();
      if (tabId === 'users') await loadUsers();
      if (tabId === 'administrators') await loadAdmins();
      if (tabId === 'gigs') await loadProjects();
      if (tabId === 'bids') await loadBids();
      if (tabId === 'transactions') await loadTransactions();
      if (tabId === 'disputes') await loadDisputes();
      if (tabId === 'reviews') await loadReviews();
      if (tabId === 'reports') await loadReports();
      if (tabId === 'settings') await loadSettings();
      if (tabId === 'logs') await loadLogs();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load admin data');
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADMIN_TAB_STORAGE_KEY, activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, adminTheme);
    }
  }, [adminTheme]);

  useEffect(() => {
    if (!showCreateGigModal) {
      setClientEmailSuggestions([]);
      setShowClientEmailSuggestions(false);
      return;
    }

    const searchTerm = createGigForm.clientEmail.trim();
    if (searchTerm.length < 2) {
      setClientEmailSuggestions([]);
      setShowClientEmailSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/admin/users', {
          params: {
            page: 1,
            limit: 8,
            role: 'client',
            search: searchTerm
          }
        });

        const suggestions = [...new Set((data.users || []).map((user) => user.email).filter(Boolean))];
        setClientEmailSuggestions(suggestions);
        setShowClientEmailSuggestions(suggestions.length > 0);
      } catch {
        setClientEmailSuggestions([]);
        setShowClientEmailSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [createGigForm.clientEmail, showCreateGigModal]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const updateUser = async (id, action, body = {}) => {
    await api.patch(`/admin/users/${id}/${action}`, body);
    await loadUsers();
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Delete user ${user.email}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${user._id}`);
      await loadUsers();
      showToast('User deleted successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleEditUser = (user) => {
    setEditUserForm({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      originalRole: user.role
    });
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = async (event) => {
    event.preventDefault();
    try {
      await api.patch(`/admin/users/${editUserForm._id}`, {
        name: editUserForm.name,
        email: editUserForm.email
      });

      if (editUserForm.role !== editUserForm.originalRole) {
        await api.patch(`/admin/users/${editUserForm._id}/role`, { newRole: editUserForm.role });
      }

      setShowEditUserModal(false);
      setEditUserForm({ _id: '', name: '', email: '', role: 'client', originalRole: 'client' });
      await loadUsers();
      showToast('User updated successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  const handleEditAdmin = (admin) => {
    setEditAdminForm({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
    setShowEditAdminModal(true);
  };

  const handleSaveEditAdmin = async (event) => {
    event.preventDefault();
    try {
      await api.patch(`/admin/users/${editAdminForm._id}`, {
        name: editAdminForm.name,
        email: editAdminForm.email
      });
      setShowEditAdminModal(false);
      setEditAdminForm({ _id: '', name: '', email: '', role: 'admin' });
      await loadAdmins();
      showToast('Administrator updated successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update administrator', 'error');
    }
  };

  const handleDeleteAdmin = async (admin) => {
    const confirmed = window.confirm(`Delete admin ${admin.email}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${admin._id}`);
      await loadAdmins();
      showToast('Administrator deleted successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete administrator', 'error');
    }
  };

  const handleDownloadUsers = () => {
    const rows = users.rows || [];
    const lines = ['Name,Email,Role,Account Status,Banned,Freelancer Approval,Created At'];

    rows.forEach((user) => {
      lines.push([
        csvCell(user.name),
        csvCell(user.email),
        csvCell(user.role),
        csvCell(user.accountStatus || 'active'),
        csvCell(user.isBanned ? 'Yes' : 'No'),
        csvCell(user.freelancerApprovalStatus || '-'),
        csvCell(formatDate(user.createdAt))
      ].join(','));
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.setAttribute('download', `taskvra-users-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadProjects = () => {
    const rows = projects.rows || [];
    const lines = ['Title,Client,Client Email,Budget,Status,Moderation,Created At'];

    rows.forEach((project) => {
      lines.push([
        csvCell(project.title),
        csvCell(project.ownerId?.name || '-'),
        csvCell(project.ownerId?.email || '-'),
        csvCell(project.budget || 0),
        csvCell(project.status || '-'),
        csvCell(project.moderationStatus || '-'),
        csvCell(formatDate(project.createdAt))
      ].join(','));
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.setAttribute('download', `taskvra-projects-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleProjectModeration = async (projectId, moderationStatus) => {
    await api.patch(`/admin/projects/${projectId}`, { moderationStatus });
    await loadProjects();
  };

  const handleEscrow = async (id, status) => {
    await api.patch(`/admin/transactions/${id}/escrow`, { status });
    await loadTransactions();
  };

  const handleWithdrawalStatus = async (id, status) => {
    await api.patch(`/admin/withdrawals/${id}`, { status });
    await loadTransactions();
  };

  const handleDownloadPayments = () => {
    const lines = ['Taskvra Payments Export'];
    lines.push(`Generated At,${csvCell(new Date().toISOString())}`);
    lines.push('');

    lines.push('Escrow Transactions');
    lines.push('Project,Client,Freelancer,Amount,Currency,Paid,Escrow Status,Order ID,Payment ID,Verified At,Created At');
    (transactions.rows || []).forEach((payment) => {
      lines.push([
        csvCell(payment.gig?.title || '-'),
        csvCell(payment.client?.name || '-'),
        csvCell(payment.freelancer?.name || '-'),
        csvCell(payment.amount || 0),
        csvCell(payment.currency || 'INR'),
        csvCell(payment.paid ? 'Yes' : 'No'),
        csvCell(payment.escrowStatus || '-'),
        csvCell(payment.orderId || '-'),
        csvCell(payment.paymentId || '-'),
        csvCell(formatDate(payment.verifiedAt)),
        csvCell(formatDate(payment.createdAt))
      ].join(','));
    });

    lines.push('');
    lines.push('Withdrawal Requests');
    lines.push('Freelancer,Email,Amount,Method,Status,Note,Created At,Processed At');
    (withdrawals.rows || []).forEach((request) => {
      lines.push([
        csvCell(request.freelancerId?.name || '-'),
        csvCell(request.freelancerId?.email || '-'),
        csvCell(request.amount || 0),
        csvCell(request.method || '-'),
        csvCell(request.status || '-'),
        csvCell(request.note || '-'),
        csvCell(formatDate(request.createdAt)),
        csvCell(formatDate(request.processedAt))
      ].join(','));
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.setAttribute('download', `taskvra-payments-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleResolveDispute = async (id, resolutionType) => {
    await api.patch(`/admin/disputes/${id}/resolve`, { status: 'resolved', resolutionType, resolutionNote: `Resolved with ${resolutionType}` });
    await loadDisputes();
  };

  const handleDeleteReview = async (id) => {
    await api.delete(`/admin/reviews/${id}`);
    await loadReviews();
  };

  const handleDeleteProject = async (id) => {
    await api.delete(`/admin/projects/${id}`);
    await loadProjects();
  };

  const handleAnnouncement = async (event) => {
    event.preventDefault();
    await api.post('/admin/announcements', announcementForm);
    setAnnouncementForm({ title: '', message: '', audience: 'all', sendEmail: true });
    setError('Announcement dispatched successfully.');
  };

  const handleSettingsSave = async (event) => {
    event.preventDefault();
    await api.put('/admin/settings', settings);
    await loadSettings();
    setError('Settings updated.');
  };

  const handleSecuritySave = async (event) => {
    event.preventDefault();
    await api.put('/admin/security/password', securityForm);
    setSecurityForm({ currentPassword: '', newPassword: '' });
    setError('Admin password updated.');
  };

  const handleDownloadReports = () => {
    if (!reports) return;

    const lines = [];
    const generatedAt = new Date().toISOString();

    lines.push('Taskvra Report Export');
    lines.push(`Generated At,${csvCell(generatedAt)}`);
    lines.push(`Commission Percent,${csvCell(reports.commissionPercent ?? '')}`);
    lines.push('');

    lines.push('12-Month Earnings');
    lines.push('Month,Transactions,Revenue');
    (reports.earningsSeries || []).forEach((item) => {
      lines.push([
        csvCell(item.label),
        csvCell(item.count ?? 0),
        csvCell(item.total ?? 0)
      ].join(','));
    });
    lines.push('');

    lines.push('12-Month User Growth');
    lines.push('Month,New Users');
    (reports.growthSeries || []).forEach((item) => {
      lines.push([
        csvCell(item.label),
        csvCell(item.count ?? 0)
      ].join(','));
    });
    lines.push('');

    lines.push('Top Freelancers');
    lines.push('Name,Email,Rating,Rating Count,Paid Projects');
    (reports.topFreelancers || []).forEach((item) => {
      lines.push([
        csvCell(item.name),
        csvCell(item.email),
        csvCell(Number(item.ratingAvg || 0).toFixed(2)),
        csvCell(item.ratingCount || 0),
        csvCell(item.paidBids || 0)
      ].join(','));
    });
    lines.push('');

    lines.push('Top Clients');
    lines.push('Name,Email,Projects Posted');
    (reports.topClients || []).forEach((item) => {
      lines.push([
        csvCell(item.name),
        csvCell(item.email),
        csvCell(item.gigsCreated || 0)
      ].join(','));
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.setAttribute('download', `taskvra-reports-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadLogs = () => {
    const rows = logs.rows || [];
    const lines = ['Time,Actor,Action,Entity,Description'];

    rows.forEach((log) => {
      lines.push([
        csvCell(formatDate(log.createdAt)),
        csvCell(`${log.actorId?.name || '-'} (${log.actorRole || '-'})`),
        csvCell(log.action || '-'),
        csvCell(log.entityType || '-'),
        csvCell(log.description || '-')
      ].join(','));
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.setAttribute('download', `taskvra-activity-logs-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCreateAdminUser = async (event) => {
    event.preventDefault();
    try {
      await api.post('/admin/users/admin', createAdminForm);
      setCreateAdminForm({ name: '', email: '', password: '', role: 'admin' });
      setShowCreateAdminModal(false);
      setError('');
      showToast('Admin account created successfully.', 'success');
      await loadAdmins();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create admin account', 'error');
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    try {
      await api.post('/admin/users', createUserForm);
      setCreateUserForm({ name: '', email: '', password: '', role: 'client' });
      setShowCreateUserModal(false);
      setError('');
      showToast('User created successfully!', 'success');
      await loadUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  const handleCreateGig = async (event) => {
    event.preventDefault();
    try {
      await api.post('/admin/gigs', {
        clientEmail: createGigForm.clientEmail,
        title: createGigForm.title,
        description: createGigForm.description,
        budget: Number(createGigForm.budget)
      });
      setCreateGigForm({ clientEmail: '', title: '', description: '', budget: '' });
      setClientEmailSuggestions([]);
      setShowClientEmailSuggestions(false);
      setShowCreateGigModal(false);
      showToast('Gig posted successfully.', 'success');
      await loadProjects();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post gig', 'error');
    }
  };

  const sectionContainer = isDarkMode
    ? 'space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-6 shadow-sm'
    : 'space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm';

  return (
    <div className={`space-y-6 rounded-2xl p-4 sm:p-6 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <header className={`rounded-2xl border p-6 shadow-sm ${isDarkMode ? 'border-slate-700 bg-[linear-gradient(120deg,#0f172a,#1e293b)]' : 'border-blue-100 bg-[linear-gradient(120deg,#f8fbff,#eef5ff)]'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-xs uppercase tracking-[0.22em] ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Taskvra Command Center</p>
            <h1 className={`mt-2 text-3xl font-black sm:text-4xl ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Marketplace Admin Panel</h1>
            <p className={`mt-2 max-w-3xl text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Moderate users, projects, bids, payments, disputes, reviews, and system configuration from one secured workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleTheme}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className={`rounded-2xl border p-3 shadow-sm ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <nav className="grid gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeTab === tab.id
                    ? isDarkMode ? 'bg-blue-900/40 text-blue-200' : 'bg-blue-100 text-blue-700'
                    : isDarkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="space-y-4">
          {toast ? (
            <div className="pointer-events-none fixed inset-x-0 top-4 z-[150] flex justify-center px-4">
              <div className={`w-full max-w-md rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${
                toast.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700'
              }`}>
                {toast.message}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {error}
            </div>
          ) : null}

          {loadingTab ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
              Loading {activeTab}...
            </div>
          ) : null}

          {!loadingTab && activeTab === 'dashboard' ? (
            <div className={sectionContainer}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total Users"
                  value={dashboard?.summary?.totalUsers || 0}
                  helper={`${dashboard?.summary?.totalClients || 0} clients, ${dashboard?.summary?.totalFreelancers || 0} freelancers`}
                />
                <StatCard
                  label="Active Projects"
                  value={dashboard?.summary?.activeProjects || 0}
                  helper={`${dashboard?.summary?.openProjects || 0} open, ${dashboard?.summary?.completedProjects || 0} assigned`}
                />
                <StatCard
                  label="Total Earnings"
                  value={formatCurrency(dashboard?.summary?.totalEarnings || 0)}
                  helper={`Paid bids: ${dashboard?.summary?.paidBids || 0}`}
                />
                <StatCard
                  label="Platform Commission"
                  value={formatCurrency(dashboard?.summary?.totalCommission || 0)}
                  helper={`${dashboard?.summary?.commissionPercent || 0}% global commission`}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <LineChart
                  title="Monthly Revenue"
                  points={dashboard?.charts?.revenue || []}
                  valueKey="total"
                  colorClass="bg-gradient-to-t from-blue-700 to-blue-400"
                />
                <LineChart
                  title="User Growth"
                  points={dashboard?.charts?.growth || []}
                  valueKey="count"
                  colorClass="bg-gradient-to-t from-slate-700 to-slate-400"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className={`mb-2 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Users</h3>
                  <DataTable
                    columns={[
                      { key: 'name', title: 'User', render: (row) => `${row.name} (${row.role})` },
                      { key: 'email', title: 'Email' },
                      { key: 'createdAt', title: 'Created', render: (row) => formatDate(row.createdAt) }
                    ]}
                    rows={dashboard?.recent?.users || []}
                  />
                </div>
                <div>
                  <h3 className={`mb-2 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Payments</h3>
                  <DataTable
                    columns={[
                      { key: 'gigId', title: 'Project', render: (row) => row.gigId?.title || '-' },
                      { key: 'freelancerId', title: 'Freelancer', render: (row) => row.freelancerId?.name || '-' },
                      { key: 'payment', title: 'Amount', render: (row) => formatCurrency(row.payment?.amount || row.price, row.payment?.currency || 'INR') },
                      { key: 'createdAt', title: 'Time', render: (row) => formatDate(row.payment?.verifiedAt || row.createdAt) }
                    ]}
                    rows={dashboard?.recent?.payments || []}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {!loadingTab && activeTab === 'users' ? (
            <div className={sectionContainer}>
              <div className="grid gap-2 sm:grid-cols-6">
                <input
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="Search by name/email"
                  value={users.search}
                  onChange={(event) => setUsers((prev) => ({ ...prev, search: event.target.value }))}
                />
                <select
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  value={users.role}
                  onChange={(event) => setUsers((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="">All roles</option>
                  <option value="client">Clients + Both</option>
                  <option value="freelancer">Freelancers + Both</option>
                  <option value="client_only">Only Client</option>
                  <option value="freelancer_only">Only Freelancer</option>
                  <option value="both">Only Both</option>
                </select>
                <select
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  value={users.status}
                  onChange={(event) => setUsers((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="">All status</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
                <button
                  type="button"
                  onClick={() => loadUsers({ page: 1 })}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleDownloadUsers}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
                >
                  Download Users (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(true)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  + Create User
                </button>
              </div>

              <DataTable
                columns={[
                  { key: 'name', title: 'User', render: (row) => `${row.name} (${row.role})` },
                  { key: 'email', title: 'Email' },
                  { key: 'freelancerApprovalStatus', title: 'Freelancer Approval' },
                  { key: 'accountStatus', title: 'Account' },
                  {
                    key: 'actions',
                    title: 'Actions',
                    render: (row) => (
                      <div className="flex flex-wrap gap-1.5">
                        <button title="Edit user details" className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-sky-700 text-sky-100 hover:bg-sky-600' : 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'}`} onClick={() => handleEditUser(row)}>
                          Edit
                        </button>
                        <button title="Approve as freelancer" className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`} onClick={() => updateUser(row._id, 'approve-freelancer')}>
                          Approve
                        </button>
                        <button title="Reject freelancer application" className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-amber-700 text-amber-100 hover:bg-amber-600' : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'}`} onClick={() => updateUser(row._id, 'reject-freelancer', { reason: 'Insufficient profile details' })}>
                          Reject
                        </button>
                        {row.isBanned ? (
                          <button title="Unban user" className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'}`} onClick={() => updateUser(row._id, 'unban')}>
                            Unban
                          </button>
                        ) : (
                          <button title="Ban user" className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-indigo-700 text-indigo-100 hover:bg-indigo-600' : 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`} onClick={() => updateUser(row._id, 'ban', { reason: 'Policy breach' })}>
                            Ban
                          </button>
                        )}
                        <button title="Delete user permanently" className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'}`} onClick={() => handleDeleteUser(row)}>
                          Delete
                        </button>
                      </div>
                    )
                  }
                ]}
                rows={users.rows}
              />
            </div>
          ) : null}

          {!loadingTab && activeTab === 'gigs' ? (
            <div className={sectionContainer}>
              <div className="grid gap-2 sm:grid-cols-6">
                <input
                  className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  placeholder="Search gigs"
                  value={projects.search}
                  onChange={(event) => setProjects((prev) => ({ ...prev, search: event.target.value }))}
                />
                <select
                  className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  value={projects.status}
                  onChange={(event) => setProjects((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="">All status</option>
                  <option value="open">Open</option>
                  <option value="assigned">In Progress / Assigned</option>
                </select>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  onClick={() => loadProjects({ page: 1 })}
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
                  onClick={handleDownloadProjects}
                >
                  Download Gigs (CSV)
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  onClick={() => setShowCreateGigModal(true)}
                >
                  + Post Gig
                </button>
              </div>

              <DataTable
                columns={[
                  { key: 'title', title: 'Title' },
                  { key: 'ownerId', title: 'Client', render: (row) => row.ownerId?.name || '-' },
                  { key: 'budget', title: 'Budget', render: (row) => formatCurrency(row.budget) },
                  { key: 'status', title: 'Status' },
                  { key: 'moderationStatus', title: 'Moderation' },
                  {
                    key: 'actions',
                    title: 'Actions',
                    render: (row) => (
                      <div className="flex flex-wrap gap-2">
                        <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-blue-600 text-white' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`} onClick={() => handleProjectModeration(row._id, 'approved')}>
                          Approve
                        </button>
                        <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-amber-700 text-amber-100' : 'border border-amber-200 bg-amber-50 text-amber-800'}`} onClick={() => handleProjectModeration(row._id, 'rejected')}>
                          Reject
                        </button>
                        <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-red-600 text-white' : 'border border-rose-200 bg-rose-50 text-rose-700'}`} onClick={() => handleDeleteProject(row._id)}>
                          Delete
                        </button>
                      </div>
                    )
                  }
                ]}
                rows={projects.rows}
              />
            </div>
          ) : null}

          {!loadingTab && activeTab === 'bids' ? (
            <div className={sectionContainer}>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  placeholder="Search bid message"
                  value={bids.search}
                  onChange={(event) => setBids((prev) => ({ ...prev, search: event.target.value }))}
                />
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  onClick={() => loadBids({ page: 1 })}
                >
                  Filter Bids
                </button>
              </div>

              <DataTable
                columns={[
                  { key: 'gigId', title: 'Project', render: (row) => row.gigId?.title || '-' },
                  { key: 'freelancerId', title: 'Freelancer', render: (row) => row.freelancerId?.name || '-' },
                  { key: 'price', title: 'Bid Price', render: (row) => formatCurrency(row.price) },
                  { key: 'status', title: 'Status' },
                  {
                    key: 'spam',
                    title: 'Spam Risk',
                    render: (row) => `${row.spam?.riskScore || 0}% ${row.spam?.reasons?.length ? `(${row.spam.reasons.join(', ')})` : ''}`
                  }
                ]}
                rows={bids.rows}
              />
            </div>
          ) : null}

          {!loadingTab && activeTab === 'transactions' ? (
            <div className={sectionContainer}>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadPayments}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
                >
                  Download Payments (CSV)
                </button>
              </div>

              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Escrow Transactions</h3>
                <DataTable
                  columns={[
                    { key: 'gig', title: 'Project', render: (row) => row.gig?.title || '-' },
                    { key: 'client', title: 'Client', render: (row) => row.client?.name || 'User Not Found' },
                    { key: 'freelancer', title: 'Freelancer', render: (row) => row.freelancer?.name || '-' },
                    { key: 'amount', title: 'Amount', render: (row) => formatCurrency(row.amount, row.currency) },
                    { key: 'paid', title: 'Paid', render: (row) => (row.paid ? 'Yes' : 'No') },
                    { key: 'escrowStatus', title: 'Escrow', render: (row) => row.escrowStatus },
                    {
                      key: 'actions',
                      title: 'Actions',
                      render: (row) => (
                        <div className="flex flex-wrap gap-2">
                          <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-slate-600 text-white' : 'border border-slate-300 bg-slate-100 text-slate-700'}`} onClick={() => handleEscrow(row.id, 'held')}>
                            Hold
                          </button>
                          <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-blue-600 text-white' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`} onClick={() => handleEscrow(row.id, 'released')}>
                            Release
                          </button>
                          <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-amber-700 text-amber-100' : 'border border-amber-200 bg-amber-50 text-amber-800'}`} onClick={() => handleEscrow(row.id, 'refunded')}>
                            Refund
                          </button>
                        </div>
                      )
                    }
                  ]}
                  rows={transactions.rows}
                />
              </div>

              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Withdrawal Requests</h3>
                <DataTable
                  columns={[
                    { key: 'freelancerId', title: 'Freelancer', render: (row) => row.freelancerId?.name || '-' },
                    { key: 'amount', title: 'Amount', render: (row) => formatCurrency(row.amount) },
                    { key: 'method', title: 'Method' },
                    { key: 'status', title: 'Status' },
                    {
                      key: 'actions',
                      title: 'Actions',
                      render: (row) => (
                        <div className="flex flex-wrap gap-2">
                          <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-blue-600 text-white' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`} onClick={() => handleWithdrawalStatus(row._id, 'approved')}>
                            Approve
                          </button>
                          <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-slate-600 text-white' : 'border border-slate-300 bg-slate-100 text-slate-700'}`} onClick={() => handleWithdrawalStatus(row._id, 'paid')}>
                            Mark Paid
                          </button>
                          <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-amber-700 text-amber-100' : 'border border-amber-200 bg-amber-50 text-amber-800'}`} onClick={() => handleWithdrawalStatus(row._id, 'rejected')}>
                            Reject
                          </button>
                        </div>
                      )
                    }
                  ]}
                  rows={withdrawals.rows}
                />
              </div>
            </div>
          ) : null}

          {!loadingTab && activeTab === 'disputes' ? (
            <div className={sectionContainer}>
              <DataTable
                columns={[
                  { key: 'gigId', title: 'Project', render: (row) => row.gigId?.title || '-' },
                  { key: 'raisedBy', title: 'Raised By', render: (row) => row.raisedBy?.name || '-' },
                  { key: 'againstUser', title: 'Against', render: (row) => row.againstUser?.name || '-' },
                  { key: 'reason', title: 'Reason' },
                  { key: 'status', title: 'Status' },
                  {
                    key: 'actions',
                    title: 'Resolve',
                    render: (row) => (
                      <div className="flex flex-wrap gap-2">
                        <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-amber-700 text-amber-100' : 'border border-amber-200 bg-amber-50 text-amber-800'}`} onClick={() => handleResolveDispute(row._id, 'refund')}>
                          Refund
                        </button>
                        <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-blue-600 text-white' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`} onClick={() => handleResolveDispute(row._id, 'release_payment')}>
                          Release Payment
                        </button>
                      </div>
                    )
                  }
                ]}
                rows={disputes.rows}
              />
            </div>
          ) : null}

          {!loadingTab && activeTab === 'reviews' ? (
            <div className={sectionContainer}>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  placeholder="Search review text"
                  value={reviews.search}
                  onChange={(event) => setReviews((prev) => ({ ...prev, search: event.target.value }))}
                />
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  onClick={() => loadReviews({ page: 1 })}
                >
                  Search
                </button>
              </div>

              <DataTable
                columns={[
                  { key: 'freelancerId', title: 'Freelancer', render: (row) => row.freelancerId?.name || '-' },
                  { key: 'clientId', title: 'Client', render: (row) => row.clientId?.name || '-' },
                  { key: 'stars', title: 'Stars' },
                  { key: 'comment', title: 'Comment' },
                  {
                    key: 'action',
                    title: 'Action',
                    render: (row) => (
                      <button className={`rounded px-2 py-1 text-[11px] ${isDarkMode ? 'bg-red-600 text-white' : 'border border-rose-200 bg-rose-50 text-rose-700'}`} onClick={() => handleDeleteReview(row._id)}>
                        Delete
                      </button>
                    )
                  }
                ]}
                rows={reviews.rows}
              />
            </div>
          ) : null}

          {!loadingTab && activeTab === 'notifications' ? (
            <div className={sectionContainer}>
              <form className="space-y-3" onSubmit={handleAnnouncement}>
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  placeholder="Announcement title"
                  value={announcementForm.title}
                  onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
                <textarea
                  className={`min-h-[130px] w-full rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  placeholder="Announcement message"
                  value={announcementForm.message}
                  onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, message: event.target.value }))}
                  required
                />
                <div className="grid gap-2 sm:grid-cols-3">
                  <select
                    className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                    value={announcementForm.audience}
                    onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, audience: event.target.value }))}
                  >
                    <option value="all">All users</option>
                    <option value="clients">Clients</option>
                    <option value="freelancers">Freelancers</option>
                    <option value="admins">Admins</option>
                  </select>
                  <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-700'}`}>
                    <input
                      type="checkbox"
                      checked={announcementForm.sendEmail}
                      onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, sendEmail: event.target.checked }))}
                    />
                    Send Email
                  </label>
                  <button type="submit" className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    Send Announcement
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {!loadingTab && activeTab === 'reports' ? (
            <div className={sectionContainer}>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadReports}
                  disabled={!reports}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
                >
                  Download Report (CSV)
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <LineChart
                  title="12-Month Earnings"
                  points={reports?.earningsSeries || []}
                  valueKey="total"
                  colorClass="bg-gradient-to-t from-blue-700 to-blue-400"
                />
                <LineChart
                  title="12-Month User Growth"
                  points={reports?.growthSeries || []}
                  valueKey="count"
                  colorClass="bg-gradient-to-t from-slate-700 to-slate-400"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <h3 className={`mb-2 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Top Freelancers</h3>
                  <DataTable
                    columns={[
                      { key: 'name', title: 'Name' },
                      { key: 'email', title: 'Email' },
                      { key: 'ratingAvg', title: 'Rating', render: (row) => `${Number(row.ratingAvg || 0).toFixed(2)} (${row.ratingCount || 0})` },
                      { key: 'paidBids', title: 'Paid Projects' }
                    ]}
                    rows={reports?.topFreelancers || []}
                  />
                </div>
                <div>
                  <h3 className={`mb-2 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Top Clients</h3>
                  <DataTable
                    columns={[
                      { key: 'name', title: 'Name' },
                      { key: 'email', title: 'Email' },
                      { key: 'gigsCreated', title: 'Projects Posted' }
                    ]}
                    rows={reports?.topClients || []}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {!loadingTab && activeTab === 'settings' ? (
            <div className={sectionContainer}>
              {!settings ? null : (
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSettingsSave}>
                  <label className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Platform Name
                    <input
                      className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      value={settings.platformName || ''}
                      onChange={(event) => setSettings((prev) => ({ ...prev, platformName: event.target.value }))}
                    />
                  </label>
                  <label className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Logo URL
                    <input
                      className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      value={settings.logoUrl || ''}
                      onChange={(event) => setSettings((prev) => ({ ...prev, logoUrl: event.target.value }))}
                    />
                  </label>
                  <label className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Commission %
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      value={settings.platformCommissionPercent ?? 10}
                      onChange={(event) => setSettings((prev) => ({ ...prev, platformCommissionPercent: Number(event.target.value) }))}
                    />
                  </label>
                  <label className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Min Bid Amount
                    <input
                      type="number"
                      min="1"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      value={settings.minBidAmount ?? 1}
                      onChange={(event) => setSettings((prev) => ({ ...prev, minBidAmount: Number(event.target.value) }))}
                    />
                  </label>
                  <label className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Max Bids / Gig
                    <input
                      type="number"
                      min="1"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      value={settings.maxBidsPerGig ?? 50}
                      onChange={(event) => setSettings((prev) => ({ ...prev, maxBidsPerGig: Number(event.target.value) }))}
                    />
                  </label>
                  <label className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Max Bids / Freelancer / Day
                    <input
                      type="number"
                      min="1"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      value={settings.maxBidsPerFreelancerPerDay ?? 20}
                      onChange={(event) => setSettings((prev) => ({ ...prev, maxBidsPerFreelancerPerDay: Number(event.target.value) }))}
                    />
                  </label>

                  <label className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Currency
                    <input
                      className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      value={settings.currency || 'INR'}
                      onChange={(event) => setSettings((prev) => ({ ...prev, currency: event.target.value }))}
                    />
                  </label>
                  <label className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Support Email
                    <input
                      className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                      value={settings.supportEmail || ''}
                      onChange={(event) => setSettings((prev) => ({ ...prev, supportEmail: event.target.value }))}
                    />
                  </label>
                  <div className="sm:col-span-2 grid gap-2 sm:grid-cols-3">
                    <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-700'}`}>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.paymentGateways?.stripe)}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            paymentGateways: { ...prev.paymentGateways, stripe: event.target.checked }
                          }))
                        }
                      />
                      Stripe
                    </label>
                    <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-700'}`}>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.paymentGateways?.paypal)}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            paymentGateways: { ...prev.paymentGateways, paypal: event.target.checked }
                          }))
                        }
                      />
                      PayPal
                    </label>
                    <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-700'}`}>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.paymentGateways?.razorpay)}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            paymentGateways: { ...prev.paymentGateways, razorpay: event.target.checked }
                          }))
                        }
                      />
                      Razorpay
                    </label>
                  </div>

                  <button type="submit" className={`sm:col-span-2 rounded-lg px-4 py-2 font-semibold transition ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    Save Platform Settings
                  </button>
                </form>
              )}
            </div>
          ) : null}

          {!loadingTab && activeTab === 'administrators' ? (
            <div className={sectionContainer}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Manage all administrators</h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>View and manage all admin and moderator accounts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(true)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  + Add Admin
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="Search by name/email"
                  value={administrators.search}
                  onChange={(event) => setAdministrators((prev) => ({ ...prev, search: event.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => loadAdmins({ page: 1 })}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                >
                  Search
                </button>
              </div>

              <DataTable
                columns={[
                  { key: 'name', title: 'Name', render: (row) => row.name },
                  { key: 'email', title: 'Email' },
                  { key: 'role', title: 'Role', render: (row) => `${row.role.charAt(0).toUpperCase()}${row.role.slice(1)}` },
                  { key: 'accountStatus', title: 'Status', render: (row) => row.accountStatus === 'active' ? 'Active' : 'Inactive' },
                  { key: 'createdAt', title: 'Created At', render: (row) => formatDate(row.createdAt) },
                  {
                    key: 'actions',
                    title: 'Actions',
                    render: (row) => (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          title="Edit administrator details"
                          className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
                          onClick={() => handleEditAdmin(row)}
                        >
                          Edit
                        </button>
                        {row.isBanned ? (
                          <button
                            title="Unban administrator"
                            className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-slate-600 text-white hover:bg-slate-500' : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            onClick={() => updateUser(row._id, 'unban')}
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            title="Ban administrator"
                            className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-amber-700 text-amber-100 hover:bg-amber-600' : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
                            onClick={() => updateUser(row._id, 'ban', { reason: 'Policy breach' })}
                          >
                            Ban
                          </button>
                        )}
                        <button
                          title="Delete administrator"
                          className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${isDarkMode ? 'bg-red-700 text-white hover:bg-red-600' : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                          onClick={() => handleDeleteAdmin(row)}
                        >
                          Delete
                        </button>
                      </div>
                    )
                  }
                ]}
                rows={administrators.rows}
              />
            </div>
          ) : null}

          {!loadingTab && activeTab === 'logs' ? (
            <div className={sectionContainer}>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadLogs}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Download Logs (CSV)
                </button>
              </div>
              <DataTable
                columns={[
                  { key: 'createdAt', title: 'Time', render: (row) => formatDate(row.createdAt) },
                  { key: 'actorId', title: 'Actor', render: (row) => `${row.actorId?.name || '-'} (${row.actorRole})` },
                  { key: 'action', title: 'Action' },
                  { key: 'entityType', title: 'Entity' },
                  { key: 'description', title: 'Description' }
                ]}
                rows={logs.rows}
              />
            </div>
          ) : null}

          {showCreateUserModal ? (
            <div className="pointer-events-none fixed inset-0 z-40" onClick={() => setShowCreateUserModal(false)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>
          ) : null}

          {showCreateGigModal ? (
            <div className="pointer-events-none fixed inset-0 z-40" onClick={() => setShowCreateGigModal(false)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>
          ) : null}

          {showCreateGigModal ? (
            <div className="pointer-events-auto fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700/80 bg-slate-950 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Post Gig As Client</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateGigModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-3" onSubmit={handleCreateGig}>
                <div className="relative">
                  <input
                    type="email"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                    placeholder="Client Email"
                    value={createGigForm.clientEmail}
                    onFocus={() => setShowClientEmailSuggestions(clientEmailSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowClientEmailSuggestions(false), 120)}
                    onChange={(event) => {
                      setCreateGigForm((prev) => ({ ...prev, clientEmail: event.target.value }));
                    }}
                    required
                  />

                  {showClientEmailSuggestions && clientEmailSuggestions.length > 0 ? (
                    <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                      {clientEmailSuggestions.map((email) => (
                        <button
                          key={email}
                          type="button"
                          className="w-full border-b border-slate-800 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setCreateGigForm((prev) => ({ ...prev, clientEmail: email }));
                            setShowClientEmailSuggestions(false);
                          }}
                        >
                          {email}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Gig title"
                  value={createGigForm.title}
                  onChange={(event) => setCreateGigForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Gig description"
                  value={createGigForm.description}
                  onChange={(event) => setCreateGigForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Budget"
                  value={createGigForm.budget}
                  onChange={(event) => setCreateGigForm((prev) => ({ ...prev, budget: event.target.value }))}
                  required
                />

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateGigModal(false)}
                    className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Post Gig
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {showCreateUserModal ? (
            <div className="pointer-events-auto fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700/80 bg-slate-950 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Create New User</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-3" onSubmit={handleCreateUser}>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Full name"
                  value={createUserForm.name}
                  onChange={(event) => setCreateUserForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Email address"
                  value={createUserForm.email}
                  onChange={(event) => setCreateUserForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Password"
                  value={createUserForm.password}
                  onChange={(event) => setCreateUserForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  value={createUserForm.role}
                  onChange={(event) => setCreateUserForm((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="client">Client Only</option>
                  <option value="freelancer">Freelancer Only</option>
                  <option value="both">Both Client & Freelancer</option>
                </select>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {showCreateAdminModal ? (
            <div className="pointer-events-none fixed inset-0 z-40" onClick={() => setShowCreateAdminModal(false)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>
          ) : null}

          {showCreateAdminModal ? (
            <div className="pointer-events-auto fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700/80 bg-slate-950 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add Administrator</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-3" onSubmit={handleCreateAdminUser}>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Full name"
                  value={createAdminForm.name}
                  onChange={(event) => setCreateAdminForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Email address"
                  value={createAdminForm.email}
                  onChange={(event) => setCreateAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Password"
                  value={createAdminForm.password}
                  onChange={(event) => setCreateAdminForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  value={createAdminForm.role}
                  onChange={(event) => setCreateAdminForm((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateAdminModal(false)}
                    className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Add Admin
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {showEditUserModal ? (
            <div className="pointer-events-none fixed inset-0 z-40" onClick={() => setShowEditUserModal(false)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>
          ) : null}

          {showEditUserModal ? (
            <div className="pointer-events-auto fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700/80 bg-slate-950 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Edit User</h3>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-3" onSubmit={handleSaveEditUser}>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Full name"
                  value={editUserForm.name}
                  onChange={(event) => setEditUserForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Email address"
                  value={editUserForm.email}
                  onChange={(event) => setEditUserForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  value={editUserForm.role}
                  onChange={(event) => setEditUserForm((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="client">Client</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="both">Both</option>
                </select>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {showEditAdminModal ? (
            <div className="pointer-events-none fixed inset-0 z-40" onClick={() => setShowEditAdminModal(false)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>
          ) : null}

          {showEditAdminModal ? (
            <div className="pointer-events-auto fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700/80 bg-slate-950 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Edit Administrator</h3>
                <button
                  type="button"
                  onClick={() => setShowEditAdminModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-3" onSubmit={handleSaveEditAdmin}>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Full name"
                  value={editAdminForm.name}
                  onChange={(event) => setEditAdminForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  placeholder="Email address"
                  value={editAdminForm.email}
                  onChange={(event) => setEditAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
                <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400">
                  Role: {editAdminForm.role.charAt(0).toUpperCase() + editAdminForm.role.slice(1)}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditAdminModal(false)}
                    className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default AdminPanel;
