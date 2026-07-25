import { BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restoreFile, setRestoreFile] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/backups`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBackups(data.backups);
      } else {
        setError(data.error || 'Failed to fetch backups');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!window.confirm('Creating a full backup might take a few moments. Continue?')) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BASE_URL}/admin/backups/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Backup created successfully!');
        fetchBackups();
      } else {
        setError(data.error || 'Failed to create backup');
      }
    } catch (err) {
      setError('Network error during backup creation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('backup', restoreFile);
    
    try {
      const res = await fetch(`${BASE_URL}/admin/backups/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('System restored successfully. It is highly recommended to restart your backend server immediately to apply database changes safely.');
        setRestoreFile(null);
        setShowConfirm(false);
      } else {
        setError(data.error || 'Restore failed');
      }
    } catch (err) {
      setError('Network error during restore');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BASE_URL}/admin/backups/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Backup deleted successfully.');
        fetchBackups();
      } else {
        setError(data.error || 'Failed to delete backup');
      }
    } catch (err) {
      setError('Network error during deletion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (filename) => {
    setError('');
    setSuccess('');
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      setError('Authentication token missing.');
      return;
    }
    // Direct browser download via authenticated URL
    const url = `${BASE_URL}/admin/backups/download/${filename}?token=${token}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    
    setSuccess('Backup download started.');
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Database size={24} color="#4338ca" />
          System Backups
        </h2>
        <button 
          onClick={handleCreateBackup}
          disabled={actionLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#4338ca', color: '#fff', border: 'none', borderRadius: '6px', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 600 }}
        >
          <Download size={18} />
          {actionLoading ? 'Creating...' : 'Create Full Backup'}
        </button>
      </div>

      {error && <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={18} /> {success}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Backup List */}
        <div style={{ flex: '1 1 500px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Available Backups</h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
              <span>Total Backups: {backups.length}</span>
              <span>Total Size: {formatBytes(backups.reduce((acc, curr) => acc + curr.size, 0))}</span>
            </div>
          </div>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
          ) : backups.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No backups found. Create one to get started.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600, fontSize: '13px' }}>Filename</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600, fontSize: '13px' }}>Size</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600, fontSize: '13px' }}>Created</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(b => (
                  <tr key={b.filename} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{b.filename}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{formatBytes(b.size)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{new Date(b.created_at).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDownload(b.filename)}
                        style={{ background: 'none', border: 'none', color: '#4338ca', cursor: 'pointer', marginRight: '12px' }}
                        title="Download Backup"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(b.filename)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Delete Backup"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Restore Section */}
        <div style={{ flex: '1 1 300px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fef2f2' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Restore System
            </h3>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#475569' }}>
              Upload a `.zip` backup file to restore the database and uploads directory. 
              <strong> This will overwrite existing data.</strong>
            </p>
            
            <input 
              type="file" 
              accept=".zip" 
              onChange={e => setRestoreFile(e.target.files[0])}
              style={{ width: '100%', padding: '8px', border: '1px dashed #cbd5e1', borderRadius: '4px', marginBottom: '16px' }}
            />

            {restoreFile && !showConfirm && (
              <button 
                onClick={() => setShowConfirm(true)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Upload size={18} /> Prepare Restore
              </button>
            )}

            {showConfirm && (
              <div style={{ backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#991b1b', fontWeight: 600 }}>Are you absolutely sure? Current data will be replaced.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={handleRestore}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {actionLoading ? 'Restoring...' : 'Yes, Restore'}
                  </button>
                  <button 
                    onClick={() => setShowConfirm(false)}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Backups;
