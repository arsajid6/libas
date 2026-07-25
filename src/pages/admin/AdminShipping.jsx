import { BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Save, Truck, Info, MapPin, Package, CreditCard, Clock, Activity, Link, ShieldAlert, CheckCircle } from 'lucide-react';

const AdminShipping = () => {
  const [settings, setSettings] = useState({
    zone: 'Pakistan',
    status: 'Active',
    flat_rate: 250,
    free_shipping_enabled: true,
    free_shipping_min: 5000,
    cod_enabled: true,
    cod_fee: 0,
    delivery_time: '3 to 5 Working Days',
    default_courier: 'Leopards',
    order_tracking: true,
    api_integration_enabled: false
  });
  const [providers, setProviders] = useState([]);
  const [currentProvider, setCurrentProvider] = useState({
    provider_name: 'Leopards',
    api_key: '',
    secret_key: '',
    account_id: '',
    shipper_id: '',
    base_url: '',
    environment: 'Sandbox',
    status: 'Inactive'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchProviders();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/shipping`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          setSettings({
            ...data,
            free_shipping_enabled: Boolean(data.free_shipping_enabled),
            cod_enabled: Boolean(data.cod_enabled),
            order_tracking: Boolean(data.order_tracking),
            default_courier: data.default_courier || 'Leopards',
            cod_fee: data.cod_fee || 0,
            api_integration_enabled: Boolean(data.api_integration_enabled)
          });
        }
      }
    } catch (err) {
      console.error('Error fetching shipping settings', err);
    }
  };

  const fetchProviders = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/shipping/providers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
        if (data.length > 0) {
          setCurrentProvider(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching shipping providers', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleProviderChange = (e) => {
    const { name, value } = e.target;
    
    // If provider_name changes, try to load its existing credentials if any
    if (name === 'provider_name') {
      const existing = providers.find(p => p.provider_name === value);
      if (existing) {
        setCurrentProvider(existing);
        return;
      } else {
        setCurrentProvider({
          id: null,
          provider_name: value,
          api_key: '',
          secret_key: '',
          account_id: '',
          shipper_id: '',
          base_url: '',
          environment: 'Sandbox',
          status: 'Inactive'
        });
        return;
      }
    }

    setCurrentProvider({
      ...currentProvider,
      [name]: value
    });
  };

  const handleTestConnection = async () => {
    try {
      setTestStatus({ loading: true });
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/shipping/providers/test`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentProvider)
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus({ loading: false, success: true, message: data.message });
      } else {
        setTestStatus({ loading: false, success: false, message: data.message || 'Connection failed' });
      }
    } catch (err) {
      setTestStatus({ loading: false, success: false, message: 'Error testing connection' });
    }
  };

  const handleSaveProvider = async (activate = false) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const payload = { ...currentProvider };
      if (activate) {
        payload.status = 'Active';
      }
      
      const res = await fetch(`${BASE_URL}/admin/shipping/providers`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(activate ? 'Integration Activated Successfully!' : 'Provider Credentials Saved!');
        fetchProviders();
      } else {
        alert('Failed to save provider credentials');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving provider');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/shipping`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Shipping settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving shipping settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Truck size={28} color="#3b82f6" />
          <h2 style={{ margin: 0 }}>Shipping Settings</h2>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '15px' }}
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SHIPPING MODE INDICATOR */}
        <div style={{ 
          padding: '16px 24px', 
          borderRadius: '8px', 
          backgroundColor: settings.api_integration_enabled && currentProvider.status === 'Active' ? '#f0fdf4' : '#f8fafc',
          border: `1px solid ${settings.api_integration_enabled && currentProvider.status === 'Active' ? '#bbf7d0' : '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {settings.api_integration_enabled && currentProvider.status === 'Active' ? (
            <>
              <CheckCircle size={24} color="#16a34a" />
              <div>
                <h3 style={{ margin: 0, color: '#166534', fontSize: '16px' }}>API Shipping Active ({currentProvider.provider_name})</h3>
                <p style={{ margin: '4px 0 0', color: '#15803d', fontSize: '14px' }}>Orders are being automatically synced with {currentProvider.provider_name}.</p>
              </div>
            </>
          ) : (
            <>
              <Package size={24} color="#64748b" />
              <div>
                <h3 style={{ margin: 0, color: '#334155', fontSize: '16px' }}>Manual Shipping Active</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>API is either off or not configured. You must manually manage shipments.</p>
              </div>
            </>
          )}
        </div>

        {/* 1. Shipping Zone */}
        <div className="admin-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <MapPin size={20} color="#64748b" />
            <h3 style={cardTitleStyle}>1. Shipping Zone</h3>
          </div>
          <div style={cardBodyStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Zone Name</label>
                <input type="text" name="zone" value={settings.zone} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select name="status" value={settings.status} onChange={handleChange} style={inputStyle}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2 & 3. Shipping Methods & Free Shipping */}
        <div className="admin-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Package size={20} color="#64748b" />
            <h3 style={cardTitleStyle}>2. Shipping Methods & Free Shipping</h3>
          </div>
          <div style={cardBodyStyle}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Flat Rate Shipping Cost (PKR)</label>
              <div style={{ position: 'relative', maxWidth: '300px' }}>
                <span style={currencyPrefixStyle}>Rs.</span>
                <input type="number" name="flat_rate" value={settings.flat_rate} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '36px' }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: settings.free_shipping_enabled ? '16px' : '0' }}>
                <input type="checkbox" name="free_shipping_enabled" checked={settings.free_shipping_enabled} onChange={handleChange} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontWeight: 600, color: '#334155' }}>Enable Free Shipping</span>
              </label>
              
              {settings.free_shipping_enabled && (
                <div style={{ paddingLeft: '24px' }}>
                  <label style={{...labelStyle, marginBottom: '6px'}}>Threshold Amount (PKR)</label>
                  <div style={{ position: 'relative', maxWidth: '300px' }}>
                    <span style={currencyPrefixStyle}>Rs.</span>
                    <input type="number" name="free_shipping_min" value={settings.free_shipping_min} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '36px' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 & 7. Payment Options & COD */}
        <div className="admin-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <CreditCard size={20} color="#64748b" />
            <h3 style={cardTitleStyle}>Payment Options (COD)</h3>
          </div>
          <div style={cardBodyStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
              <input type="checkbox" name="cod_enabled" checked={settings.cod_enabled} onChange={handleChange} style={{ width: '16px', height: '16px' }} />
              <span style={{ fontWeight: 500, color: '#334155' }}>Enable Cash on Delivery (COD)</span>
            </label>

            {settings.cod_enabled && (
              <div>
                <label style={labelStyle}>Additional COD Fee (PKR)</label>
                <div style={{ position: 'relative', maxWidth: '300px' }}>
                  <span style={currencyPrefixStyle}>Rs.</span>
                  <input type="number" name="cod_fee" value={settings.cod_fee} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '36px' }} />
                </div>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>This fee will be added to the customer's total if they choose COD.</p>
              </div>
            )}
          </div>
        </div>

        {/* 5 & 6. Delivery & Courier Settings */}
        <div className="admin-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Clock size={20} color="#64748b" />
            <h3 style={cardTitleStyle}>Delivery & Courier Settings</h3>
          </div>
          <div style={cardBodyStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Estimated Delivery Time</label>
                <input type="text" name="delivery_time" value={settings.delivery_time} onChange={handleChange} placeholder="e.g. 3-5 Working Days" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Default Courier</label>
                <select name="default_courier" value={settings.default_courier} onChange={handleChange} style={inputStyle}>
                  <option value="Leopards">Leopards</option>
                  <option value="TCS">TCS</option>
                  <option value="M&P">M&P</option>
                  <option value="Trax">Trax</option>
                  <option value="Call Courier">Call Courier</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Order Tracking */}
        <div className="admin-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Activity size={20} color="#64748b" />
            <h3 style={cardTitleStyle}>Order Tracking</h3>
          </div>
          <div style={cardBodyStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
              <input type="checkbox" name="order_tracking" checked={settings.order_tracking} onChange={handleChange} style={{ width: '16px', height: '16px' }} />
              <span style={{ fontWeight: 500, color: '#334155' }}>Enable Order Tracking</span>
            </label>

            {settings.order_tracking && (
              <div style={{ backgroundColor: '#e0f2fe', padding: '16px', borderRadius: '6px', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '14px', display: 'flex', gap: '8px' }}>
                <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Order Tracking is Enabled.</strong><br/>
                  When viewing an individual order, you will now see fields to enter the <b>Courier Name</b>, <b>Tracking Number</b>, and <b>Tracking URL</b>. These can be shared with the customer.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 9. Courier Integrations */}
        <div className="admin-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Link size={20} color="#64748b" />
            <h3 style={cardTitleStyle}>Courier Integrations</h3>
          </div>
          <div style={cardBodyStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
              <input type="checkbox" name="api_integration_enabled" checked={settings.api_integration_enabled} onChange={handleChange} style={{ width: '16px', height: '16px' }} />
              <span style={{ fontWeight: 500, color: '#334155' }}>Enable Courier API Integration</span>
            </label>

            {!settings.api_integration_enabled ? (
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                API integration is currently off. Manual shipping mode is active.
              </p>
            ) : (
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                
                {currentProvider.status !== 'Active' && (
                  <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', color: '#b45309', marginBottom: '20px', fontSize: '14px' }}>
                    <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Courier API not configured.</strong><br/>
                      Manual shipping mode is active until you test and activate a valid API integration.
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>Provider Name</label>
                    <select name="provider_name" value={currentProvider.provider_name} onChange={handleProviderChange} style={inputStyle}>
                      <option value="Leopards">Leopards</option>
                      <option value="TCS">TCS</option>
                      <option value="M&P">M&P</option>
                      <option value="Trax">Trax</option>
                      <option value="Call Courier">Call Courier</option>
                      <option value="BlueEx">BlueEx</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Environment</label>
                    <select name="environment" value={currentProvider.environment} onChange={handleProviderChange} style={inputStyle}>
                      <option value="Sandbox">Sandbox (Testing)</option>
                      <option value="Production">Production (Live)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>API Key</label>
                    <input type="password" name="api_key" value={currentProvider.api_key} onChange={handleProviderChange} placeholder="Enter API Key" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Secret Key / Password</label>
                    <input type="password" name="secret_key" value={currentProvider.secret_key} onChange={handleProviderChange} placeholder="Enter Secret Key" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Account ID / Shipper No</label>
                    <input type="text" name="account_id" value={currentProvider.account_id} onChange={handleProviderChange} placeholder="Enter Account ID" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Base URL (Optional)</label>
                    <input type="text" name="base_url" value={currentProvider.base_url} onChange={handleProviderChange} placeholder="https://api.provider.com" style={inputStyle} />
                  </div>
                </div>

                {testStatus && (
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: '6px', 
                    marginBottom: '20px', 
                    fontSize: '14px',
                    backgroundColor: testStatus.loading ? '#f1f5f9' : (testStatus.success ? '#f0fdf4' : '#fef2f2'),
                    color: testStatus.loading ? '#475569' : (testStatus.success ? '#166534' : '#991b1b'),
                    border: `1px solid ${testStatus.loading ? '#e2e8f0' : (testStatus.success ? '#bbf7d0' : '#fecaca')}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {testStatus.success && <CheckCircle size={16} />}
                    {testStatus.message || 'Testing...'}
                  </div>
                )}
                
                {currentProvider.last_tested_at && (
                  <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '13px', color: '#64748b' }}>
                    <strong>Last Tested:</strong> {new Date(currentProvider.last_tested_at).toLocaleString()} <br/>
                    <strong>Result:</strong> {currentProvider.last_test_result}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    onClick={handleTestConnection}
                    disabled={testStatus?.loading}
                    className="btn-secondary" 
                    style={{ padding: '8px 16px', fontSize: '14px' }}>
                    {testStatus?.loading ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleSaveProvider(false)}
                    className="btn-secondary" 
                    style={{ padding: '8px 16px', fontSize: '14px' }}>
                    Save Credentials
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleSaveProvider(true)}
                    className="btn-primary" 
                    style={{ padding: '8px 16px', fontSize: '14px', marginLeft: 'auto' }}>
                    Activate Integration
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Reusable inline styles for consistency
const cardStyle = {
  backgroundColor: '#fff', 
  borderRadius: '8px', 
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  overflow: 'hidden'
};

const cardHeaderStyle = {
  padding: '16px 24px', 
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const cardTitleStyle = {
  margin: 0, 
  fontSize: '16px', 
  color: '#1e293b',
  fontWeight: 600
};

const cardBodyStyle = {
  padding: '24px'
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
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#334155',
  outline: 'none',
  transition: 'border-color 0.2s',
  backgroundColor: '#fff'
};

const currencyPrefixStyle = {
  position: 'absolute', 
  left: '12px', 
  top: '50%', 
  transform: 'translateY(-50%)', 
  color: '#64748b', 
  fontSize: '14px'
};

export default AdminShipping;
