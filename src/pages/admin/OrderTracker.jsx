import { BASE_URL, IMAGE_BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const OrderTracker = () => {
  const [orders, setOrders] = useState([]);
  const [shippingSettings, setShippingSettings] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [showReceiptUrl, setShowReceiptUrl] = useState(null);
  const [receiptScale, setReceiptScale] = useState(1);
  const [editingTrackingId, setEditingTrackingId] = useState(null);
  const [trackingForm, setTrackingForm] = useState({ courier_name: '', tracking_number: '', tracking_url: '', shipment_status: 'Pending' });

  useEffect(() => {
    fetchOrders();
    fetchShippingSettings();
  }, []);

  const fetchShippingSettings = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/shipping`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setShippingSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      await fetch(`${BASE_URL}/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) return;
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Order deleted successfully.');
        fetchOrders();
      } else {
        alert(data.message || 'Failed to delete order.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while deleting order.');
    }
  };

  const updateSettlement = async (id, payment_status, cod_settlement_status) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      await fetch(`${BASE_URL}/admin/orders/${id}/settlement`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status, cod_settlement_status })
      });
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetryShipment = async (id) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/orders/${id}/retry-shipment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to retry shipment');
      } else {
        alert('Shipment created successfully!');
      }
      fetchOrders();
    } catch (e) {
      console.error(e);
      alert('Error connecting to server.');
    }
  };

  const handleVerifyPayment = async (id, action) => {
    try {
      if (!window.confirm(`Are you sure you want to ${action} this bank transfer?`)) return;
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/orders/${id}/verify-payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to verify payment');
      } else {
        alert(`Payment ${action === 'Approve' ? 'Approved' : 'Rejected'} successfully!`);
      }
      fetchOrders();
    } catch (e) {
      console.error(e);
      alert('Error connecting to server.');
    }
  };

  const handleSaveTracking = async (id) => {
    if (!trackingForm.courier_name || !trackingForm.tracking_number || !trackingForm.tracking_url) {
      alert('Please fill in the Courier Name, Tracking Number, and Tracking URL before saving tracking information.');
      return;
    }

    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/orders/${id}/tracking`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(trackingForm)
      });
      const data = await res.json();
      if (data.success) {
        setEditingTrackingId(null);
        fetchOrders();
      } else {
        alert(data.message || 'Failed to update tracking');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating tracking.');
    }
  };

  const startEditingTracking = (order) => {
    setEditingTrackingId(order.id);
    setTrackingForm({
      courier_name: order.courier_name || '',
      tracking_number: order.tracking_number || '',
      tracking_url: order.tracking_url || ''
    });
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Order Tracker (COD)</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn-${activeTab === 'orders' ? 'primary' : 'secondary'}`} 
            onClick={() => setActiveTab('orders')}
            style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: activeTab === 'orders' ? '#3b82f6' : '#e2e8f0', color: activeTab === 'orders' ? 'white' : '#475569' }}
          >
            Orders
          </button>
          <button 
            className={`btn-${activeTab === 'settlements' ? 'primary' : 'secondary'}`} 
            onClick={() => setActiveTab('settlements')}
            style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: activeTab === 'settlements' ? '#3b82f6' : '#e2e8f0', color: activeTab === 'settlements' ? 'white' : '#475569' }}
          >
            Settlements
          </button>
        </div>
      </div>
      
      {activeTab === 'orders' && (
      <div className="admin-card">
        <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Details</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Action / Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No orders found.</td></tr>
            ) : (
              orders.map(order => (
                <React.Fragment key={order.id}>
                  <tr>
                    <td data-label="Order ID"><strong>#ORD-{order.id.toString().padStart(4, '0')}</strong></td>
                    <td data-label="Customer Details">
                      <div style={{ fontSize: '0.9rem' }}>
                        <p><strong>{order.customer_name}</strong></p>
                        <p style={{ color: 'var(--color-text-light)' }}>{order.phone}</p>
                        <p style={{ color: 'var(--color-text-light)' }}>{order.city}</p>
                      </div>
                    </td>
                    <td data-label="Total Amount">Rs. {Math.round(Number(order.total_amount))}</td>
                    <td data-label="Status">
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: order.status === 'delivered' ? '#dcfce7' : order.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                        color: order.status === 'delivered' ? '#166534' : order.status === 'cancelled' ? '#991b1b' : '#92400e'
                      }}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="action-cell" data-label="Action / Update">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <select 
                          className="admin-input" 
                          style={{ padding: '6px', fontSize: '0.9rem', width: 'auto', marginBottom: 0 }}
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                        >
                          <option value="Waiting for Response">Waiting for Response</option>
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button 
                          onClick={() => toggleExpand(order.id)} 
                          style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          {expandedOrderId === order.id ? 'Hide' : 'View'}
                        </button>
                        <a 
                          href={`https://api.whatsapp.com/send?phone=${order.phone?.replace(/[^0-9]/g, '').replace(/^0/, '92')}&text=${encodeURIComponent(`Thank you for your order #ORD-${order.id.toString().padStart(4, '0')} at Dua Libas!\nYour Tracking Token is: ${order.tracking_token || 'N/A'}.\n\nPlease verify your order:\nReply 1 for YES, confirm my order.\nReply 2 for NO, cancel my order.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '6px 12px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'none' }}
                          title="Send WhatsApp Verification"
                        >
                          Verify on WA
                        </a>
                        <button 
                          onClick={() => deleteOrder(order.id)} 
                          style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                          title="Delete Order"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {expandedOrderId === order.id && (
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td colSpan="5" style={{ padding: '24px' }}>
                        <div className="order-details-grid">
                          
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
                            <h4 style={{ marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Shipping & Billing</h4>
                            <p><strong>Name:</strong> {order.customer_name}</p>
                            <p><strong>Phone:</strong> {order.phone}</p>
                            <p><strong>Email:</strong> {order.email || 'N/A'}</p>
                            <p><strong>Address:</strong> {order.address}, {order.area}, {order.city}</p>
                            <p><strong>Payment Method:</strong> {order.payment_method}</p>
                            {order.payment_method === 'Bank Transfer' && (
                              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Payment Verification Panel</h5>
                                <p style={{ marginBottom: '8px' }}>
                                  <strong>Status:</strong>{' '}
                                  <span style={{ 
                                    color: order.payment_verification_status === 'Approved' ? '#10b981' : 
                                           order.payment_verification_status === 'Rejected' ? '#ef4444' : '#f59e0b',
                                    fontWeight: 600
                                  }}>
                                    {order.payment_verification_status || 'Pending Verification'}
                                  </span>
                                </p>
                                <p style={{ marginBottom: '8px' }}>
                                  <strong>Transaction ID:</strong> <span style={{ fontFamily: 'monospace', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{order.transaction_reference || 'N/A'}</span>
                                </p>
                                
                                {order.payment_verified_by && (
                                  <p style={{ marginBottom: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                                    Verified by {order.payment_verified_by} on {new Date(order.payment_verification_date).toLocaleString()}
                                  </p>
                                )}

                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                  {order.payment_proof_image && (
                                    <button 
                                      onClick={() => { setShowReceiptUrl(order.payment_proof_image); setReceiptScale(1); }}
                                      style={{ padding: '6px 12px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                      View Receipt
                                    </button>
                                  )}
                                  
                                  {(!order.payment_verification_status || order.payment_verification_status === 'Pending Verification') && (
                                    <>
                                      <button 
                                        onClick={() => handleVerifyPayment(order.id, 'Approve')}
                                        style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                      >
                                        Approve
                                      </button>
                                      <button 
                                        onClick={() => handleVerifyPayment(order.id, 'Reject')}
                                        style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                            <p style={{ marginTop: '8px' }}><strong>Order Notes:</strong> {order.order_notes || 'None'}</p>
                            <p style={{ marginTop: '8px' }}><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                            
                            <h4 style={{ marginTop: '16px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              Tracking Information
                              {editingTrackingId !== order.id && order.status !== 'Cancelled' && (
                                <button onClick={() => startEditingTracking(order)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
                                  Edit Manual Tracking
                                </button>
                              )}
                            </h4>
                            <p style={{ marginBottom: '8px' }}>
                              <strong>Tracking Token:</strong> <span style={{ fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}>{order.tracking_token || 'N/A'}</span>
                            </p>
                            <p>
                              <strong>API Sync Status:</strong>{' '}
                              <span style={{ 
                                color: order.api_sync_status === 'Synced' ? '#10b981' : 
                                       order.api_sync_status === 'Failed' ? '#ef4444' : '#f59e0b',
                                fontWeight: 600
                              }}>
                                {order.api_sync_status || 'N/A'}
                              </span>
                            </p>
                            {order.api_sync_error && (
                              <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '8px' }}>
                                <strong>API Error:</strong> {order.api_sync_error}
                              </p>
                            )}
                            {order.api_sync_status === 'Failed' && order.status !== 'Cancelled' && (
                              <button 
                                onClick={() => handleRetryShipment(order.id)}
                                style={{ marginBottom: '12px', padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                Retry API Shipment
                              </button>
                            )}

                            {editingTrackingId === order.id ? (
                              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Courier Name</label>
                                  <input type="text" className="admin-input" style={{ width: '100%', padding: '6px', fontSize: '0.85rem' }} value={trackingForm.courier_name} onChange={e => setTrackingForm({...trackingForm, courier_name: e.target.value})} placeholder="e.g. TCS" />
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Tracking Number</label>
                                  <input type="text" className="admin-input" style={{ width: '100%', padding: '6px', fontSize: '0.85rem' }} value={trackingForm.tracking_number} onChange={e => setTrackingForm({...trackingForm, tracking_number: e.target.value})} placeholder="e.g. 123456789" />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Tracking URL</label>
                                  <input type="text" className="admin-input" style={{ width: '100%', padding: '6px', fontSize: '0.85rem' }} value={trackingForm.tracking_url} onChange={e => setTrackingForm({...trackingForm, tracking_url: e.target.value})} placeholder="https://..." />
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => handleSaveTracking(order.id)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Save</button>
                                  <button onClick={() => setEditingTrackingId(null)} style={{ padding: '6px 12px', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p><strong>Courier Name:</strong> {order.courier_name || 'Not Assigned'}</p>
                                <p><strong>Tracking Number:</strong> {order.tracking_number || 'N/A'}</p>
                                <p><strong>Tracking URL:</strong> {order.tracking_url ? <a href={order.tracking_url.startsWith('http') ? order.tracking_url : `https://${order.tracking_url}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Link</a> : 'N/A'}</p>
                                {order.tracking_url && (
                                  <button 
                                    onClick={() => window.open(order.tracking_url.startsWith('http') ? order.tracking_url : `https://${order.tracking_url}`, '_blank')}
                                    style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                                  >
                                    Open Tracking Page
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
                            <h4 style={{ marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Order Items</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {order.items && order.items.length > 0 ? (
                                order.items.map(item => (
                                  <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                      {item.product_image ? (
                                        <img src={item.product_image} alt={item.product_name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                                      ) : (
                                        <div style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8' }}>No Image</div>
                                      )}
                                      <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{item.product_name}</p>
                                        <div style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                          {item.color && <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Color: <strong style={{ color: '#334155' }}>{item.color}</strong></span>}
                                          {item.size && <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Size: <strong style={{ color: '#334155' }}>{item.size}</strong></span>}
                                          <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Qty: <strong style={{ color: '#334155' }}>{item.quantity}</strong></span>
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                      Rs. {Math.round(item.price_at_purchase * item.quantity)}
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <li>No items found.</li>
                              )}
                            </ul>
                            
                            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>Subtotal:</span>
                                <span>Rs. {Math.round(Number(order.total_amount) - Number(order.shipping_cost || 0) - Number(order.cod_fee || 0))}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>Shipping Cost:</span>
                                <span>Rs. {order.shipping_cost || 0}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>COD Fee:</span>
                                <span>Rs. {order.cod_fee || 0}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                <span>Grand Total:</span>
                                <span>Rs. {Math.round(Number(order.total_amount))}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
            </tbody>
        </table>
        </div>
        </div>
        )}

      {activeTab === 'settlements' && (
        <div className="admin-card">
          <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Courier</th>
                <th>COD Amount</th>
                <th>Payment Status</th>
                <th>Settlement Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="5" className="text-center">No orders found.</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td data-label="Order ID"><strong>#ORD-{order.id.toString().padStart(4, '0')}</strong></td>
                    <td data-label="Courier">{order.courier_name || 'N/A'}</td>
                    <td data-label="COD Amount">Rs. {Math.round(Number(order.total_amount))}</td>
                    <td data-label="Payment Status">
                      <select 
                        className="admin-input" 
                        style={{ padding: '4px', fontSize: '0.85rem', width: 'auto', marginBottom: 0 }}
                        value={order.payment_status || 'Pending'}
                        onChange={(e) => updateSettlement(order.id, e.target.value, order.cod_settlement_status)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Settled">Settled</option>
                        <option value="Dispute">Dispute</option>
                      </select>
                    </td>
                    <td data-label="Settlement Status">
                      <select 
                        className="admin-input" 
                        style={{ padding: '4px', fontSize: '0.85rem', width: 'auto', marginBottom: 0 }}
                        value={order.cod_settlement_status || 'Pending'}
                        onChange={(e) => updateSettlement(order.id, order.payment_status, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Cleared">Cleared</option>
                        <option value="Disputed">Disputed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
            <div style={{ marginTop: '24px' }}>
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '6px' }}>View Settlement Report</button>
          </div>
        </div>
      )}

      {showReceiptUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Payment Receipt</h3>
              <button onClick={() => setShowReceiptUrl(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <img 
                src={showReceiptUrl.startsWith('http') ? showReceiptUrl : `${IMAGE_BASE_URL}${showReceiptUrl}`} 
                alt="Receipt" 
                style={{ transform: `scale(${receiptScale})`, transition: 'transform 0.2s', maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => setReceiptScale(s => Math.min(s + 0.2, 3))}
                style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >Zoom In</button>
              <button 
                onClick={() => setReceiptScale(s => Math.max(s - 0.2, 0.5))}
                style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >Zoom Out</button>
              <a 
                href={showReceiptUrl.startsWith('http') ? showReceiptUrl : `${IMAGE_BASE_URL}${showReceiptUrl}`}
                download="Receipt"
                target="_blank"
                rel="noreferrer"
                style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
              >Open Full Size</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracker;
