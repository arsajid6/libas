      {editingProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            background: '#fff', 
            padding: '24px', 
            borderRadius: '8px', 
            width: '100%', 
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748b" />
              </button>
            </div>

            <div className="pm-grid-2">
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Name *</label>
                <input type="text" className="admin-input" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Product Name" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Base Price (Rs) *</label>
                <input type="number" className="admin-input" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} placeholder="e.g. 2999" />
              </div>
            </div>

            <div className="pm-grid-2" style={{ marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Description *</label>
                <textarea className="admin-input" rows="4" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detailed description..."></textarea>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Fabric</label>
                  <input type="text" className="admin-input" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.fabric} onChange={e => setFormData({...formData, fabric: e.target.value})} placeholder="e.g. Cotton" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Sale Price (Rs)</label>
                  <input type="number" className="admin-input" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: e.target.value})} placeholder="Optional" />
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ fontWeight: 600, fontSize: '16px', margin: 0 }}>Product Variants</label>
                <button 
                  type="button"
                  onClick={addVariant}
                  style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                >
                  + Add Variant
                </button>
              </div>
              
              {variants.map((v, i) => (
                <div key={i} className="pm-grid-size">
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Size</label>
                    <select 
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                      value={v.size}
                      onChange={e => updateVariant(i, 'size', e.target.value)}
                    >
                      <option value="">Select Size...</option>
                      {PREDEFINED_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Color</label>
                    <select 
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                      value={v.color}
                      onChange={e => updateVariant(i, 'color', e.target.value)}
                    >
                      <option value="">Select Color...</option>
                      {PREDEFINED_COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Stock Qty</label>
                    <input 
                      type="number" 
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      value={v.stock_quantity || v.stock}
                      onChange={e => updateVariant(i, v.stock_quantity !== undefined ? 'stock_quantity' : 'stock', parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeVariant(i)}
                    style={{ padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', height: '41px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button 
                onClick={() => setEditingProduct(null)}
                style={{ padding: '12px 24px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isSubmitting}
                style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isSubmitting ? 'Saving...' : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoryPage;
