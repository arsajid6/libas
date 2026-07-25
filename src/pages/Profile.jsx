import { BASE_URL } from '../config';
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { User, Package, Heart, MapPin, LogOut, Edit3, Check, X, ShoppingBag, Star, ChevronRight, Plus, Home, Trash2 } from 'lucide-react';
import './Profile.css';

// Premium threshold: 3+ orders = Premium member
const PREMIUM_ORDER_THRESHOLD = 5;

const Profile = () => {
  const { user, token, logout, fetchUserProfile } = useContext(AuthContext);
  const { cartItems } = useCart();
  const { wishlistItems, removeFromWishlist } = useContext(WishlistContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');
  const [isEditing, setIsEditing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line: '',
    city: '',
    province: ''
  });
  const [editingAddressId, setEditingAddressId] = useState(null); // null = add mode, id = edit mode
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (!token) navigate('/');
  }, [token, navigate]);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      // Optional: clear the state so it doesn't persist if they refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    if (user) {
      setEditForm({ full_name: user.full_name || '', phone: user.phone || '' });
    }
  }, [user]);

  // Fetch orders for any tab (needed to calculate premium status too)
  useEffect(() => {
    if (token) {
      fetch(`${BASE_URL}/user/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setOrders(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [token]);

  // Load saved addresses from localStorage (no backend table for now)
  useEffect(() => {
    const saved = localStorage.getItem(`addresses_${user?.id}`);
    if (saved) setAddresses(JSON.parse(saved));
  }, [user]);

  // Premium: customer with 3+ completed orders
  const isPremium = orders.length >= PREMIUM_ORDER_THRESHOLD;
  const membershipLabel = isPremium ? 'Premium Member ⭐' : 'Standard Member';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        await fetchUserProfile();
        setIsEditing(false);
        setSaveMsg('Profile updated successfully!');
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const handleSaveAddress = () => {
    if (!addressForm.full_name || !addressForm.address_line || !addressForm.city) {
      alert('Please fill in required fields: Name, Complete Address, and City.');
      return;
    }
    setIsSavingAddress(true);
    let updated;
    if (editingAddressId !== null) {
      // Edit existing
      updated = addresses.map(a => a.id === editingAddressId ? { ...addressForm, id: editingAddressId } : a);
    } else {
      // Add new
      updated = [...addresses, { ...addressForm, id: Date.now() }];
    }
    setAddresses(updated);
    localStorage.setItem(`addresses_${user?.id}`, JSON.stringify(updated));
    setShowAddressModal(false);
    setEditingAddressId(null);
    setAddressForm({ label: 'Home', full_name: '', phone: '', address_line: '', city: '', province: '' });
    setIsSavingAddress(false);
  };

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || 'Home',
      full_name: addr.full_name || '',
      phone: addr.phone || '',
      address_line: addr.address_line || '',
      city: addr.city || '',
      province: addr.province || ''
    });
    setShowAddressModal(true);
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem(`addresses_${user?.id}`, JSON.stringify(updated));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status) => {
    const colors = { 'waiting for response': '#f59e0b', pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  if (!user) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'address', label: 'Address', icon: MapPin },
  ];

  return (
    <div className="profile-page">
      {/* ── Hero ── */}
      <div className="profile-hero">
        <div className="profile-hero-bg"></div>
        <div className="container profile-hero-content">
          <div className="profile-avatar-ring">
            <div className="profile-avatar">{getInitials(user.full_name)}</div>
          </div>
          <div className="profile-hero-info">
            <h1>{user.full_name || 'Welcome!'}</h1>
            <p>{user.email}</p>
            <span className={`profile-member-badge ${isPremium ? 'premium' : 'standard'}`}>
              {membershipLabel}
            </span>
            {!isPremium && (
              <p className="profile-upgrade-hint">
                Place {PREMIUM_ORDER_THRESHOLD - orders.length} more order{PREMIUM_ORDER_THRESHOLD - orders.length !== 1 ? 's' : ''} to become a Premium Member!
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container profile-body">
        {/* ── Sidebar ── */}
        <aside className="profile-sidebar">
          <nav className="profile-nav">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`profile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  <ChevronRight size={16} className="nav-arrow" />
                </button>
              );
            })}
            <button className="profile-nav-item profile-nav-logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        <main className="profile-main">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>Personal Information</h2>
                {!isEditing ? (
                  <button className="btn-edit" onClick={() => setIsEditing(true)}>
                    <Edit3 size={16} /> Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-cancel" onClick={() => { setIsEditing(false); setEditForm({ full_name: user.full_name || '', phone: user.phone || '' }); }}>
                      <X size={16} /> Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                      <Check size={16} /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              {saveMsg && <div className="profile-success-msg">{saveMsg}</div>}
              <div className="profile-info-grid">
                <div className="profile-info-field">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input className="profile-input" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Enter your full name" />
                  ) : (
                    <p>{user.full_name || <span className="profile-empty">Not set</span>}</p>
                  )}
                </div>
                <div className="profile-info-field">
                  <label>Email Address</label>
                  <p>{user.email} <span className="profile-verified">✓ Verified</span></p>
                </div>
                <div className="profile-info-field">
                  <label>Phone Number</label>
                  {isEditing ? (
                    <input className="profile-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+92 300 0000000" />
                  ) : (
                    <p>{user.phone || <span className="profile-empty">Not set</span>}</p>
                  )}
                </div>
                <div className="profile-info-field">
                  <label>Member Since</label>
                  <p>{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                </div>
              </div>

              {/* Membership Banner */}
              <div className={`membership-banner ${isPremium ? 'premium' : 'standard'}`}>
                <div className="membership-banner-left">
                  <Star size={24} />
                  <div>
                    <strong>{isPremium ? 'Premium Member' : 'Standard Member'}</strong>
                    <span>{isPremium ? 'Thank you for your loyalty! You enjoy exclusive benefits.' : `Place ${PREMIUM_ORDER_THRESHOLD - orders.length} more order${PREMIUM_ORDER_THRESHOLD - orders.length !== 1 ? 's' : ''} to unlock Premium.`}</span>
                  </div>
                </div>
                <span className={`membership-chip ${isPremium ? 'premium' : ''}`}>{isPremium ? '⭐ PREMIUM' : 'STANDARD'}</span>
              </div>

              <div className="profile-stats-row">
                <div className="profile-stat">
                  <ShoppingBag size={22} />
                  <div>
                    <strong>{orders.length}</strong>
                    <span>Total Orders</span>
                  </div>
                </div>
                <div className="profile-stat">
                  <Star size={22} />
                  <div>
                    <strong>{isPremium ? 'Premium' : 'Standard'}</strong>
                    <span>Membership</span>
                  </div>
                </div>
                <div className="profile-stat">
                  <Heart size={22} />
                  <div>
                    <strong>{addresses.length}</strong>
                    <span>Saved Addresses</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === 'orders' && (
            <div className="profile-card">
              <div className="profile-card-header"><h2>My Orders</h2></div>
              {ordersLoading ? (
                <div className="profile-loading-inner"><div className="profile-spinner"></div></div>
              ) : orders.length === 0 ? (
                <div className="profile-empty-state">
                  <Package size={56} strokeWidth={1} />
                  <h3>No orders yet</h3>
                  <p>You haven't placed any orders. Start shopping to see them here!</p>
                  <Link to="/shop" className="btn-primary" style={{ display: 'inline-flex', marginTop: '16px', padding: '12px 28px' }}>Explore Shop</Link>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-card-header">
                        <div>
                          <span className="order-id">Order #{order.id}</span>
                          <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <span className="order-status" style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}>{order.status || 'Pending'}</span>
                      </div>
                      <div className="order-card-body">
                        {order.items?.slice(0, 2).map((item, i) => (
                          <div key={i} className="order-item-row">
                            <span>{item.product_name || 'Product'}</span>
                            <span>Qty: {item.quantity}</span>
                            <span>Rs. {item.price?.toLocaleString()}</span>
                          </div>
                        ))}
                        {order.items?.length > 2 && <p className="order-more">+{order.items.length - 2} more items</p>}
                        {order.tracking_number && (
                          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem' }}>
                            <strong style={{ color: '#334155' }}>Tracking Information:</strong>
                            <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                              Courier: {order.courier_name || 'Assigned'} <br/>
                              Tracking Number: {order.tracking_number}
                            </p>
                            {order.tracking_url && (
                              <a href={order.tracking_url.startsWith('http') ? order.tracking_url : `https://${order.tracking_url}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '8px', color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
                                Track Package →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="order-card-footer"><strong>Total: Rs. {Number(order.total_amount).toLocaleString()}</strong></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── WISHLIST TAB ── */}
          {activeTab === 'wishlist' && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>My Wishlist</h2>
                <span className="profile-badge">{wishlistItems.length} items</span>
              </div>
              {wishlistItems.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px' }}>
                  {wishlistItems.map((item) => (
                    <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                      <Link to={`/product/${item.id}`}>
                        <img src={item.images && item.images.length > 0 ? item.images[0] : '/images/placeholder.jpg'} alt={item.name} style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
                      </Link>
                      <button 
                        onClick={() => removeFromWishlist(item.id)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', borderRadius: '50%', width: '30px', height: '30px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                        title="Remove from Wishlist"
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                      <div style={{ padding: '12px' }}>
                        <Link to={`/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <h3 style={{ fontSize: '15px', margin: '0 0 8px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h3>
                        </Link>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#b76e79', margin: '0 0 8px' }}>
                          Rs. {Math.round(item.sale_price || item.base_price || item.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <Heart size={56} strokeWidth={1} />
                  <h3>Your wishlist is empty</h3>
                  <p>Save items you love by clicking the heart icon on products.</p>
                  <Link to="/shop" className="btn-primary" style={{ display: 'inline-flex', marginTop: '16px', padding: '12px 28px' }}>Browse Products</Link>
                </div>
              )}
            </div>
          )}

          {/* ── ADDRESS TAB ── */}
          {activeTab === 'address' && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>Saved Addresses</h2>
                <button className="btn-edit" onClick={() => { setEditingAddressId(null); setAddressForm({ label: 'Home', full_name: '', phone: '', address_line: '', city: '', province: '' }); setShowAddressModal(true); }}>
                  <Plus size={16} /> Add New
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="profile-empty-state">
                  <MapPin size={56} strokeWidth={1} />
                  <h3>No saved addresses</h3>
                  <p>Add a delivery address to make checkout faster.</p>
                  <button className="btn-primary" style={{ marginTop: '16px', padding: '12px 28px' }} onClick={() => setShowAddressModal(true)}>
                    <Plus size={16} /> Add Address
                  </button>
                </div>
              ) : (
                <div className="address-list">
                  {addresses.map(addr => (
                    <div key={addr.id} className="address-card">
                      <div className="address-card-icon">
                        <Home size={20} />
                      </div>
                      <div className="address-card-body">
                        <div className="address-label-row">
                          <span className="address-label">{addr.label}</span>
                          <strong>{addr.full_name}</strong>
                        </div>
                        <p>{addr.address_line}</p>
                        <p>{addr.city}{addr.province ? `, ${addr.province}` : ''}</p>
                        {addr.phone && <p>{addr.phone}</p>}
                      </div>
                      <div className="address-card-actions">
                        <button className="address-edit-btn" onClick={() => handleEditAddress(addr)} title="Edit address">
                          <Edit3 size={15} />
                        </button>
                        <button className="address-delete-btn" onClick={() => handleDeleteAddress(addr.id)} title="Delete address">
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="address-add-more" onClick={() => setShowAddressModal(true)}>
                    <Plus size={18} /> Add Another Address
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── ADDRESS MODAL ── */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAddressId !== null ? 'Edit Address' : 'Add New Address'}</h3>
              <button className="modal-close" onClick={() => { setShowAddressModal(false); setEditingAddressId(null); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="address-form-grid">
                <div className="address-form-field full-width">
                  <label>Address Type</label>
                  <div className="label-options">
                    {['Home', 'Office', 'Other'].map(lbl => (
                      <button
                        key={lbl}
                        className={`label-option ${addressForm.label === lbl ? 'active' : ''}`}
                        onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      >{lbl}</button>
                    ))}
                  </div>
                </div>
                <div className="address-form-field">
                  <label>Full Name *</label>
                  <input className="profile-input" value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })} placeholder="Recipient name" />
                </div>
                <div className="address-form-field">
                  <label>Phone</label>
                  <input className="profile-input" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="+92 300 0000000" />
                </div>
                <div className="address-form-field full-width">
                  <label>Complete Address *</label>
                  <textarea className="profile-input" rows={3} value={addressForm.address_line} onChange={e => setAddressForm({ ...addressForm, address_line: e.target.value })} placeholder="House No., Street, Area, Landmark" style={{resize: 'vertical', minHeight: '80px'}} />
                </div>
                <div className="address-form-field">
                  <label>City *</label>
                  <input className="profile-input" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="Lahore" />
                </div>
                <div className="address-form-field">
                  <label>Province</label>
                  <select className="profile-input" value={addressForm.province} onChange={e => setAddressForm({ ...addressForm, province: e.target.value })}>
                    <option value="">Select Province</option>
                    <option>Punjab</option>
                    <option>Sindh</option>
                    <option>KPK</option>
                    <option>Balochistan</option>
                    <option>Gilgit Baltistan</option>
                    <option>AJK</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => { setShowAddressModal(false); setEditingAddressId(null); }}>Cancel</button>
              <button className="btn-save" onClick={handleSaveAddress} disabled={isSavingAddress}>
                <Check size={16} /> {isSavingAddress ? 'Saving...' : (editingAddressId !== null ? 'Update Address' : 'Save Address')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
