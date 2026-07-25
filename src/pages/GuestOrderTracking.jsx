import { BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Package, Search, ChevronRight, Truck, Mail } from 'lucide-react';

const GuestOrderTracking = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeTab, setActiveTab] = useState('token'); // 'token' or 'email'
  
  const [token, setToken] = useState('');
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setOrder(null);
    
    try {
      let query = '';
      if (activeTab === 'token') {
        if (!token.trim()) {
          setError('Please enter your Tracking Token');
          setIsLoading(false);
          return;
        }
        query = `?token=${encodeURIComponent(token.trim())}`;
      } else {
        if (!orderId.trim() || !email.trim()) {
          setError('Please enter BOTH your Order ID and Billing Email');
          setIsLoading(false);
          return;
        }
        const queryParams = new URLSearchParams();
        queryParams.append('order_id', orderId.trim().replace(/^#ORD-/, '').replace(/^ORD-/, ''));
        queryParams.append('email', email.trim());
        query = `?${queryParams.toString()}`;
      }
      
      const res = await fetch(`${BASE_URL}/public/track-order${query}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Order not found. Please check your details.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Waiting for Response': return '#f59e0b';
      case 'Pending': return '#eab308';
      case 'Confirmed': return '#3b82f6';
      case 'Processing': return '#8b5cf6';
      case 'Packed': return '#6366f1';
      case 'Shipped': return '#14b8a6';
      case 'In Transit': return '#0ea5e9';
      case 'Delivered': return '#16a34a';
      case 'Payment Failed':
      case 'Cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Package size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '28px', color: '#0f172a', margin: '0 0 8px' }}>Track Your Order</h1>
        <p style={{ color: '#64748b', margin: 0, maxWidth: '500px' }}>Enter your unique Tracking Token, or your Order ID, or Email to see your order's journey.</p>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', width: '100%', maxWidth: '500px', marginBottom: '40px' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <button 
            onClick={() => setActiveTab('token')}
            style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 600, fontSize: '15px', cursor: 'pointer', borderBottom: activeTab === 'token' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'token' ? 'var(--color-primary)' : '#64748b' }}
          >
            Tracking Token
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 600, fontSize: '15px', cursor: 'pointer', borderBottom: activeTab === 'email' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'email' ? 'var(--color-primary)' : '#64748b' }}
          >
            Order ID + Email
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '24px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === 'token' ? (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Tracking Token</label>
              <div style={{ position: 'relative' }}>
                <Package size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. TRK-8F7A29K3" 
                  style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '14px' }}
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Order ID</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>#</span>
                  <input 
                    type="text" 
                    value={orderId} 
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. 1024 or ORD-1024" 
                    style={{ width: '100%', padding: '12px 12px 12px 28px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Billing Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. you@example.com" 
                    style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '14px' }}
                  />
                </div>
              </div>
            </>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
          >
            {isLoading ? 'Searching...' : <><Search size={18} /> Track Order</>}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {order && (
        <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '20px', color: '#0f172a' }}>Order #ORD-{order.id.toString().padStart(4, '0')}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Placed on {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, backgroundColor: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status) }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(order.status) }}></span>
                  {order.status}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '24px' }}>
            
            {order.status === 'Cancelled' ? (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#b91c1c', fontSize: '15px' }}>This order has been cancelled.</p>
              </div>
            ) : (
              <>
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={18} color="var(--color-primary)" /> Shipment Status
                </h4>
                
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  
                  {order.courier_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: '#64748b', fontSize: '14px' }}>Courier</span>
                      <strong style={{ color: '#1e293b', fontSize: '14px' }}>{order.courier_name}</strong>
                    </div>
                  )}
                  
                  {order.tracking_number && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: '#64748b', fontSize: '14px' }}>Tracking Number</span>
                      <strong style={{ color: '#1e293b', fontSize: '14px' }}>{order.tracking_number}</strong>
                    </div>
                  )}
                  
                  {order.last_tracking_update && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: order.tracking_url ? '16px' : '0' }}>
                      <span style={{ color: '#64748b', fontSize: '14px' }}>Last Update</span>
                      <span style={{ color: '#475569', fontSize: '14px' }}>{new Date(order.last_tracking_update).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {order.tracking_url && (
                    <div style={{ marginTop: '16px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
                      <a 
                        href={order.tracking_url.startsWith('http') ? order.tracking_url : `https://${order.tracking_url}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '10px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}
                      >
                        Track on Courier Website <ChevronRight size={16} />
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
            
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GuestOrderTracking;
