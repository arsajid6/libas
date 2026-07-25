import { BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import './Settings.css';
import { Shield, Eye, EyeOff, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Settings = () => {
  const [user, setUser] = useState({
    username: '',
    email: '',
    facebook_link: '',
    recovery_pin: '',
    security_question: ''
  });

  const [storeSettings, setStoreSettings] = useState({
    phone: '',
    email: '',
    address: '',
    facebook_link: '',
    instagram_link: '',
    timing_text: ''
  });

  // Password visibility
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showSecurityPassword, setShowSecurityPassword] = useState(false);

  // Forms state
  const [usernameForm, setUsernameForm] = useState({ currentUsername: '', newUsername: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [emailForm, setEmailForm] = useState({ newEmail: '', newFacebookLink: '' });

  // Security Modal
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityForm, setSecurityForm] = useState({
    recoveryPin: '',
    securityQuestion: '',
    securityQuestionText: 'What is your favorite pet\'s name?',
    currentPassword: ''
  });

  // Menu Management
  const [menuItems, setMenuItems] = useState([]);
  const [menuForm, setMenuForm] = useState({ label: '', link: '' });
  
  // Menu Modals
  const [showDeleteMenuModal, setShowDeleteMenuModal] = useState(false);
  const [showEditMenuModal, setShowEditMenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState({ id: null, label: '', link: '' });

  useEffect(() => {
    fetchSettings();
    fetchMenus();
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/store-settings`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        setStoreSettings(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/menu`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/admin/settings/username`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(usernameForm)
      });
      if (res.ok) {
        alert('Username updated successfully');
        setUsernameForm({ currentUsername: '', newUsername: '' });
        fetchSettings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update username');
      }
    } catch (err) {
      alert('Error updating username');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/admin/settings/password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(passwordForm)
      });
      if (res.ok) {
        alert('Password updated successfully');
        setPasswordForm({ currentPassword: '', newPassword: '' });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update password');
      }
    } catch (err) {
      alert('Error updating password');
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/admin/settings/email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(emailForm)
      });
      if (res.ok) {
        alert('Info updated successfully');
        setEmailForm({ newEmail: '', newFacebookLink: '' });
        fetchSettings();
      } else {
        alert('Failed to update info');
      }
    } catch (err) {
      alert('Error updating info');
    }
  };

  const handleUpdateStoreSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/admin/store-settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(storeSettings)
      });
      if (res.ok) {
        alert('Store Info updated successfully');
        fetchStoreSettings();
      } else {
        alert('Failed to update store info');
      }
    } catch (err) {
      alert('Error updating store info');
    }
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    if (!securityForm.currentPassword) {
      alert("Please enter your current admin password to save security settings.");
      return;
    }
    
    try {
      const res = await fetch(`${BASE_URL}/admin/settings/security`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(securityForm)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Security settings updated successfully');
        setShowSecurityModal(false);
        setSecurityForm({ currentPassword: '', recoveryPin: '', securityQuestion: '', securityQuestionText: 'What is your favorite pet\'s name?' });
        fetchSettings();
      } else {
        alert(data.error || 'Failed to update security settings');
      }
    } catch (err) {
      alert('Error updating security settings');
    }
  };

  const openSecurityModal = () => {
    setSecurityForm({
      currentPassword: '',
      recoveryPin: user.recovery_pin || '',
      securityQuestion: user.security_question || '',
      securityQuestionText: user.security_question_text || 'What is your favorite pet\'s name?'
    });
    setShowSecurityModal(true);
  };

  const handleAddMenu = async (e) => {
    e.preventDefault();
    if (!menuForm.label || !menuForm.link) return alert('Label and link are required');
    
    try {
      const res = await fetch(`${BASE_URL}/admin/menu`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ ...menuForm, sort_order: menuItems.length })
      });
      
      if (res.ok) {
        setMenuForm({ label: '', link: '' });
        fetchMenus();
      }
    } catch (err) {
      alert('Error adding menu item');
    }
  };

  const handleUpdateEditingMenu = async (e) => {
    e.preventDefault();
    if (!editingMenu.label || !editingMenu.link) return alert('Label and link are required');
    
    try {
      const res = await fetch(`${BASE_URL}/admin/menu/${editingMenu.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ label: editingMenu.label, link: editingMenu.link })
      });
      
      if (res.ok) {
        setShowEditMenuModal(false);
        fetchMenus();
      }
    } catch (err) {
      alert('Error updating menu item');
    }
  };

  const openEditModal = (item) => {
    setEditingMenu({ id: item.id, label: item.label, link: item.link });
    setShowEditMenuModal(true);
  };

  const handleDeleteMenuWithConfirm = async (id) => {
    const confirmText = prompt('Are you sure you want to delete this menu item? Type DELETE to confirm.');
    if (confirmText !== 'DELETE') {
      if (confirmText !== null) alert("You didn't type DELETE correctly. Menu was not deleted.");
      return;
    }
    
    try {
      const res = await fetch(`${BASE_URL}/admin/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        fetchMenus();
        if (menuItems.length <= 1) setShowDeleteMenuModal(false); // Close if empty
      }
    } catch (err) {
      alert('Error deleting menu item');
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setMenuItems(items);
  };
  
  const handleSaveMenuOrder = async () => {
    const orderData = menuItems.map((item, index) => ({ id: item.id, sort_order: index }));
    try {
      const res = await fetch(`${BASE_URL}/admin/menu/reorder`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ order: orderData })
      });
      if (res.ok) {
        alert('Menu order saved successfully!');
        fetchMenus();
      }
    } catch (err) {
      alert('Error saving order');
    }
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      
      <div className="settings-grid">
        {/* LEFT COLUMN: All personal / security settings */}
        <div className="settings-col-left">
          
          <div className="username-pass-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
            <form className="settings-card" onSubmit={handleUpdateUsername} style={{ marginBottom: 0 }}>
              <h3>Change Username</h3>
              <div className="settings-form-group">
                <label>Current Username</label>
                <input 
                  type="text" 
                  value={usernameForm.currentUsername} 
                  onChange={(e) => setUsernameForm({...usernameForm, currentUsername: e.target.value})}
                  required 
                />
              </div>
              <div className="settings-form-group">
                <label>New Username</label>
                <input 
                  type="text" 
                  value={usernameForm.newUsername} 
                  onChange={(e) => setUsernameForm({...usernameForm, newUsername: e.target.value})}
                  required 
                />
              </div>
              <button type="submit" className="btn-update btn-purple" style={{ marginTop: 'auto' }}>Update Username</button>
            </form>

            <form className="settings-card" onSubmit={handleUpdatePassword} style={{ marginBottom: 0 }}>
              <h3>Change Password</h3>
              <div className="settings-form-group">
                <label>Old Password (Current)</label>
                <div className="password-input">
                  <input 
                    type={showOldPassword ? "text" : "password"} 
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required 
                  />
                  {showOldPassword ? 
                    <EyeOff size={16} onClick={() => setShowOldPassword(false)} /> : 
                    <Eye size={16} onClick={() => setShowOldPassword(true)} />
                  }
                </div>
              </div>
              <div className="settings-form-group">
                <label>New Password</label>
                <div className="password-input">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required 
                  />
                  {showNewPassword ? 
                    <EyeOff size={16} onClick={() => setShowNewPassword(false)} /> : 
                    <Eye size={16} onClick={() => setShowNewPassword(true)} />
                  }
                </div>
              </div>
              <button type="submit" className="btn-update btn-blue" style={{ marginTop: 'auto' }}>Update Password</button>
            </form>
          </div>



          <div className="settings-card menu-manager-card">
            <h3>Manage Main Menu</h3>
            <form onSubmit={handleAddMenu} className="add-menu-form">
              <input 
                type="text" 
                placeholder="Menu Label (e.g. SUMMER SALE)" 
                value={menuForm.label}
                onChange={(e) => setMenuForm({...menuForm, label: e.target.value})}
                required
              />
              <input 
                type="text" 
                placeholder="Link (e.g. /shop?category=summer)" 
                value={menuForm.link}
                onChange={(e) => setMenuForm({...menuForm, link: e.target.value})}
                required
              />
              <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                <button type="submit" className="btn-add-menu" style={{flex: 1}}>
                  + Add Menu
                </button>
                <button type="button" onClick={() => setShowDeleteMenuModal(true)} className="btn-add-menu" style={{flex: 1, backgroundColor: '#ef4444'}}>
                  Delete Menu
                </button>
              </div>
            </form>

            <div className="menu-drag-hint">⋮⋮ Drag items to reorder — Click pencil to edit name</div>
            
            {menuItems.length === 0 ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#888', border: '1px dashed #ccc', borderRadius: '8px', margin: '15px 0'}}>
                No menus found. Add one above!
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="menus">
                  {(provided) => (
                    <div 
                      className="menu-drag-list" 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      style={{ minHeight: '150px' }}
                    >
                      {menuItems.map((item, index) => (
                        <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              className={`menu-drag-item ${snapshot.isDragging ? 'dragging' : ''}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0, 0, 0, 0.15)' : 'none'
                              }}
                            >
                              <div className="drag-handle">
                                <GripVertical size={16}/>
                              </div>
                              <div className="menu-drag-label">{item.label}</div>
                              <button type="button" className="menu-drag-edit" onClick={() => openEditModal(item)} title="Edit Menu Name">
                                <Pencil size={14} /> Edit
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            
            <button type="button" onClick={handleSaveMenuOrder} className="btn-update btn-green" style={{marginTop: '15px', width: '100%', paddingTop: '15px', paddingBottom: '15px'}}>
              ✓ Save Order
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="settings-col-right">
          
          <form className="settings-card store-info-card" onSubmit={handleUpdateStoreSettings}>
            <h3>Store Information & Contact</h3>
            <div className="settings-form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                value={storeSettings.phone || ''}
                onChange={(e) => setStoreSettings({...storeSettings, phone: e.target.value})}
              />
            </div>
            <div className="settings-form-group">
              <label>Support Email</label>
              <input 
                type="email" 
                value={storeSettings.email || ''}
                onChange={(e) => setStoreSettings({...storeSettings, email: e.target.value})}
              />
            </div>
            <div className="settings-form-group">
              <label>Address</label>
              <input 
                type="text" 
                value={storeSettings.address || ''}
                onChange={(e) => setStoreSettings({...storeSettings, address: e.target.value})}
              />
            </div>
            <div className="settings-form-group">
              <label>Timings Text (e.g. Mon - Sun | 24/7)</label>
              <input 
                type="text" 
                value={storeSettings.timing_text || ''}
                onChange={(e) => setStoreSettings({...storeSettings, timing_text: e.target.value})}
              />
            </div>
            <div className="settings-form-group">
              <label>Facebook Link</label>
              <input 
                type="text" 
                value={storeSettings.facebook_link || ''}
                onChange={(e) => setStoreSettings({...storeSettings, facebook_link: e.target.value})}
              />
            </div>
            <div className="settings-form-group">
              <label>Instagram Link</label>
              <input 
                type="text" 
                value={storeSettings.instagram_link || ''}
                onChange={(e) => setStoreSettings({...storeSettings, instagram_link: e.target.value})}
              />
            </div>
            <div className="settings-form-group">
              <label>TikTok Link</label>
              <input 
                type="text" 
                value={storeSettings.tiktok_link || ''}
                onChange={(e) => setStoreSettings({...storeSettings, tiktok_link: e.target.value})}
              />
            </div>
            <button type="submit" className="btn-update btn-green" style={{ marginTop: '16px' }}>Save Store Info</button>
          </form>

          <div className="settings-card security-card">
            <div className="security-icon-wrapper">
              <Shield />
            </div>
            <h3 style={{textAlign: 'center', borderBottom: 'none'}}>Password Recovery Security</h3>
            
            <div className="security-status-box">
              <div className="security-status-item">
                <span>Recovery PIN:</span>
                <span className={user.recovery_pin ? "status-set" : "status-not-set"}>
                  {user.recovery_pin ? "✓ Set" : "⊗ Not Set"}
                </span>
              </div>
              <div className="security-status-item">
                <span>Security Question:</span>
                <span className={user.security_question ? "status-set" : "status-not-set"}>
                  {user.security_question ? "✓ Set" : "⊗ Not Set"}
                </span>
              </div>
            </div>
            
            <button type="button" className="btn-update btn-navy" onClick={openSecurityModal}>
              <Shield size={16} /> Update Security Settings
            </button>
          </div>

        </div>
      </div>

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="security-modal-overlay">
          <div className="security-modal">
            <button className="modal-close" onClick={() => setShowSecurityModal(false)}>✕</button>
            <div className="modal-header">
              <Shield className="modal-icon" />
              <h3>Security Settings</h3>
            </div>
            <p className="modal-desc">Set these to recover your account if you forget the password.</p>
            
            <form onSubmit={handleUpdateSecurity}>
              <div className="modal-box" style={{backgroundColor: '#eff6ff', borderColor: '#bfdbfe'}}>
                <label>Verify Current Password</label>
                <div className="modal-note">Please enter your admin password first to authorize changes.</div>
                <div className="password-input" style={{position: 'relative'}}>
                  <input 
                    type={showSecurityPassword ? "text" : "password"} 
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                    placeholder="Enter admin password..."
                    required
                  />
                  <div style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', cursor: 'pointer', display: 'flex'}}>
                    {showSecurityPassword ? 
                      <EyeOff size={16} onClick={() => setShowSecurityPassword(false)} /> : 
                      <Eye size={16} onClick={() => setShowSecurityPassword(true)} />
                    }
                  </div>
                </div>
              </div>

              <div className="modal-box">
                <label>Add Recovery PIN (4-6 digits)</label>
                <div className="modal-note">This PIN will be required to reset your password.</div>
                <input 
                  type="text" 
                  value={securityForm.recoveryPin}
                  onChange={(e) => setSecurityForm({...securityForm, recoveryPin: e.target.value})}
                  placeholder="e.g. 1234"
                  maxLength={6}
                />
              </div>
              
              <div className="modal-box">
                <label>Select Security Question</label>
                <select 
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px'}}
                  value={securityForm.securityQuestionText}
                  onChange={(e) => setSecurityForm({...securityForm, securityQuestionText: e.target.value})}
                >
                  <option value="What is your favorite pet's name?">What is your favorite pet's name?</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What was the name of your first school?">What was the name of your first school?</option>
                  <option value="In what city were you born?">In what city were you born?</option>
                  <option value="What is the name of your childhood best friend?">What is the name of your childhood best friend?</option>
                </select>
                <input 
                  type="text" 
                  value={securityForm.securityQuestion}
                  onChange={(e) => setSecurityForm({...securityForm, securityQuestion: e.target.value})}
                  placeholder="Your answer..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowSecurityModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Menu Modal */}
      {showEditMenuModal && (
        <div className="security-modal-overlay">
          <div className="security-modal" style={{maxWidth: '400px'}}>
            <button className="modal-close" onClick={() => setShowEditMenuModal(false)}>✕</button>
            <div className="modal-header">
              <Pencil className="modal-icon" />
              <h3>Edit Menu</h3>
            </div>
            
            <form onSubmit={handleUpdateEditingMenu}>
              <div className="modal-box">
                <label>Menu Label</label>
                <input 
                  type="text" 
                  value={editingMenu.label}
                  onChange={(e) => setEditingMenu({...editingMenu, label: e.target.value})}
                  required
                />
              </div>
              <div className="modal-box">
                <label>Menu Link</label>
                <input 
                  type="text" 
                  value={editingMenu.link}
                  onChange={(e) => setEditingMenu({...editingMenu, link: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditMenuModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Update Name</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Menu Modal */}
      {showDeleteMenuModal && (
        <div className="security-modal-overlay">
          <div className="security-modal">
            <button className="modal-close" onClick={() => setShowDeleteMenuModal(false)}>✕</button>
            <div className="modal-header">
              <Trash2 className="modal-icon" style={{color: '#ef4444', backgroundColor: '#fee2e2'}} />
              <h3>Delete Menus</h3>
            </div>
            <p className="modal-desc">Click on a menu below to delete it permanently.</p>
            
            <div className="modal-box" style={{maxHeight: '300px', overflowY: 'auto', padding: '10px'}}>
              {menuItems.length === 0 ? (
                <div style={{textAlign: 'center', color: '#888'}}>No menus available.</div>
              ) : (
                menuItems.map(item => (
                  <div key={item.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee'}}>
                    <span style={{fontWeight: '500'}}>{item.label}</span>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteMenuWithConfirm(item.id)}
                      style={{background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowDeleteMenuModal(false)} style={{width: '100%'}}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
