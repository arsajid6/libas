import { BASE_URL } from '../../config';
import React, { useState } from 'react';
import { Upload, X, Save, Check } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

const ProductsManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultCategory = searchParams.get('category') || 'home';
  
  const [categories, setCategories] = useState(defaultCategory !== 'all' ? [defaultCategory] : []);
  const [categoryInput, setCategoryInput] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    sale_price: '',
    fabric: '',
    sku: ''
  });
  
  const [variants, setVariants] = useState([{ size: 'M', color: 'Black', stock: 10 }]);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openColorDropdown, setOpenColorDropdown] = useState(null);
  
  const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'flat'
  const [discountValue, setDiscountValue] = useState('');

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      alert('You can only upload up to 3 images (1 Primary & 2 Secondary).');
      return;
    }
    setImages(prev => [...prev, ...files].slice(0, 3));
  };

  const addVariant = () => setVariants([...variants, { size: 'M', color: 'Black', stock: 10 }]);
  
  const updateVariant = (index, field, value) => {
    const newV = [...variants];
    newV[index][field] = value;
    setVariants(newV);
  };
  
  const removeVariant = (index) => setVariants(variants.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!formData.name || !formData.base_price || !formData.description) {
      alert("Please fill in the required fields: Name, Regular Price, and Description.");
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
      
      images.forEach(img => {
        data.append('images', img);
      });

      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (res.ok) {
        alert('Product added successfully!');
        navigate(-1);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save product');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Add New Product</h2>
        <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
      </div>

      <div className="admin-card" style={{ padding: '32px' }}>
        <div style={{ display: 'grid', gap: '24px' }}>
          
          {/* 1. Name & 2. Categories */}
          <div className="pm-grid-2">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>1. Product Name *</label>
              <input type="text" className="admin-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Elegant Silk Suit" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>2. Categories</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '44px', alignItems: 'center' }}>
                {categories.map((c, i) => (
                  <span key={i} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                    {c.replace(/-/g, ' ')} <X size={14} style={{ cursor: 'pointer' }} onClick={() => setCategories(categories.filter((_, idx) => idx !== i))} />
                  </span>
                ))}
                <input 
                  type="text" 
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = categoryInput.trim().toLowerCase().replace(/\s+/g, '-');
                      if (val && !categories.includes(val)) {
                        setCategories([...categories, val]);
                        setCategoryInput('');
                      }
                    }
                  }}
                  placeholder="Type & press Enter"
                  style={{ border: 'none', outline: 'none', flex: 1, minWidth: '120px', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          {/* 3. Price (Regular + Sale) & 10. SKU & Low Stock */}
          <div className="pm-grid-4">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>3a. Regular Price (Rs) *</label>
              <input type="number" className="admin-input" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.base_price} onChange={e => {
                setFormData({...formData, base_price: e.target.value});
              }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontWeight: 600 }}>3b. Sale Price (Rs) <span style={{fontWeight:400, color:'#64748b'}}>(Opt)</span></label>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', outline: 'none' }}
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    setDiscountValue('');
                    setFormData({...formData, sale_price: ''});
                  }}
                >
                  <option value="percent">% Off</option>
                  <option value="flat">Flat Sale</option>
                </select>

                <div style={{ display: 'flex', flex: 1, alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>{discountType === 'percent' ? '%' : 'Rs.'}</span>
                  <input type="number" placeholder={discountType === 'percent' ? 'Percent' : 'Amount'} style={{ width: '100%', padding: '10px 8px', border: 'none', background: 'transparent', outline: 'none' }} value={discountValue} onChange={e => {
                    setDiscountValue(e.target.value);
                    const val = parseFloat(e.target.value);
                    const base = parseFloat(formData.base_price);
                    
                    if (!isNaN(val) && !isNaN(base)) {
                      if (discountType === 'percent') {
                        const calculatedSalePrice = base - (base * val / 100);
                        setFormData({...formData, sale_price: Math.round(calculatedSalePrice)});
                      } else {
                        setFormData({...formData, sale_price: val});
                      }
                    } else if (e.target.value === '') {
                      setFormData({...formData, sale_price: ''});
                    }
                  }} />
                </div>
                
                {discountType === 'percent' && (
                  <input type="number" disabled style={{ width: '100px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#e2e8f0', color: '#475569' }} value={formData.sale_price} placeholder="Final Price" />
                )}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>SKU <span style={{fontWeight:400, color:'#64748b'}}>(Opt)</span></label>
              <input type="text" className="admin-input" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. DL-001" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Low Stock Alert <span style={{fontWeight:400, color:'#64748b'}}>(Opt)</span></label>
              <input type="number" className="admin-input" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} placeholder="Default: 4" min="1" />
            </div>
          </div>

          {/* 5. Description & 8. Fabric */}
          <div className="pm-grid-2">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>5. Description *</label>
              <textarea className="admin-input" rows="4" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detailed product description..."></textarea>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>8. Fabric <span style={{fontWeight:400, color:'#64748b'}}>(Optional)</span></label>
              <input type="text" className="admin-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={formData.fabric} onChange={e => setFormData({...formData, fabric: e.target.value})} placeholder="e.g. Cotton, Silk" />
            </div>
          </div>

          {/* Variants */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontWeight: 600, fontSize: '16px', margin: 0 }}>Product Variants</label>
              <button 
                type="button"
                onClick={() => setVariants([...variants, { size: '', color: '', stock_quantity: 10 }])}
                style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
              >
                + Add Variant
              </button>
            </div>
            
            {variants.map((v, i) => (
              <div key={i} className="pm-grid-size">
                
                {/* 7. Size Selection */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Size</label>
                  <select 
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                    value={v.size}
                    onChange={e => updateVariant(i, 'size', e.target.value)}
                  >
                    <option value="">Select Size...</option>
                    {PREDEFINED_SIZES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Color Selection */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Color</label>
                  <div 
                    onClick={() => setOpenColorDropdown(openColorDropdown === i ? null : i)}
                    style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {v.color ? (
                      <>
                        <span style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: PREDEFINED_COLORS.find(c => c.name === v.color)?.hex || '#ccc', border: '1px solid #cbd5e1' }}></span>
                        <span>{v.color}</span>
                      </>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Select Color...</span>
                    )}
                  </div>
                  
                  {openColorDropdown === i && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                      {PREDEFINED_COLORS.map(c => (
                        <div 
                          key={c.name}
                          onClick={() => { updateVariant(i, 'color', c.name); setOpenColorDropdown(null); }}
                          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: c.hex, border: '1px solid #cbd5e1' }}></span>
                          <span>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 9. Stock Quantity */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Stock Quantity</label>
                  <input type="number" min="0" placeholder="e.g. 10" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={v.stock_quantity !== undefined ? v.stock_quantity : (v.stock || 0)} onChange={e => updateVariant(i, 'stock_quantity', e.target.value)} />
                </div>
                
                {/* Delete Variant Button */}
                <div style={{ paddingBottom: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => { const newV = [...variants]; newV.splice(i, 1); setVariants(newV); }}
                    style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                    title="Remove Variant"
                  >
                    <X size={18} />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* 4. Images */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>4. Images *</label>
            <div className="pm-grid-3">
              {[
                { label: 'Primary Image *', index: 0, required: true },
                { label: 'Secondary Image 1 (Opt)', index: 1, required: false },
                { label: 'Secondary Image 2 (Opt)', index: 2, required: false }
              ].map((box) => {
                const imgFile = images[box.index];
                return (
                  <div key={box.index} style={{ border: imgFile ? (box.index === 0 ? '2px solid #3b82f6' : '1px solid #cbd5e1') : '2px dashed #94a3b8', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f8fafc', position: 'relative', minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => document.getElementById(`img-upload-${box.index}`).click()}>
                    {imgFile ? (
                      <>
                        {box.index === 0 && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', zIndex: 10 }}>PRIMARY</div>}
                        <img src={URL.createObjectURL(imgFile)} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, objectFit: 'contain', backgroundColor: '#f8fafc', borderRadius: '6px' }} alt="" />
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newImgs = [...images]; 
                            newImgs[box.index] = null; 
                            setImages(newImgs); 
                          }}
                          style={{ position: 'absolute', top: '8px', right: '8px', background: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', color: '#ef4444', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload size={24} color="#64748b" style={{ marginBottom: '8px' }} />
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px', fontWeight: 500 }}>{box.label}</p>
                        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '11px' }}>Click to upload</p>
                      </>
                    )}
                    <input type="file" id={`img-upload-${box.index}`} accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                      if(e.target.files && e.target.files[0]) {
                        const newImgs = [...images];
                        newImgs[box.index] = e.target.files[0];
                        setImages(newImgs);
                      }
                    }} />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
            <button onClick={handleSave} disabled={isSubmitting} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 32px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 600 }}>
              <Save size={20} /> {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsManager;
