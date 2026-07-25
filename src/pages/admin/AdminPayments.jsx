import { BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { CreditCard, Save, RefreshCw, CheckCircle, XCircle, Plus, Edit2, AlertTriangle, Building2, Banknote } from 'lucide-react';
import './Settings.css'; // Reuse Settings CSS for consistent admin styling

const AdminPayments = () => {
  const [settings, setSettings] = useState(null);
  const [gateways, setGateways] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isTesting, setIsTesting] = useState(false);

  // Bank Transfer Form State
  const [bankSettings, setBankSettings] = useState({
    cod_enabled: true,
    bank_transfer_enabled: true,
    bank_name: '',
    account_title: '',
    account_number: '',
    iban: '',
    branch_name: '',
    bank_accounts: []
  });

  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [editingAccountIndex, setEditingAccountIndex] = useState(null);
  const [newBankAccount, setNewBankAccount] = useState({
    bank_name: '',
    account_title: '',
    account_number: '',
    iban: '',
    branch_name: ''
  });

  // Gateway Modal State
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState({
    gateway_name: 'Stripe',
    merchant_id: '',
    store_id: '',
    api_key: '',
    secret_key: '',
    integrity_salt: '',
    callback_url: '',
    environment: 'Sandbox',
    status: 'Inactive'
  });

  const availableGateways = ['Stripe', 'PayPal', 'JazzCash', 'Easypaisa', 'PayFast', 'Safepay', 'HBL', 'Bank Alfalah', 'Meezan Bank'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, gatewaysRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/payment/settings`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
        }),
        fetch(`${BASE_URL}/admin/payment/gateways`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
        })
      ]);

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setSettings(s);
        let mergedAccounts = s.bank_accounts || [];
        if (s.bank_name || s.account_title) {
          // Migrate primary account into the array
          mergedAccounts = [{
            bank_name: s.bank_name || '',
            account_title: s.account_title || '',
            account_number: s.account_number || '',
            iban: s.iban || '',
            branch_name: s.branch_name || ''
          }, ...mergedAccounts];
        }

        setBankSettings({
          cod_enabled: s.cod_enabled === true || s.cod_enabled === 1 || s.cod_enabled === 'true',
          bank_transfer_enabled: s.bank_transfer_enabled === true || s.bank_transfer_enabled === 1 || s.bank_transfer_enabled === 'true',
          bank_name: '',
          account_title: '',
          account_number: '',
          iban: '',
          branch_name: '',
          bank_accounts: mergedAccounts
        });
      }

      if (gatewaysRes.ok) {
        setGateways(await gatewaysRes.json());
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to fetch payment data');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleBankSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBankSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNewBankAccountChange = (field, value) => {
    setNewBankAccount(prev => ({ ...prev, [field]: value }));
  };

  const handleAddBankAccount = () => {
    if (!newBankAccount.bank_name || !newBankAccount.account_title || !newBankAccount.account_number) {
      showMessage('error', 'Please fill in the required bank details');
      return;
    }
    
    setBankSettings(prev => {
      const updated = [...prev.bank_accounts];
      if (editingAccountIndex !== null) {
        updated[editingAccountIndex] = newBankAccount;
      } else {
        updated.push(newBankAccount);
      }
      return { ...prev, bank_accounts: updated };
    });
    
    setNewBankAccount({ bank_name: '', account_title: '', account_number: '', iban: '', branch_name: '' });
    setShowAddBankForm(false);
    setEditingAccountIndex(null);
  };

  const handleEditBankAccount = (index) => {
    setNewBankAccount(bankSettings.bank_accounts[index]);
    setEditingAccountIndex(index);
    setShowAddBankForm(true);
  };

  const handleCancelEdit = () => {
    setNewBankAccount({ bank_name: '', account_title: '', account_number: '', iban: '', branch_name: '' });
    setShowAddBankForm(false);
    setEditingAccountIndex(null);
  };

  const handleRemoveBankAccount = (index) => {
    setBankSettings(prev => ({
      ...prev,
      bank_accounts: prev.bank_accounts.filter((_, i) => i !== index)
    }));
  };

  const saveBankSettings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/payment/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(bankSettings)
      });

      if (res.ok) {
        showMessage('success', 'Bank settings updated successfully');
        fetchData();
      } else {
        showMessage('error', 'Failed to update bank settings');
      }
    } catch (error) {
      showMessage('error', 'Network error');
    }
  };

  const handleGatewayChange = (e) => {
    const { name, value } = e.target;
    setEditingGateway(prev => ({ ...prev, [name]: value }));
  };

  const saveGateway = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/admin/payment/gateways`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(editingGateway)
      });

      if (res.ok) {
        showMessage('success', 'Gateway saved successfully');
        setShowGatewayModal(false);
        fetchData();
      } else {
        showMessage('error', 'Failed to save gateway');
      }
    } catch (error) {
      showMessage('error', 'Network error');
    }
  };

  const testGateway = async (gateway) => {
    setIsTesting(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/payment/gateways/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          id: gateway.id,
          gateway_name: gateway.gateway_name,
          api_key: gateway.api_key,
          secret_key: gateway.secret_key
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Test Successful: ' + data.message);
      } else {
        alert('Test Failed: ' + data.message);
      }
      fetchData(); // Refresh test results
    } catch (error) {
      alert('Network Error during test');
    } finally {
      setIsTesting(false);
    }
  };

  const toggleGatewayStatus = async (gateway) => {
    const newStatus = gateway.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`${BASE_URL}/admin/payment/gateways`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ ...gateway, status: newStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const activeGateway = gateways.find(g => g.status === 'Active');

  if (isLoading) return <div style={{ padding: '24px' }}>Loading payment settings...</div>;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Payment Management</h1>
      </div>

      {message.text && (
        <div style={{ padding: '12px 16px', borderRadius: '6px', marginBottom: '24px', backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
          {message.text}
        </div>
      )}

      {/* Payment Gateway Status Panel */}
      <div className="settings-card" style={{ marginBottom: '24px', backgroundColor: activeGateway ? '#f0fdf4' : '#fff8f1', border: `1px solid ${activeGateway ? '#bbf7d0' : '#fed7aa'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: activeGateway ? '#dcfce7' : '#ffedd5' }}>
            <CreditCard size={32} color={activeGateway ? '#16a34a' : '#ea580c'} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', color: '#1e293b' }}>Current Payment Mode</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '16px', color: activeGateway ? '#166534' : '#9a3412' }}>
                {activeGateway ? `Online Payments Active (${activeGateway.gateway_name})` : (bankSettings.bank_transfer_enabled ? 'COD + Bank Transfer (Manual)' : 'COD Only (Manual)')}
              </span>
              {!activeGateway && (
                <span style={{ fontSize: '12px', backgroundColor: '#fed7aa', color: '#9a3412', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  Online Payments Disabled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Column: Offline Methods */}
        <div className="settings-column">
          <div className="settings-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Banknote size={20} /> Manual Methods</h2>
            
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <input type="checkbox" id="cod_enabled" name="cod_enabled" checked={bankSettings.cod_enabled} onChange={handleBankSettingsChange} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="cod_enabled" style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>Enable Cash on Delivery (COD)</label>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <input type="checkbox" id="bank_transfer_enabled" name="bank_transfer_enabled" checked={bankSettings.bank_transfer_enabled} onChange={handleBankSettingsChange} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="bank_transfer_enabled" style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>Enable Bank Transfer</label>
            </div>

            {bankSettings.bank_transfer_enabled && (
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} /> Bank Details for Customers
                </h3>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '15px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Saved Bank Accounts</h4>
                  
                  {/* Saved Bank Accounts Cards */}
                  {bankSettings.bank_accounts.map((account, index) => (
                    <div key={index} style={{ marginBottom: '12px', padding: '16px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', flex: 1 }}>
                        <div><span style={{ color: '#64748b' }}>Bank Name:</span> <strong>{account.bank_name}</strong></div>
                        <div><span style={{ color: '#64748b' }}>Account Title:</span> <strong>{account.account_title}</strong></div>
                        <div><span style={{ color: '#64748b' }}>Account Number:</span> <strong>{account.account_number}</strong></div>
                        {account.iban && <div><span style={{ color: '#64748b' }}>IBAN:</span> <strong>{account.iban}</strong></div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditBankAccount(index)}
                          style={{ background: '#f1f5f9', border: 'none', color: '#3b82f6', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          title="Edit Account"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleRemoveBankAccount(index)}
                          style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Delete Account"
                        >
                          <XCircle size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {bankSettings.bank_accounts.length === 0 && !bankSettings.bank_name && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '13px' }}>
                      No bank accounts saved yet.
                    </div>
                  )}
                </div>
                
                {!showAddBankForm ? (
                  <button onClick={() => setShowAddBankForm(true)} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#f8fafc', color: '#3b82f6', border: '1px dashed #93c5fd', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    <Plus size={16} /> Add New Bank Account
                  </button>
                ) : (
                  <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', marginTop: '16px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#1e3a8a', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{editingAccountIndex !== null ? 'Edit Bank Account' : 'Add New Bank Account'}</span>
                      <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }}><XCircle size={18} /></button>
                    </h4>
                    
                    <div className="form-group">
                      <label>Bank Name *</label>
                      <input type="text" value={newBankAccount.bank_name} onChange={(e) => handleNewBankAccountChange('bank_name', e.target.value)} placeholder="e.g. Meezan Bank" />
                    </div>
                    <div className="form-group">
                      <label>Account Title *</label>
                      <input type="text" value={newBankAccount.account_title} onChange={(e) => handleNewBankAccountChange('account_title', e.target.value)} placeholder="e.g. Libas Store" />
                    </div>
                    <div className="form-group">
                      <label>Account Number *</label>
                      <input type="text" value={newBankAccount.account_number} onChange={(e) => handleNewBankAccountChange('account_number', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>IBAN (Optional)</label>
                        <input type="text" value={newBankAccount.iban} onChange={(e) => handleNewBankAccountChange('iban', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Branch Name (Optional)</label>
                        <input type="text" value={newBankAccount.branch_name} onChange={(e) => handleNewBankAccountChange('branch_name', e.target.value)} />
                      </div>
                    </div>
                    <button onClick={handleAddBankAccount} style={{ width: '100%', padding: '10px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {editingAccountIndex !== null ? 'Update Account' : 'Add to List'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button onClick={saveBankSettings} className="btn-primary" style={{ marginTop: '24px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Save Offline Methods
            </button>
          </div>
        </div>

        {/* Right Column: Online Gateways */}
        <div className="settings-column">
          <div className="settings-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={20} /> Online Gateways</h2>
              <button onClick={() => {
                setEditingGateway({
                  gateway_name: 'Stripe', merchant_id: '', store_id: '', api_key: '', secret_key: '', integrity_salt: '', callback_url: '', environment: 'Sandbox', status: 'Inactive'
                });
                setShowGatewayModal(true);
              }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add Gateway
              </button>
            </div>

            {gateways.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                <CreditCard size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p>No payment gateways configured.</p>
                <p style={{ fontSize: '13px' }}>Add a gateway to enable online payments.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {gateways.map(g => (
                  <div key={g.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: g.status === 'Active' ? '#f0fdf4' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {g.gateway_name}
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: g.environment === 'Production' ? '#fee2e2' : '#f1f5f9', color: g.environment === 'Production' ? '#991b1b' : '#475569' }}>
                            {g.environment}
                          </span>
                        </h3>
                        {g.last_tested_at && (
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Last Tested: {new Date(g.last_tested_at).toLocaleString()}
                            {g.last_test_result === 'Success' ? <CheckCircle size={14} color="#16a34a" /> : <XCircle size={14} color="#dc2626" />}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => testGateway(g)} disabled={isTesting} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <RefreshCw size={14} /> Test
                        </button>
                        <button onClick={() => { setEditingGateway({...g}); setShowGatewayModal(true); }} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Edit2 size={14} /> Edit
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: g.status === 'Active' ? '#16a34a' : '#64748b' }}>
                        {g.status}
                      </span>
                      <button 
                        onClick={() => toggleGatewayStatus(g)}
                        style={{ 
                          background: g.status === 'Active' ? '#fef2f2' : '#f0fdf4', 
                          color: g.status === 'Active' ? '#dc2626' : '#16a34a',
                          border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 
                        }}
                      >
                        {g.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showGatewayModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingGateway.id ? 'Edit Gateway' : 'Add Gateway'}</h2>
              <button className="close-btn" onClick={() => setShowGatewayModal(false)}>×</button>
            </div>
            <form onSubmit={saveGateway} className="modal-body">
              <div className="form-group">
                <label>Provider Name *</label>
                <select name="gateway_name" value={editingGateway.gateway_name} onChange={handleGatewayChange} required>
                  {availableGateways.map(gw => <option key={gw} value={gw}>{gw}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Environment</label>
                  <select name="environment" value={editingGateway.environment} onChange={handleGatewayChange}>
                    <option value="Sandbox">Sandbox (Testing)</option>
                    <option value="Production">Production (Live)</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Status</label>
                  <select name="status" value={editingGateway.status} onChange={handleGatewayChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              {editingGateway.status === 'Active' && (
                <div style={{ padding: '8px 12px', backgroundColor: '#fff7ed', border: '1px solid #fdba74', color: '#c2410c', fontSize: '13px', borderRadius: '6px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Activating this gateway will deactivate all other online gateways.</span>
                </div>
              )}

              <div className="form-group">
                <label>API Key / Client ID *</label>
                <input type="text" name="api_key" value={editingGateway.api_key || ''} onChange={handleGatewayChange} placeholder="Enter API Key" required />
              </div>
              
              <div className="form-group">
                <label>Secret Key / Password</label>
                <input type="text" name="secret_key" value={editingGateway.secret_key || ''} onChange={handleGatewayChange} placeholder="Enter Secret Key" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Merchant ID (Optional)</label>
                  <input type="text" name="merchant_id" value={editingGateway.merchant_id || ''} onChange={handleGatewayChange} />
                </div>
                <div className="form-group">
                  <label>Store ID (Optional)</label>
                  <input type="text" name="store_id" value={editingGateway.store_id || ''} onChange={handleGatewayChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Integrity Salt / Hash Key (Optional)</label>
                <input type="text" name="integrity_salt" value={editingGateway.integrity_salt || ''} onChange={handleGatewayChange} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowGatewayModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Gateway</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
