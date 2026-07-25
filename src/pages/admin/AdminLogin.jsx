import { BASE_URL } from '../../config';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import './AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState('method'); // method -> answer -> new_password -> success
  const [methodsConfigured, setMethodsConfigured] = useState(true);
  const [hasPin, setHasPin] = useState(true);
  const [hasQuestion, setHasQuestion] = useState(true);
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryType, setRecoveryType] = useState('pin'); // pin or question
  const [securityQuestionText, setSecurityQuestionText] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        sessionStorage.setItem('adminToken', data.token);
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/admin/verify-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: recoveryUsername, recoveryType, recoveryAnswer })
      });
      const data = await res.json();
      if (res.ok) {
        setRecoveryStep('new_password');
      } else {
        setRecoveryError(data.error || 'Invalid recovery answer or PIN');
      }
    } catch (err) {
      setRecoveryError('Network error');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPasswordValue !== confirmPasswordValue) {
      setRecoveryError('Passwords do not match');
      return;
    }
    setRecoveryError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: recoveryUsername, 
          recoveryType, 
          recoveryAnswer,
          newPassword: newPasswordValue 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRecoveryStep('success');
      } else {
        setRecoveryError(data.error || 'Password reset failed');
      }
    } catch (err) {
      setRecoveryError('Network error');
    }
  };

  const openRecoveryModal = async () => {
    setShowRecoveryModal(true);
    setRecoveryStep('method');
    setRecoveryAnswer('');
    setRecoveryError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/admin/recovery-info-default`);
      const data = await res.json();
      if (res.ok) {
        setMethodsConfigured(data.methodsConfigured);
        setHasPin(data.hasPin);
        setHasQuestion(data.hasQuestion);
        
        if (!data.methodsConfigured) {
          setRecoveryStep('not_configured');
        } else {
          setRecoveryType(data.hasPin ? 'pin' : 'question');
        }
        
        setRecoveryUsername(data.username);
        setSecurityQuestionText(data.securityQuestionText);
      } else {
        setRecoveryError('Failed to load recovery info. Please try again.');
      }
    } catch (err) {
      setRecoveryError('Network error while loading recovery info.');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="login-header">
          <div className="icon-circle">
            <Lock size={28} />
          </div>
          <h2>Admin Login</h2>
          <p>Sign in to access the control panel</p>
        </div>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name={`admin_usr_${Math.random()}`}
              required 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name={`admin_pwd_${Math.random()}`}
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <button 
                type="button" 
                className="forgot-password-link" 
                onClick={openRecoveryModal}
              >
                Forgot Password?
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary w-100">Sign In</button>
        </form>
        
        <div className="login-footer">
          <a href="/">← Back to Storefront</a>
        </div>
      </div>

      {showRecoveryModal && (
        <div className="recovery-modal-overlay">
          <div className="recovery-modal">
            <button className="close-modal" onClick={() => setShowRecoveryModal(false)}>×</button>
            <h3>Password Recovery</h3>
            {recoveryError && <div className="login-error">{recoveryError}</div>}

            {recoveryStep === 'not_configured' && (
              <div className="recovery-error-state" style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ color: '#ef4444', marginBottom: '16px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <h4 style={{ color: '#991b1b', marginBottom: '12px', fontSize: '1.2rem' }}>No Recovery Methods Configured</h4>
                <p style={{ color: '#b91c1c', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  You have not set up a Recovery PIN or Security Question. Please contact system support.
                </p>
                <button onClick={() => setShowRecoveryModal(false)} className="btn-primary w-100" style={{marginTop: '24px'}}>
                  Back to Login
                </button>
              </div>
            )}

            {recoveryStep === 'method' && (
              <div>
                <p style={{marginBottom: '16px'}}>Choose a recovery method:</p>
                <div className="form-group">
                  <select value={recoveryType} onChange={(e) => setRecoveryType(e.target.value)} style={{width: '100%', padding: '10px'}}>
                    {hasPin && <option value="pin">Recovery PIN</option>}
                    {hasQuestion && <option value="question">Security Question</option>}
                  </select>
                </div>
                <button onClick={() => setRecoveryStep('answer')} className="btn-primary w-100">Continue</button>
              </div>
            )}

            {recoveryStep === 'answer' && (
              <form onSubmit={handleRecoverySubmit}>
                <div className="form-group">
                  <label>
                    {recoveryType === 'pin' ? 'Enter your 4-6 digit Recovery PIN' : securityQuestionText}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={recoveryAnswer} 
                    onChange={e => setRecoveryAnswer(e.target.value)} 
                  />
                </div>
                <button type="submit" className="btn-primary w-100">Recover Password</button>
              </form>
            )}

            {recoveryStep === 'new_password' && (
              <form onSubmit={handlePasswordReset}>
                <div className="form-group">
                  <label>Enter New Password</label>
                  <input 
                    type="password" 
                    required 
                    value={newPasswordValue} 
                    onChange={e => setNewPasswordValue(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    required 
                    value={confirmPasswordValue} 
                    onChange={e => setConfirmPasswordValue(e.target.value)} 
                  />
                </div>
                <button type="submit" className="btn-primary w-100">Set New Password</button>
              </form>
            )}

            {recoveryStep === 'success' && (
              <div className="recovery-success">
                <p>Password Reset Successful!</p>
                <p style={{fontSize: '0.9rem', color: '#666', marginTop: '10px'}}>
                  Your password has been changed. You can now log in with your new password.
                </p>
                <button onClick={() => {
                  setShowRecoveryModal(false);
                  setUsername(recoveryUsername);
                }} className="btn-primary w-100" style={{marginTop: '20px'}}>
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
