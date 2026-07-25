import { BASE_URL } from '../config';
import React, { useContext, useState } from 'react';
import { X, Mail, Lock, User, Phone, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './AuthModal.css';

const AuthModal = () => {
  const navigate = useNavigate();
  const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab, login } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [mockLink, setMockLink] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (authModalTab === 'signup') {
      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${BASE_URL}/auth/user/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg(data.message);
          setMockLink(data.mock_link); // Only for dev purposes!
        } else {
          setError(data.error || 'Registration failed');
        }
      } catch (err) {
        setError('Network error');
      }
    } else {
      // Login
      try {
        const res = await fetch(`${BASE_URL}/auth/user/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const data = await res.json();
        if (res.ok) {
          login(data.token, data.user);
          navigate('/');
        } else {
          setError(data.error || 'Login failed');
        }
      } catch (err) {
        setError('Network error');
      }
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/user/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error || 'Google login failed');
      }
    } catch (err) {
      setError('Google login error');
    }
  };

  // Helper for mock email verification in dev
  const handleMockVerify = async () => {
    const urlParams = new URLSearchParams(mockLink.split('?')[1]);
    const token = urlParams.get('token');
    try {
      const res = await fetch(`${BASE_URL}/auth/user/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Mock verify failed');
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={closeAuthModal}>
          <X size={20} />
        </button>

        <div className="auth-modal-header">
          <div 
            className={`auth-tab ${authModalTab === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthModalTab('login'); setError(''); setSuccessMsg(''); }}
          >
            Login
          </div>
          <div 
            className={`auth-tab ${authModalTab === 'signup' ? 'active' : ''}`}
            onClick={() => { setAuthModalTab('signup'); setError(''); setSuccessMsg(''); }}
          >
            Sign Up
          </div>
        </div>

        <div className="auth-modal-body">
          {successMsg ? (
            <div className="auth-success-state">
              <CheckCircle size={48} color="#10b981" />
              <h3>Check your Email!</h3>
              <p>{successMsg}</p>
              {/* DEV ONLY MOCK VERIFICATION */}
              {mockLink && (
                <div style={{marginTop: '20px', padding: '10px', background: '#fef3c7', borderRadius: '4px'}}>
                  <p style={{fontSize: '12px', color: '#b45309', marginBottom: '10px'}}>
                    <b>Developer Mode:</b> Click below to simulate clicking the email link.
                  </p>
                  <button onClick={handleMockVerify} className="btn-auth-primary" style={{background: '#d97706'}}>
                    Simulate Email Verification
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="auth-social-login">
                <div onClick={() => {
                  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID === 'dummy-client-id') {
                    setError('Google Login requires a valid VITE_GOOGLE_CLIENT_ID in your .env file to work. Please generate it from Google Cloud Console.');
                  }
                }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Login Failed. Check your Client ID configuration.')}
                    useOneTap
                    theme="filled_black"
                    shape="rectangular"
                    width="100%"
                  />
                </div>
              </div>

              <div className="auth-divider">
                <span>or continue with email</span>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
                {authModalTab === 'signup' && (
                  <div className="form-group">
                    <label>Full Name *</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input 
                        type="text" 
                        name="full_name" 
                        value={formData.full_name} 
                        onChange={handleInputChange} 
                        placeholder="John Doe" 
                        autoComplete="off"
                        required 
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address *</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      placeholder="you@example.com" 
                      autoComplete="off"
                      required 
                    />
                  </div>
                </div>

                {authModalTab === 'signup' && (
                  <div className="form-group">
                    <label>Mobile Number (Optional)</label>
                    <div className="input-with-icon">
                      <Phone size={18} />
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder="0300-1234567" 
                        autoComplete="off"
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Password *</label>
                  <div className="input-with-icon" style={{ position: 'relative', display: 'flex', width: '100%' }}>
                    <Lock size={18} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      placeholder="••••••••" 
                      autoComplete="new-password"
                      style={{ paddingRight: '40px' }}
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {authModalTab === 'signup' && (
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <div className="input-with-icon" style={{ position: 'relative', display: 'flex', width: '100%' }}>
                      <Lock size={18} />
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        name="confirm_password" 
                        value={formData.confirm_password} 
                        onChange={handleInputChange} 
                        placeholder="••••••••" 
                        autoComplete="new-password"
                        style={{ paddingRight: '40px' }}
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {authModalTab === 'login' && (
                  <div className="auth-forgot-password">
                    <a href="#">Forgot Password?</a>
                  </div>
                )}

                <button type="submit" className="btn-auth-primary" disabled={loading}>
                  {loading ? 'Please wait...' : (authModalTab === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
