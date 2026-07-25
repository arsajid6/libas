import React from 'react';
import { Link } from 'react-router-dom';
import './HeroBanner.css';

const HeroBanner = () => {
  return (
    <section className="hero-banner">
      <div className="hero-image-container">
        {/* We use the generated placeholder hero banner */}
        <img src="/images/hero.png" alt="Elegant Garments Collection" className="hero-img" />
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <h1 className="hero-title">Elegance<br/>Redefined</h1>
        <p className="hero-subtitle">Discover our new minimalist collection featuring premium fabrics and timeless silhouettes.</p>
        <Link to="/shop" className="btn-primary hero-btn">Explore Collection</Link>
      </div>
    </section>
  );
};

export default HeroBanner;
