import { BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const StockAlerts = () => {
  const [lowStockThreshold, setLowStockThreshold] = useState(() => {
    return Number(localStorage.getItem('lowStockThreshold')) || 4;
  });
  const [thresholdInput, setThresholdInput] = useState(lowStockThreshold);
  
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [outOfStockAlerts, setOutOfStockAlerts] = useState([]);
  const [activeAlertTab, setActiveAlertTab] = useState('outOfStock'); // 'outOfStock' | 'lowStock'
  const [selectedProductAlert, setSelectedProductAlert] = useState(null); // { name: '', variants: [] }

  const fetchLowStock = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const products = await res.json();
        let outOfStockMap = new Map();
        let lowStockMap = new Map();
        
        products.forEach(p => {
          let oosVariants = [];
          let lsVariants = [];
          
          if (p.variants && p.variants.length > 0) {
            p.variants.forEach(v => {
              const stock = Number(v.stock_quantity) || 0;
              const threshold = p.low_stock_threshold !== null ? Number(p.low_stock_threshold) : lowStockThreshold;
              const alertItem = {
                color: v.color,
                size: v.size,
                stock: stock,
                outOfStockDate: v.out_of_stock_date
              };
              
              if (stock === 0) {
                oosVariants.push(alertItem);
              } else if (stock > 0 && stock <= threshold) {
                lsVariants.push(alertItem);
              }
            });
          } else {
            // Fallback if no variants
            const stock = Number(p.stock_quantity) || 0;
            const threshold = p.low_stock_threshold !== null ? Number(p.low_stock_threshold) : lowStockThreshold;
            const alertItem = {
              color: 'N/A',
              size: 'N/A',
              stock: stock,
              outOfStockDate: p.updated_at
            };
            if (stock === 0) {
              oosVariants.push(alertItem);
            } else if (stock > 0 && stock <= threshold) {
              lsVariants.push(alertItem);
            }
          }
          
          if (oosVariants.length > 0) {
            outOfStockMap.set(p.name, {
              productName: p.name,
              variants: oosVariants,
              updated_at: p.updated_at || p.created_at
            });
          }
          if (lsVariants.length > 0) {
            lowStockMap.set(p.name, {
              productName: p.name,
              variants: lsVariants,
              updated_at: p.updated_at || p.created_at
            });
          }
        });
        
        const outOfStock = Array.from(outOfStockMap.values());
        const lowStock = Array.from(lowStockMap.values());
        
        // Sort by updated_at DESC
        outOfStock.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        lowStock.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        
        setOutOfStockAlerts(outOfStock);
        setLowStockAlerts(lowStock);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, [lowStockThreshold]);

  const handleUpdateThreshold = () => {
    const val = Number(thresholdInput);
    if (!isNaN(val) && val > 0) {
      setLowStockThreshold(val);
      localStorage.setItem('lowStockThreshold', val);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Stock Alerts</h2>
      
      <div style={{ marginBottom: '24px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => setActiveAlertTab('outOfStock')}
            style={{ flex: 1, padding: '16px', border: 'none', background: activeAlertTab === 'outOfStock' ? '#fef2f2' : '#f8fafc', color: activeAlertTab === 'outOfStock' ? '#ef4444' : '#64748b', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderBottom: activeAlertTab === 'outOfStock' ? '2px solid #ef4444' : '2px solid transparent' }}
          >
            <AlertTriangle size={18} /> Out of Stock ({outOfStockAlerts.length} Products)
          </button>
          <button 
            onClick={() => setActiveAlertTab('lowStock')}
            style={{ flex: 1, padding: '16px', border: 'none', background: activeAlertTab === 'lowStock' ? '#fffbeb' : '#f8fafc', color: activeAlertTab === 'lowStock' ? '#d97706' : '#64748b', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderBottom: activeAlertTab === 'lowStock' ? '2px solid #d97706' : '2px solid transparent', borderLeft: '1px solid #e2e8f0' }}
          >
            <AlertTriangle size={18} /> Low Stock ({lowStockAlerts.length} Products)
          </button>
        </div>

        <div style={{ padding: '16px' }}>
          {activeAlertTab === 'lowStock' && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>Alert me when stock is below or equal to:</span>
              <input 
                type="number" 
                value={thresholdInput} 
                onChange={(e) => setThresholdInput(e.target.value)}
                min="1"
                style={{ width: '60px', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
              <button 
                onClick={handleUpdateThreshold}
                style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Update
              </button>
            </div>
          )}

          {activeAlertTab === 'outOfStock' && (
            outOfStockAlerts.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {outOfStockAlerts.map((item, index) => (
                  <li 
                    key={index} 
                    onClick={() => setSelectedProductAlert({ name: item.productName, variants: item.variants, type: 'Out of Stock' })}
                    style={{ padding: '12px 16px', borderBottom: index < outOfStockAlerts.length - 1 ? '1px solid #fca5a5' : 'none', color: '#b91c1c', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: '6px', marginBottom: '8px', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  >
                    <strong>{item.productName}</strong>
                    <span style={{ fontSize: '0.8rem', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>View Details</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#10b981', textAlign: 'center', margin: '20px 0', fontWeight: 500 }}>All good! No items are completely out of stock.</p>
            )
          )}

          {activeAlertTab === 'lowStock' && (
            lowStockAlerts.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {lowStockAlerts.map((item, index) => (
                  <li 
                    key={index} 
                    onClick={() => setSelectedProductAlert({ name: item.productName, variants: item.variants, type: 'Low / Partial Stock' })}
                    style={{ padding: '12px 16px', borderBottom: index < lowStockAlerts.length - 1 ? '1px solid #fcd34d' : 'none', color: '#b45309', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffbeb', borderRadius: '6px', marginBottom: '8px', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fffbeb'}
                  >
                    <strong>{item.productName}</strong>
                    <span style={{ fontSize: '0.8rem', background: '#d97706', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>View Details</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#10b981', textAlign: 'center', margin: '20px 0', fontWeight: 500 }}>No items are running low on stock right now.</p>
            )
          )}
        </div>
      </div>
      
      {/* ── Modal for Alert Details ── */}
      {selectedProductAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{selectedProductAlert.name}</h3>
              <button onClick={() => setSelectedProductAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>
            
            <p style={{ marginBottom: '16px', color: selectedProductAlert.type === 'Out of Stock' ? '#ef4444' : '#d97706', fontWeight: 600 }}>
              {selectedProductAlert.type} Variants:
            </p>
            
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {selectedProductAlert.variants.map((v, i) => (
                <li key={i} style={{ padding: '12px', background: '#f8fafc', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <strong>Size:</strong> {v.size} <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span> <strong>Color:</strong> {v.color}
                    </span>
                    <span style={{ fontWeight: 600, color: v.stock === 0 ? '#ef4444' : '#d97706' }}>
                      Stock: {v.stock}
                    </span>
                  </div>
                  {v.stock === 0 && v.outOfStockDate && (
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      <strong>Out of stock since:</strong> {new Date(v.outOfStockDate).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedProductAlert(null)}
                style={{ padding: '8px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
