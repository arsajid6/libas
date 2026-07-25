import { BASE_URL } from '../config';
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, X, Menu, ChevronRight, Package, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import './Header.css';

const Header = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, openAuthModal, logout } = useContext(AuthContext);
  const { wishlistCount } = useContext(WishlistContext);
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled]   = useState(false);
  const [dynamicNavLinks, setDynamicNavLinks] = useState([]);
  const [freeShippingMin, setFreeShippingMin] = useState(5000);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${BASE_URL}/public/menu`);
        if (res.ok) {
          const menus = await res.json();
          const formattedLinks = menus.map(m => ({ label: m.label, to: m.link }));
          formattedLinks.push({ label: 'ADMIN', to: '/admin/dashboard' });
          setDynamicNavLinks(formattedLinks);
        } else {
          throw new Error('API returned ' + res.status);
        }
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setDynamicNavLinks([
          { label: 'HOME', to: '/' },
          { label: 'SHOP ALL', to: '/shop' },
          { label: 'ADMIN', to: '/admin/dashboard' }
        ]);
      }
    };
    const fetchShipping = async () => {
      try {
        const res = await fetch(`${BASE_URL}/public/shipping`);
        if (res.ok) {
          const data = await res.json();
          if (data.free_shipping_enabled) {
            setFreeShippingMin(data.free_shipping_min || 5000);
          }
        }
      } catch (err) {
        console.error('Failed to fetch shipping:', err);
      }
    };
    fetchMenu();
    fetchShipping();
  }, []);

  return (
    <header className={`site-header ${isScrolled ? 'site-header--scrolled' : ''}`}>

      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <div className="header-topbar">
        <span>Free Shipping on all orders over&nbsp;<strong>Rs. {freeShippingMin}</strong></span>
        <button className="topbar-arrow"><ChevronRight size={14} /></button>
      </div>

      {/* ── MAIN ROW: Logo centered, Icons right ── */}
      <div className="header-row">
        {/* Left – invisible spacer that mirrors icon area width */}
        <div className="header-left">
          <button
            className="hamburger"
            onClick={() => setIsMobileOpen(v => !v)}
            aria-label="Menu"
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Center – Logo */}
        <div className="header-center">
          <Link to="/">
            <img
              src="/images/logo_transparent.png"
              alt="DUA LIBAS"
              className="site-logo"
            />
          </Link>
        </div>

        {/* Right – Icons */}
        <div className="header-right">
          <button className="hdr-icon" aria-label="Search"><Search size={20} /></button>
          
          {user && (
            <Link to="/wishlist" className="hdr-icon hdr-cart" aria-label="Wishlist">
              <Heart size={20} />
              {wishlistCount > 0 && <span className="cart-count">{wishlistCount}</span>}
            </Link>
          )}

          <div className="account-menu-container" style={{ position: 'relative' }}>
            <button 
              className="hdr-icon" 
              aria-label="Account"
              onClick={() => {
                if (user) {
                  // Toggle dropdown or simply navigate to profile. For now, we'll build a CSS hover dropdown, so click can go to profile
                } else {
                  openAuthModal('login');
                }
              }}
            >
              {user ? (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #b76e79, #e8a0a8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                  {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
                </div>
              ) : (
                <User size={20} />
              )}
            </button>
            {user && (
              <div className="account-dropdown">
                <div className="account-dropdown-header">
                  <strong>{user.full_name || 'Account'}</strong>
                  <span>{user.email}</span>
                </div>
                <Link to="/profile" className="account-dropdown-item">My Profile</Link>
                <Link to="/orders" className="account-dropdown-item">My Orders</Link>
                <Link to="/wishlist" className="account-dropdown-item">Wishlist</Link>
                {user.role === 'admin' && <Link to="/admin/dashboard" className="account-dropdown-item">Admin Dashboard</Link>}
                <button 
                  onClick={() => {
                    logout();
                    navigate('/');
                  }} 
                  className="account-dropdown-item" 
                  style={{ borderTop: '1px solid #e2e8f0', color: '#ef4444', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          <Link to="/track-order" className="hdr-icon" aria-label="Track Order" title="Track Order">
            <Package size={20} />
          </Link>

          <button
            className="hdr-icon hdr-cart"
            aria-label="Cart"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* ── NAVIGATION BAR ── */}
      <nav className={`header-nav ${isMobileOpen ? 'header-nav--open' : ''}`}>
        {dynamicNavLinks.map(link => (
          link.subLinks ? (
            <div key={link.label} className="nav-dropdown-container">
              <Link
                to={link.to}
                className="nav-link"
                onClick={() => setIsMobileOpen(false)}
              >
                {link.label}
              </Link>
              <div className="nav-dropdown">
                {link.subLinks.map(sub => (
                  <Link
                    key={sub.label}
                    to={sub.to}
                    className="nav-dropdown-link"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              key={link.label}
              to={link.to}
              className="nav-link"
              onClick={() => setIsMobileOpen(false)}
            >
              {link.label}
            </Link>
          )
        ))}
        {isMobileOpen && (
          <Link
            to="/track-order"
            className="nav-link"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b76e79' }}
            onClick={() => setIsMobileOpen(false)}
          >
            <Package size={18} />
            Track Order
          </Link>
        )}
      </nav>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div className="nav-backdrop" onClick={() => setIsMobileOpen(false)} />
      )}
    </header>
  );
};

export default Header;
