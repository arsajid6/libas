import { BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    recentOrders: []
  });
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Dashboard Overview</h2>
      
      <div className="dashboard-stats-grid">
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(183,110,121,0.1)', borderRadius: '12px', color: 'var(--color-accent)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Total Revenue</p>
            <h3 style={{ fontSize: '1.5rem' }}>Rs. {stats.revenue?.toLocaleString() || 0}</h3>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(40,167,69,0.1)', borderRadius: '12px', color: '#28a745' }}>
            <ShoppingBag size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Total Orders</p>
            <h3 style={{ fontSize: '1.5rem' }}>{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(0,123,255,0.1)', borderRadius: '12px', color: '#007bff' }}>
            <Package size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Active Products</p>
            <h3 style={{ fontSize: '1.5rem' }}>{stats.totalProducts}</h3>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Recent Orders (COD)</h3>
          <button 
            onClick={() => navigate('/admin/orders')} 
            style={{ padding: '6px 16px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
          >
            View All Orders
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders && stats.recentOrders.length > 0 ? (
              stats.recentOrders.map(order => (
                <tr key={order.id}>
                  <td>#ORD-{order.id.toString().padStart(3, '0')}</td>
                  <td>{order.customer_name}</td>
                  <td>Rs. {order.total_amount?.toLocaleString()}</td>
                  <td>
                    <span style={{ 
                      color: order.status === 'Pending' ? '#f0ad4e' : 
                             order.status === 'Shipped' ? '#007bff' : 
                             order.status === 'Delivered' ? '#28a745' : '#dc3545', 
                      fontWeight: 500 
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => navigate('/admin/orders')} 
                      style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No recent orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
