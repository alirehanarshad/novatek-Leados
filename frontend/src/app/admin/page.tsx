'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  RefreshCw, 
  Key, 
  Database, 
  Activity,
  AlertCircle,
  Sparkles,
  Layers,
  Edit3
} from 'lucide-react';
import { api, TeamUser } from '@/lib/api';

export default function AdminPanelPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add user modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Edit / Password Reset modal states
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Status message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats()
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: e.message || 'Failed to fetch admin data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setMessage(null);

    try {
      await api.createAdminUser({
        email: newEmail.trim(),
        password: newPassword,
        full_name: newFullName.trim() || undefined,
        is_superuser: newIsAdmin
      });
      setMessage({ type: 'success', text: `Team user ${newEmail} created successfully!` });
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
      setNewIsAdmin(false);
      setShowAddModal(false);
      fetchAdminData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user' });
    } finally {
      setCreatingUser(false);
    }
  };

  const openEditModal = (u: TeamUser) => {
    setEditingUser(u);
    setEditFullName(u.full_name || '');
    setEditPassword('');
    setEditIsAdmin(u.is_superuser);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    setMessage(null);

    try {
      const payload: any = {
        full_name: editFullName.trim() || undefined,
        is_superuser: editIsAdmin,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      await api.updateAdminUser(editingUser.id, payload);
      setMessage({ type: 'success', text: `Successfully updated user ${editingUser.email}.` });
      setEditingUser(null);
      fetchAdminData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (u: TeamUser) => {
    try {
      await api.updateAdminUser(u.id, { is_active: !u.is_active });
      setMessage({ type: 'success', text: `Updated ${u.email} active status.` });
      fetchAdminData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = async (u: TeamUser) => {
    if (!confirm(`Are you sure you want to delete user ${u.email}?`)) return;
    try {
      await api.deleteAdminUser(u.id);
      setMessage({ type: 'success', text: `Deleted user ${u.email}.` });
      fetchAdminData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCleanupUnreachable = async () => {
    if (!confirm('This will purge all leads without phone and email. Continue?')) return;
    try {
      const res = await api.cleanupUnreachableLeads();
      setMessage({ type: 'success', text: res.message });
      fetchAdminData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            Admin <span className="gradient-text">Control Center</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Team access governance, username & password management, and database operations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ gap: '6px' }}>
            <UserPlus size={15} />
            <span>Add Team Member</span>
          </button>
          <button onClick={fetchAdminData} className="btn btn-secondary" style={{ gap: '6px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13.5px',
          background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#f43f5e'}`,
          color: message.type === 'success' ? '#34d399' : '#fb7185',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Team Users
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            {stats?.total_users || users.length || 0}
          </div>
          <div style={{ fontSize: '11.5px', color: '#818cf8', marginTop: '4px' }}>
            Active workspace seats
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Leads in CRM
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8' }}>
            {stats?.total_leads || 0}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Filtered with SMB ICP v1
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Outbound Campaigns
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>
            {stats?.total_campaigns || 0}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Targeting Groups A, B, C
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pipeline Runs
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>
            {stats?.total_jobs || 0}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Discovery & Enrichment Jobs
          </div>
        </div>
      </div>

      {/* Team User Management Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} color="#818cf8" />
            <h2 style={{ fontSize: '17px', fontWeight: 700 }}>Team Accounts & Access Control</h2>
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {users.length} registered member(s)
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User / Member</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Loading team accounts...</div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          backgroundColor: u.is_superuser ? '#6366f1' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: '#ffffff'
                        }}>
                          {(u.full_name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{u.full_name || 'Team Member'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>
                    <td>
                      {u.is_superuser ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                          color: '#818cf8',
                          border: '1px solid rgba(99, 102, 241, 0.4)'
                        }}>
                          ADMIN
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(148, 163, 184, 0.1)',
                          color: '#94a3b8'
                        }}>
                          MEMBER
                        </span>
                      )}
                    </td>
                    <td>
                      {u.is_active ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399'
                        }}>
                          ACTIVE
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(244, 63, 94, 0.15)',
                          color: '#fb7185'
                        }}>
                          DISABLED
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px', gap: '4px' }}
                          title="Edit User & Set Password"
                        >
                          <Edit3 size={11} />
                          <span>Edit / Password</span>
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 6px', color: '#fb7185' }}
                          title="Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Maintenance Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="#818cf8" />
            <span>Database Hygiene & Contact Audit</span>
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Purge historical leads that have neither email nor phone to keep your CRM 100% reachability compliant.
          </p>
        </div>
        <button
          onClick={handleCleanupUnreachable}
          className="btn btn-secondary"
          style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
        >
          <Trash2 size={15} />
          <span>Purge Unreachable Leads</span>
        </button>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Add Team Member</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Full Name / Username
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Sarah Connor"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Work Email Address *
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="sarah@novatek.io"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Account Password *
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  style={{ accentColor: '#6366f1' }}
                />
                <span>Grant Administrator Privileges</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creatingUser} className="btn btn-primary">
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User & Reset Password Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Edit Member & Reset Password</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  className="input"
                  value={editingUser.email}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Full Name / Username
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Sarah Connor"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Set New Password (leave blank to keep existing)
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter new password to reset..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={6}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editIsAdmin}
                  onChange={(e) => setEditIsAdmin(e.target.checked)}
                  style={{ accentColor: '#6366f1' }}
                />
                <span>Administrator Privileges</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit} className="btn btn-primary">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
