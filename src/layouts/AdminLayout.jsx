import { BASE_URL } from '../config';
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, FileText, ChevronDown, ChevronRight, Image, Truck, AlertTriangle, Star, User, CreditCard, Database, Shield, Menu, X } from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [menus, setMenus] = useState([]);
  const [isSystemLogsOpen, setIsSystemLogsOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    } else {
      // Verify token
      fetch(`${BASE_URL}/admin/verify-token`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          sessionStorage.removeItem('adminToken');
          navigate('/admin/login');
        } else {
          fetchMenus();
          fetchPendingOrdersCount();
        }
      })
      .catch(() => {
        // If network error, maybe let them stay or kick them out. Kicking out is safer.
        navigate('/admin/login');
      });

      const interval = setInterval(fetchPendingOrdersCount, 10000);
      return () => clearInterval(interval);
    }
  }, [navigate]);

  const fetchPendingOrdersCount = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/orders/pending-count`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingOrdersCount(data.count);
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
      if (res.ok) setMenus(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSidebarDeleteMenu = async (menu) => {
    const confirmation = window.prompt(`To delete '${menu.label}', type DELETE below:`);
    if (confirmation === 'DELETE') {
      try {
        const res = await fetch(`${BASE_URL}/admin/menu/${menu.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
        });
        if (res.ok) fetchMenus();
        else alert('Failed to delete menu');
      } catch (err) {
        console.error(err);
      }
    } else if (confirmation !== null) {
      alert("Verification failed. Type DELETE exactly to confirm.");
    }
  };

  const handleSidebarEditMenu = async (menu) => {
    const newLabel = window.prompt(`Enter new label for '${menu.label}':`, menu.label);
    if (newLabel && newLabel.trim() !== '' && newLabel !== menu.label) {
      try {
        const res = await fetch(`${BASE_URL}/admin/menu/${menu.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` 
          },
          body: JSON.stringify({ label: newLabel, link: menu.link, sort_order: menu.sort_order })
        });
        if (res.ok) fetchMenus();
        else alert('Failed to update menu');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    sessionStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="admin-container">
      {/* Mobile Topbar */}
      <div className="admin-mobile-topbar">
        <h2>CA ADMIN</h2>
        <button className="admin-mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="admin-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-logo">
          <h2>CA ADMIN</h2>
        </div>
        <nav className="admin-nav" onClick={() => {
          if (window.innerWidth <= 768) {
            setIsMobileMenuOpen(false);
          }
        }}>
          <Link to="/admin/dashboard" className={`admin-nav-link ${isActive('/admin/dashboard')}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
            <Link to="/admin/hero" className={`admin-nav-link ${isActive('/admin/hero')}`}>
              <Image size={20} />
              <span>Hero Slider</span>
            </Link>
            
            <Link to="/admin/stock-alerts" className={`admin-nav-link ${isActive('/admin/stock-alerts')}`}>
              <AlertTriangle size={20} />
              <span>Stock Alerts</span>
            </Link>

            <Link to="/admin/orders" className="admin-nav-link" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShoppingCart size={20} />
                <span>Orders</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  {pendingOrdersCount}
                </span>
              )}
            </Link>
            
            <Link to="/admin/reviews" className={`admin-nav-link ${isActive('/admin/reviews')}`}>
              <Star size={20} />
              <span>Reviews</span>
            </Link>

            <Link to="/admin/settings" className={`admin-nav-link ${isActive('/admin/settings')}`}>
              <User size={20} />
              <span>Profile & Settings</span>
            </Link>
            <Link to="/admin/shipping" className={`admin-nav-link ${isActive('/admin/shipping')}`}>
              <Truck size={20} />
              <span>Shipping</span>
            </Link>
            <Link to="/admin/payments" className={`admin-nav-link ${isActive('/admin/payments')}`}>
              <CreditCard size={20} />
              <span>Payments</span>
            </Link>
            <Link to="/admin/backups" className={`admin-nav-link ${isActive('/admin/backups')}`}>
              <Database size={20} />
              <span>System Backups</span>
            </Link>

            <div className="admin-accordion">
              <div 
                className={`admin-nav-link ${isSystemLogsOpen ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIsSystemLogsOpen(!isSystemLogsOpen); }}
                style={{ cursor: 'pointer', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Shield size={20} />
                  <span>System Logs</span>
                </div>
                <ChevronDown 
                  size={16} 
                  style={{ 
                    transform: isSystemLogsOpen ? 'rotate(180deg)' : 'rotate(0)', 
                    transition: 'transform 0.2s' 
                  }} 
                />
              </div>
              
              {isSystemLogsOpen && (
                <div className="admin-sublinks" style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', marginTop: '4px' }}>
                    <Link to={`/admin/logs/security`} className={`admin-nav-link ${isActive('/admin/logs/security')}`} style={{ fontSize: '13px', paddingBottom: '4px', paddingTop: '4px' }}>
                      Security Logs
                    </Link>
                    <Link to={`/admin/logs/audit`} className={`admin-nav-link ${isActive('/admin/logs/audit')}`} style={{ fontSize: '13px', paddingBottom: '4px', paddingTop: '4px' }}>
                      Audit Logs
                    </Link>
                </div>
              )}
            </div>

            <div className="admin-accordion">
              <div 
                className={`admin-nav-link ${isPagesOpen ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIsPagesOpen(!isPagesOpen); }}
                style={{ cursor: 'pointer', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={20} />
                  <span>Pages</span>
                </div>
                <ChevronDown 
                  size={16} 
                  style={{ 
                    transform: isPagesOpen ? 'rotate(180deg)' : 'rotate(0)', 
                    transition: 'transform 0.2s' 
                  }} 
                />
              </div>
              
              {isPagesOpen && (
                <div className="admin-sublinks" style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', marginTop: '4px' }}>
                  {menus.map((menu, index) => (
                    <Link key={index} to={`/admin/pages/${menu.label.toLowerCase().replace(/\s+/g, '-')}`} className="admin-nav-link" style={{ fontSize: '13px', paddingBottom: '4px', paddingTop: '4px' }}>
                      {menu.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
        </nav>
        <div className="admin-logout">
          <a href="/" onClick={handleLogout} className="admin-nav-link">
            <LogOut size={20} /> Logout
          </a>
          <Link to="/" className="admin-nav-link" style={{ marginTop: '8px' }}>
            Back to Store
          </Link>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <h2>Garments Store Panel</h2>
          <div className="admin-profile">Admin</div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
