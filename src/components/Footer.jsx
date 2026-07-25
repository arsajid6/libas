import { BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Award, RefreshCcw, Headset, MessageCircle, MapPin, Phone, Mail, Clock, ArrowUp } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const [freeShippingMin, setFreeShippingMin] = useState(5000);
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
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

    const fetchStoreSettings = async () => {
      try {
        const res = await fetch(`${BASE_URL}/public/store-settings`);
        if (res.ok) {
          setStoreSettings(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch store settings:', err);
      }
    };

    fetchShipping();
    fetchStoreSettings();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="footer-wrapper">
      {/* Top Features Banner */}
      <div className="footer-features">
        <div className="feature-item">
          <Truck size={32} strokeWidth={1} className="feature-icon" />
          <div className="feature-text">
            <h4>FREE SHIPPING</h4>
            <p>On all orders over Rs. {freeShippingMin}</p>
          </div>
        </div>
        <div className="feature-item">
          <Award size={32} strokeWidth={1} className="feature-icon" />
          <div className="feature-text">
            <h4>PREMIUM QUALITY</h4>
            <p>Finest fabrics & craftsmanship</p>
          </div>
        </div>
        <div className="feature-item">
          <RefreshCcw size={32} strokeWidth={1} className="feature-icon" />
          <div className="feature-text">
            <h4>EASY RETURNS</h4>
            <p>Within 7 days</p>
          </div>
        </div>
        <div className="feature-item">
          <Headset size={32} strokeWidth={1} className="feature-icon" />
          <div className="feature-text">
            <h4>CUSTOMER SUPPORT</h4>
            <p>We're here to help</p>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="footer-main">
        <div className="footer-container">
          
          {/* Column 1: Brand */}
          <div className="footer-col brand-col">
            <Link to="/">
              <img src="/images/logo_transparent.png" alt="DUA LIBAS" className="footer-logo" />
            </Link>
            <p className="brand-desc">
              Timeless elegance, premium fabrics and exquisite craftsmanship - designed for the modern you.
            </p>
            <div className="social-icons">
              {storeSettings?.instagram_link && (
                <a 
                  href={storeSettings.instagram_link.startsWith('http') ? storeSettings.instagram_link : `https://${storeSettings.instagram_link}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Instagram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              )}
              {storeSettings?.facebook_link && (
                <a 
                  href={storeSettings.facebook_link.startsWith('http') ? storeSettings.facebook_link : `https://${storeSettings.facebook_link}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Facebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
              )}
              <a 
                href={storeSettings?.tiktok_link ? (storeSettings.tiktok_link.startsWith('http') ? storeSettings.tiktok_link : `https://${storeSettings.tiktok_link}`) : '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                </svg>
              </a>
              {storeSettings?.phone && (
                <a href={`https://wa.me/${storeSettings.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Newsletter */}
          <div className="footer-col newsletter-col">
            <h4>STAY IN THE LOOP</h4>
            <p>Subscribe to get updates on new arrivals, exclusive offers and style inspiration.</p>
            <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder="Enter your email address" required />
              <button type="submit">→</button>
            </form>
          </div>

          {/* Column 3: Quick Links */}
          <div className="footer-col links-col">
            <h4>QUICK LINKS</h4>
            <Link to="/shop">New Arrivals</Link>
            <Link to="/shop">Best Sellers</Link>
            <Link to="/track-order">Track Order</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>

          {/* Column 4: Customer Care */}
          <div className="footer-col links-col">
            <h4>CUSTOMER CARE</h4>
            <Link to="/our-story">Our Story</Link>
            <Link to="/shipping-policy">Shipping Policy</Link>
            <Link to="/return-policy">Return Policy</Link>
            <Link to="/contact-us">Contact Us</Link>
            <Link to="/size-guide">Size Guide</Link>
          </div>

          {/* Column 5: Contact Info */}
          <div className="footer-col contact-col">
            <h4>CONTACT US</h4>
            <div className="contact-item">
              <MapPin size={16} style={{flexShrink: 0}} />
              <span>{storeSettings?.address ? storeSettings.address : 'Bank Stop Chungi Amar Sidhu, Lahore, Pakistan'}</span>
            </div>
            <div className="contact-item">
              <Phone size={16} style={{flexShrink: 0}} />
              <span>{storeSettings?.phone ? storeSettings.phone : '+92 303 0443243'}</span>
            </div>
            <div className="contact-item">
              <Mail size={16} style={{flexShrink: 0}} />
              <span>{storeSettings?.email ? storeSettings.email : 'support@dualibas.com'}</span>
            </div>
            <div className="contact-item">
              <Clock size={16} style={{flexShrink: 0}} />
              <span>{storeSettings?.timing_text ? storeSettings.timing_text : 'Online 24/7'}</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-container">
            <div className="credits">
              Designed and Developed by <a href="https://portfolioarsajid.vercel.app/" target="_blank" rel="noopener noreferrer" className="developer-link">ABDUL REHMAN SAJID</a>
            </div>
            <div className="copyright">
              © 2026 DUA LIBAS. ALL RIGHTS RESERVED.
            </div>
            <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
