import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import GuestOrderTracking from './pages/GuestOrderTracking';

// Footer Pages
import OurStory from './pages/OurStory';
import ShippingPolicyPage from './pages/ShippingPolicyPage';
import ReturnPolicy from './pages/ReturnPolicy';
import ContactUs from './pages/ContactUs';
import SizeGuide from './pages/SizeGuide';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// Admin imports
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import ProductsManager from './pages/admin/ProductsManager';
import OrderTracker from './pages/admin/OrderTracker';
import ReviewsManage from './pages/admin/ReviewsManage';
import Settings from './pages/admin/Settings';
import AdminShipping from './pages/admin/AdminShipping';
import AdminCategoryPage from './pages/admin/AdminCategoryPage';
import HeroManager from './pages/admin/HeroManager';
import StockAlerts from './pages/admin/StockAlerts';
import AdminPayments from './pages/admin/AdminPayments';
import Backups from './pages/admin/Backups';
import SecurityLogs from './pages/admin/SecurityLogs';
import AuditLogs from './pages/admin/AuditLogs';

function Storefront() {
  return (
    <div className="app-container">
      <Header />
      <CartDrawer />
      <AuthModal />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Navigate to="/profile" state={{ tab: 'orders' }} />} />
          <Route path="/wishlist" element={<Navigate to="/profile" state={{ tab: 'wishlist' }} />} />
          <Route path="/track-order" element={<GuestOrderTracking />} />
          
          {/* Footer Pages */}
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id"}>
      <AuthProvider>
        <WishlistProvider>
          <Router>
          <ScrollToTop />
          <Routes>
            {/* Admin Login (No Sidebar Layout) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<OrderTracker />} />
              <Route path="products" element={<ProductsManager />} />
              <Route path="settings" element={<Settings />} />
              <Route path="shipping" element={<AdminShipping />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="backups" element={<Backups />} />
              <Route path="logs/security" element={<SecurityLogs />} />
              <Route path="logs/audit" element={<AuditLogs />} />
              <Route path="reviews" element={<ReviewsManage />} />
              <Route path="hero" element={<HeroManager />} />
              <Route path="stock-alerts" element={<StockAlerts />} />
              <Route path="pages/:pageName" element={<AdminCategoryPage />} />
            </Route>
            
            {/* Public Storefront Routes */}
            <Route path="/*" element={<Storefront />} />
          </Routes>
        </Router>
        </WishlistProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
