import { BASE_URL } from '../config';
import React, { useState, useEffect, useContext } from 'react';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckCircle, Truck, MapPin, CreditCard, ShoppingBag, Info, UserPlus } from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, cartTotal, setCartItems } = useCart();
  const { user, login } = useContext(AuthContext);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [trackingToken, setTrackingToken] = useState(null);
  const [shippingSettings, setShippingSettings] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Post-purchase account creation state
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [accountCreating, setAccountCreating] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountError, setAccountError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: user ? user.name : '',
    phone: user && user.phone ? user.phone : '',
    email: user ? user.email : '',
    city: '',
    area: '',
    address: '',
    orderNotes: '',
    paymentMethod: 'Cash on Delivery',
    paymentProof: null,
    transactionRef: ''
  });

  useEffect(() => {
    // If user changes (like login midway), update form data
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || (user.phone ? user.phone : '')
      }));
    }
  }, [user]);

  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/public/shipping`).then(res => res.json()),
      fetch(`${BASE_URL}/public/payments/config`).then(res => res.json()),
      fetch(`${BASE_URL}/public/store-settings`).then(res => res.json())
    ])
    .then(([shippingData, paymentData, storeData]) => {
      setShippingSettings(shippingData);
      setPaymentConfig(paymentData);
      setStoreSettings(storeData);
      
      // Auto select first available method if COD is disabled
      if (paymentData?.settings && !paymentData.settings.cod_enabled) {
        if (paymentData.settings.bank_transfer_enabled) {
          setFormData(prev => ({...prev, paymentMethod: 'Bank Transfer'}));
        } else {
          setFormData(prev => ({...prev, paymentMethod: 'Online Payment'}));
        }
      }
      
      setIsLoading(false);
    })
    .catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    });
  };

  const calculateTotals = () => {
    const subtotal = Math.round(cartTotal);
    let shippingCost = 0;
    let codFee = 0;
    let discount = 0; // Future placeholder if coupons exist

    if (shippingSettings) {
      const isFreeShipping = shippingSettings.free_shipping_enabled && subtotal >= shippingSettings.free_shipping_min;
      if (!isFreeShipping) {
        shippingCost = shippingSettings.flat_rate || 0;
      }
      
      if (formData.paymentMethod === 'Cash on Delivery' && shippingSettings.cod_enabled) {
        codFee = shippingSettings.cod_fee || 0;
      }
    }

    const grandTotal = subtotal + shippingCost + codFee - discount;

    return { subtotal, shippingCost, codFee, discount, grandTotal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const totals = calculateTotals();

    const payload = {
      user_id: user ? user.id : '',
      customer_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      area: formData.area,
      address: formData.address,
      payment_method: formData.paymentMethod,
      order_notes: formData.orderNotes,
      total_amount: totals.grandTotal,
      shipping_cost: totals.shippingCost,
      cod_fee: totals.codFee,
      discount: totals.discount,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        selectedSize: item.size,
        selectedColor: item.color,
        quantity: item.quantity,
        price: item.sale_price ? Number(item.sale_price) : Number(item.base_price),
        image: item.image || (item.images && item.images.length > 0 ? item.images[0] : null)
      }))
    };
    
    if (formData.paymentMethod === 'Bank Transfer') {
      if (formData.transactionRef) {
        payload.transaction_reference = formData.transactionRef;
      }
      if (formData.paymentProof) {
        // Compress image using Canvas
        const compressImage = file => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 1200;
              
              if (width > height && width > maxDim) {
                height *= maxDim / width;
                width = maxDim;
              } else if (height > maxDim) {
                width *= maxDim / height;
                height = maxDim;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              // Output as JPEG with 0.8 quality to guarantee small size
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = (e) => reject(e);
          };
          reader.onerror = error => reject(error);
        });
        
        try {
          const base64Str = await compressImage(formData.paymentProof);
          payload.paymentProofBase64 = base64Str;
          payload.paymentProofFileName = formData.paymentProof.name.replace(/\.[^/.]+$/, "") + ".jpg";
        } catch (err) {
          alert("Failed to process the payment proof image.");
          setIsProcessing(false);
          return;
        }
      }
    }

    try {
      const res = await fetch(`${BASE_URL}/public/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrderId(data.orderId);
        if (data.tracking_token) {
          setTrackingToken(data.tracking_token);
        }
        setIsSubmitted(true);
        setCartItems([]);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to place order: ${errorData.error || 'Please try again.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while placing order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAccountError('');
    if (accountPassword !== accountConfirmPassword) {
      setAccountError('Passwords do not match');
      return;
    }
    setAccountCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/user/create-from-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          email: formData.email,
          password: accountPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAccountCreated(true);
        login(data.token, data.user);
      } else {
        setAccountError(data.error || 'Failed to create account');
      }
    } catch (err) {
      setAccountError('Network error');
    }
    setAccountCreating(false);
  };

  if (isSubmitted) {
    return (
      <div className="checkout-success container py-8" style={{ paddingTop: '150px' }}>
        <CheckCircle size={64} color="var(--color-accent)" className="mb-4" />
        <h1>Order Confirmed!</h1>
        <p className="mb-8">Thank you for your purchase. We will contact you shortly to confirm your order.</p>
        
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', maxWidth: '400px', margin: '0 auto 32px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Order Details</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#64748b' }}>Order Number:</span>
            <span style={{ fontWeight: 600 }}>#ORD-{orderId?.toString().padStart(4, '0')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#64748b' }}>Status:</span>
            <span style={{ fontWeight: 600, color: '#eab308' }}>Pending</span>
          </div>
          {shippingSettings?.delivery_time && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Estimated Delivery:</span>
              <span style={{ fontWeight: 600 }}>{shippingSettings.delivery_time}</span>
            </div>
          )}
        </div>

        {trackingToken && (
          <div style={{ backgroundColor: '#fdf4ff', border: '1px solid #fbcfe8', padding: '24px', borderRadius: '8px', maxWidth: '400px', margin: '0 auto 32px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', color: '#831843' }}>Track Your Order</h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#9d174d' }}>Save your Tracking Token for future tracking.</p>
            <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', color: '#be185d', letterSpacing: '1px', marginBottom: '16px', border: '1px dashed #f472b6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{trackingToken}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(trackingToken);
                  alert('Token copied!');
                }}
                style={{ backgroundColor: '#fbcfe8', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#831843', fontWeight: 'bold' }}
              >
                Copy
              </button>
            </div>
            <Link to="/track-order" style={{ display: 'inline-block', backgroundColor: '#db2777', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>
              Track My Order
            </Link>
            {storeSettings?.phone && (
              <a 
                href={`https://api.whatsapp.com/send?phone=${storeSettings.phone.replace(/[^0-9]/g, '').replace(/^0/, '92')}&text=${encodeURIComponent(`Hello! I have placed Order #ORD-${orderId?.toString().padStart(4, '0')}. My tracking token is ${trackingToken}. I am confirming my order.`)}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#25D366', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, marginTop: '12px' }}
              >
                Get your tracking token through WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Post-purchase account creation for guests */}
        {!user && formData.email && !accountCreated && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '32px', borderRadius: '8px', maxWidth: '450px', margin: '0 auto 32px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '50%' }}><UserPlus size={24} color="#16a34a" /></div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#166534' }}>Save your details for next time</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#15803d', marginBottom: '20px' }}>
              Create an account with <strong>{formData.email}</strong> to track this order and speed up future checkouts.
            </p>
            
            {accountError && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{accountError}</div>}
            
            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#166534', marginBottom: '4px', fontWeight: 600 }}>Create a Password</label>
                <input type="password" required value={accountPassword} onChange={e => setAccountPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: '6px', outline: 'none' }} placeholder="••••••••" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#166534', marginBottom: '4px', fontWeight: 600 }}>Confirm Password</label>
                <input type="password" required value={accountConfirmPassword} onChange={e => setAccountConfirmPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #bbf7d0', borderRadius: '6px', outline: 'none' }} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={accountCreating} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
                {accountCreating ? 'Creating...' : 'Create My Account'}
              </button>
            </form>
          </div>
        )}

        {accountCreated && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '8px', maxWidth: '450px', margin: '0 auto 32px', textAlign: 'center', color: '#166534' }}>
            <CheckCircle size={32} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Account Created!</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>You are now logged in. You can track your order in your profile.</p>
          </div>
        )}

        <Link to="/" className="btn-primary">Return to Home</Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty container py-8 text-center" style={{ paddingTop: '150px' }}>
        <h2>Your Cart is Empty</h2>
        <p className="mb-4">Add some elegant pieces to your cart before checking out.</p>
        <Link to="/shop" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container py-8 text-center" style={{ paddingTop: '150px' }}>Loading...</div>;
  }

  const totals = calculateTotals();
  const isFreeShipping = shippingSettings?.free_shipping_enabled && totals.subtotal >= shippingSettings?.free_shipping_min;

  return (
    <div className="checkout-page container py-8" style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '120px' }}>
      
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <ShoppingBag size={28} color="var(--color-primary)" />
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Checkout</h1>
        </div>

        <div className="checkout-grid">
          
          {/* Left Column: Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 1. Customer Information */}
              <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  Customer Information
                </h3>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} style={inputStyle} placeholder="Enter your full name" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label style={labelStyle}>Mobile Number *</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="03XXXXXXXXX" />
                  </div>
                  <div className="form-group">
                    <label style={labelStyle}>Email Address (Optional)</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="you@example.com" />
                  </div>
                </div>
              </div>

              {/* 2. Delivery Address */}
              <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  <MapPin size={20} /> Delivery Address
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={labelStyle}>City *</label>
                    <input type="text" name="city" required value={formData.city} onChange={handleChange} style={inputStyle} placeholder="e.g. Lahore" />
                  </div>
                  <div className="form-group">
                    <label style={labelStyle}>Area / Location *</label>
                    <input type="text" name="area" required value={formData.area} onChange={handleChange} style={inputStyle} placeholder="e.g. DHA Phase 5" />
                  </div>
                </div>
                <div className="form-group">
                  <label style={labelStyle}>Complete Address *</label>
                  <textarea name="address" required value={formData.address} onChange={handleChange} style={{...inputStyle, height: '80px', resize: 'vertical'}} placeholder="House No, Street, Building, etc." />
                </div>
              </div>

              {/* 5. Payment Method & Notes */}
              <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  <CreditCard size={20} /> Payment Method
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {(paymentConfig?.settings?.cod_enabled === 1 || paymentConfig?.settings?.cod_enabled === true || paymentConfig?.settings?.cod_enabled === 'true') && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: formData.paymentMethod === 'Cash on Delivery' ? '2px solid var(--color-primary)' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: formData.paymentMethod === 'Cash on Delivery' ? '#f8fafc' : '#fff' }}>
                      <input type="radio" name="paymentMethod" value="Cash on Delivery" checked={formData.paymentMethod === 'Cash on Delivery'} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>Cash on Delivery</span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Pay with cash upon delivery. {shippingSettings?.cod_fee > 0 && `(Extra COD Fee: Rs. ${shippingSettings.cod_fee})`}</span>
                      </div>
                    </label>
                  )}
                  
                  {(paymentConfig?.settings?.bank_transfer_enabled === 1 || paymentConfig?.settings?.bank_transfer_enabled === true || paymentConfig?.settings?.bank_transfer_enabled === 'true') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: formData.paymentMethod === 'Bank Transfer' ? '2px solid var(--color-primary)' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: formData.paymentMethod === 'Bank Transfer' ? '#f8fafc' : '#fff' }}>
                        <input type="radio" name="paymentMethod" value="Bank Transfer" checked={formData.paymentMethod === 'Bank Transfer'} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>Manual Payment (Bank / Wallet)</span>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Pay via Bank Transfer, JazzCash, Easypaisa, or SadaPay.</span>
                        </div>
                      </label>
                      
                      {formData.paymentMethod === 'Bank Transfer' && (
                        <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginLeft: '30px' }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#334155' }}>Our Bank Details</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            {paymentConfig.settings.bank_name && (
                              <div style={{ padding: '16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                <div style={{ fontSize: '13px', color: '#475569', display: 'grid', gap: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bank / Wallet Name:</span> <strong style={{ textAlign: 'right' }}>{paymentConfig.settings.bank_name}</strong></div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account Title:</span> <strong style={{ textAlign: 'right' }}>{paymentConfig.settings.account_title}</strong></div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account Number:</span> <strong style={{ textAlign: 'right' }}>{paymentConfig.settings.account_number}</strong></div>
                                  {paymentConfig.settings.iban && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IBAN:</span> <strong style={{ textAlign: 'right' }}>{paymentConfig.settings.iban}</strong></div>}
                                  {paymentConfig.settings.branch_name && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch:</span> <strong style={{ textAlign: 'right' }}>{paymentConfig.settings.branch_name}</strong></div>}
                                </div>
                              </div>
                            )}

                            {paymentConfig.settings.bank_accounts && paymentConfig.settings.bank_accounts.length > 0 && (
                              paymentConfig.settings.bank_accounts.map((acc, idx) => (
                                <div key={idx} style={{ padding: '16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '13px', color: '#475569', display: 'grid', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bank / Wallet Name:</span> <strong style={{ textAlign: 'right' }}>{acc.bank_name}</strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account Title:</span> <strong style={{ textAlign: 'right' }}>{acc.account_title}</strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account Number:</span> <strong style={{ textAlign: 'right' }}>{acc.account_number}</strong></div>
                                    {acc.iban && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IBAN:</span> <strong style={{ textAlign: 'right' }}>{acc.iban}</strong></div>}
                                    {acc.branch_name && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch:</span> <strong style={{ textAlign: 'right' }}>{acc.branch_name}</strong></div>}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          
                          <div className="form-group" style={{ margin: '0 0 16px' }}>
                            <label style={{...labelStyle, color: '#334155'}}>Transaction ID / Reference Number *</label>
                            <input type="text" name="transactionRef" value={formData.transactionRef} required onChange={handleChange} style={{...inputStyle, padding: '10px'}} placeholder="e.g. 0123456789" />
                            <small style={{ color: '#64748b', fontSize: '12px', display: 'block', marginTop: '4px' }}>Enter the Transaction ID shown on your receipt.</small>
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{...labelStyle, color: '#334155'}}>Upload Payment Proof *</label>
                            <input type="file" name="paymentProof" accept="image/*" required onChange={handleChange} style={{...inputStyle, padding: '8px'}} />
                            <small style={{ color: '#64748b', fontSize: '12px', display: 'block', marginTop: '4px' }}>Please upload a screenshot of your successful transaction.</small>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: formData.paymentMethod === 'Online Payment' ? '2px solid var(--color-primary)' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: formData.paymentMethod === 'Online Payment' ? '#f8fafc' : '#fff' }}>
                      <input type="radio" name="paymentMethod" value="Online Payment" checked={formData.paymentMethod === 'Online Payment'} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>Online Payment</span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Pay securely via Credit/Debit Card or Wallets.</span>
                      </div>
                    </label>

                    {formData.paymentMethod === 'Online Payment' && !paymentConfig?.onlinePaymentsActive && (
                      <div style={{ padding: '24px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', marginLeft: '30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '12px' }}>🚧</div>
                        <h4 style={{ margin: '0 0 8px', fontSize: '16px', color: '#b45309' }}>Online Payments Coming Soon</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
                          We are currently preparing secure online payment services. Please use <strong>Cash on Delivery</strong> or <strong>Bank Transfer</strong>. Thank you for your patience!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={labelStyle}>Order Notes (Optional)</label>
                  <textarea name="orderNotes" value={formData.orderNotes} onChange={handleChange} style={{...inputStyle, height: '80px', resize: 'vertical'}} placeholder="Notes about your order, e.g. special notes for delivery." />
                </div>
              </div>

            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                Your Order
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                {cartItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={item.image || item.images?.[0] || '/images/placeholder.jpg'} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                      <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#475569', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                        {item.quantity}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{item.name}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                        {item.color && `Color: ${item.color}`}
                        {item.color && item.size && ` | `}
                        {item.size && `Size: ${item.size}`}
                      </p>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
                      Rs. {Math.round(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>Rs. {totals.subtotal}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}>
                  <span>Shipping</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    {isFreeShipping ? <span style={{ color: '#16a34a' }}>Free Shipping</span> : `Rs. ${totals.shippingCost}`}
                  </span>
                </div>

                {totals.codFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}>
                    <span>COD Fee</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>Rs. {totals.codFee}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '4px' }}>
                  <span>Grand Total</span>
                  <span>Rs. {totals.grandTotal}</span>
                </div>
              </div>

              {/* 4. Delivery Information (No Courier Info) */}
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'flex', gap: '12px' }}>
                <Truck size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: '#166534' }}>
                  {shippingSettings?.delivery_time && (
                    <p style={{ margin: '0 0 4px' }}><strong>Estimated Delivery:</strong> {shippingSettings.delivery_time}</p>
                  )}
                  {isFreeShipping && (
                    <p style={{ margin: 0 }}><strong>🎉 You qualify for Free Shipping!</strong></p>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={isProcessing || (formData.paymentMethod === 'Online Payment' && !paymentConfig?.onlinePaymentsActive)}
                className="btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 600, marginTop: '24px', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (formData.paymentMethod === 'Online Payment' && !paymentConfig?.onlinePaymentsActive) ? 0.5 : 1 }}
              >
                {isProcessing ? 'Processing Order...' : (formData.paymentMethod === 'Online Payment' && !paymentConfig?.onlinePaymentsActive) ? 'Select Another Payment Method' : `Place Order (Rs. ${totals.grandTotal})`}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#475569'
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#1e293b',
  outline: 'none',
  transition: 'border-color 0.2s',
  backgroundColor: '#fff',
  fontFamily: 'inherit'
};

export default Checkout;
