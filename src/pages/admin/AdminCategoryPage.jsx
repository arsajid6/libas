import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, X, Save, Upload, Check } from 'lucide-react';
import { BASE_URL, IMAGE_BASE_URL } from '../../config';

const PREDEFINED_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Grey', hex: '#6b7280' },
  { name: 'Beige', hex: '#f5f5dc' },
  { name: 'Peach', hex: '#ffcba4' },
  { name: 'Mint', hex: '#98ff98' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Brown', hex: '#8b4513' },
  { name: 'Lavender', hex: '#e6e6fa' }
];

const PREDEFINED_SIZES = ['S', 'M', 'L', 'XL'];

const AdminCategoryPage = () => {
  const { pageName } = useParams();
  const [products, setProducts] = useState([]);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [productToDelete, setProductToDelete] = useState(null);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '', base_price: '', sale_price: '', fabric: '', sku: '' });
  const [variants, setVariants] = useState([]);
  const [editDiscountType, setEditDiscountType] = useState('percent');
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openColorDropdown, setOpenColorDropdown] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [pageName]);

  const fetchProducts = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/products?category=${pageName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      base_price: p.base_price,
      sale_price: p.sale_price || '',
      fabric: p.fabric || '',
      sku: p.sku || ''
    });
    setVariants(p.variants || []);
    setImages([]);
    
    let parsedCategories = [pageName];
    try {
      if (p.category && p.category.startsWith('[')) {
        parsedCategories = JSON.parse(p.category);
      } else if (p.category) {
        parsedCategories = [p.category];
      }
    } catch(e){}
    setCategories(parsedCategories);
    setCategoryInput('');
    setLowStockThreshold(p.low_stock_threshold || '');
  };

  const addVariant = () => setVariants([...variants, { size: 'M', color: 'Black', stock: 10 }]);
  
  const updateVariant = (index, field, value) => {
    const newV = [...variants];
    newV[index][field] = value;
    setVariants(newV);
  };
  
  const removeVariant = (index) => setVariants(variants.filter((_, i) => i !== index));

  const handleUpdate = async () => {
    if (!formData.name || !formData.base_price || !formData.description) {
      alert('Please fill in the required fields: Name, Regular Price, and Description.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('base_price', formData.base_price);
      if (formData.sale_price) data.append('sale_price', formData.sale_price);
      if (formData.fabric) data.append('fabric', formData.fabric);
      if (formData.sku) data.append('sku', formData.sku);
      data.append('categories', JSON.stringify(categories));
      if (lowStockThreshold) data.append('low_stock_threshold', lowStockThreshold);
      data.append('variants', JSON.stringify(variants));
      
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (res.ok) {
        setEditingProduct(null);
        fetchProducts();
      } else {
        alert('Failed to update product');
      }
    } catch (e) {
      alert('Error updating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE exactly to confirm.');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        fetchProducts();
        setProductToDelete(null);
        setDeleteConfirmText('');
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h2 className="admin-page-title" style={{ textTransform: 'capitalize' }}>{pageName.replace('-', ' ')} Products</h2>
        <Link to={`/admin/products?category=${pageName}`} className="btn-primary admin-header-btn">
          <Plus size={20} /> Add New Product
        </Link>
      </div>

      <div className="admin-card">
        <div className="admin-product-grid">
          {products.length === 0 ? (
            <p style={{ color: '#64748b' }}>No products found for this category.</p>
          ) : (
            products.map(p => (
              <div key={p.id} className="admin-product-card">
                {p.images?.[0] ? (
                  <img 
                    src={p.images[0].image_url.startsWith('/uploads') ? `${IMAGE_BASE_URL}${p.images[0].image_url}` : p.images[0].image_url} 
                    className="admin-product-image"
                    alt={p.name} 
                  />
                ) : (
                  <div className="admin-product-image-placeholder">No Image</div>
                )}
                
                <h4 className="admin-product-title">{p.name}</h4>
                <p className="admin-product-price">Rs. {Math.round(Number(p.base_price))}</p>
                
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'auto' }}>
                  <button 
                    onClick={() => openEditModal(p)}
                    style={{ flex: 1, padding: '6px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button 
                    onClick={() => { setProductToDelete(p); setDeleteConfirmText(''); }}
                    style={{ flex: 1, padding: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {productToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ marginBottom: '16px', color: '#ef4444' }}>Delete Product</h3>
            <p style={{ marginBottom: '16px' }}>Are you sure you want to delete <strong>{productToDelete.name}</strong>? This cannot be undone.</p>
            <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Type DELETE to confirm:</p>
            <input 
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '24px' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setProductToDelete(null)}
                style={{ padding: '8px 16px', border: 'none', background: '#f1f5f9', color: '#64748b', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteProduct}
                disabled={deleteConfirmText !== 'DELETE'}
                style={{ 
                  padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                  background: deleteConfirmText === 'DELETE' ? '#ef4444' : '#fca5a5',
                  color: 'white'
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
