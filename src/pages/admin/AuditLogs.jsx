import { BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Activity, Search, Calendar } from 'lucide-react';
import './ProductsManager.css'; // Reuse table styles from here for consistency

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, search, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 20
      });
      if (search) queryParams.append('search', search);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await fetch(`${BASE_URL}/admin/logs/audit?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStartDate = (e) => {
    setStartDate(e.target.value);
    setPage(1);
  }

  const handleEndDate = (e) => {
    setEndDate(e.target.value);
    setPage(1);
  }

  return (
    <div className="products-manager">
      <div className="manager-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={28} color="#0284c7" />
          <div>
            <h2 style={{ margin: 0 }}>Audit Logs</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Monitor admin actions, data changes, and system configuration updates</p>
          </div>
        </div>
      </div>

      {error && <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

      <div className="manager-filters" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input 
            type="text" 
            placeholder="Search admin user, action, details..." 
            value={search}
            onChange={handleSearch}
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Calendar size={18} color="#666" />
          <input 
            type="date" 
            value={startDate}
            onChange={handleStartDate}
            style={{ padding: '9px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
          <span style={{ color: '#666' }}>to</span>
          <input 
            type="date" 
            value={endDate}
            onChange={handleEndDate}
            style={{ padding: '9px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner" style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No audit logs found</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                      <td style={{ fontWeight: '500' }}>{log.admin_username}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          backgroundColor: '#f1f5f9',
                          color: '#334155'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: page === 1 ? '#f5f5f5' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
                Page {page} of {totalPages}
              </span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: page === totalPages ? '#f5f5f5' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogs;
