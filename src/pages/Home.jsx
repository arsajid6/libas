import { BASE_URL, IMAGE_BASE_URL } from '../config';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import './Home.css';

// Split layout: text on one side, model image clearly on the other

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/public/products?category=home`)
      .then(res => res.json())
      .then(data => {
        const mappedData = data.map(p => {
          const mappedImages = p.images?.map(img => img.image_url.startsWith('/uploads') ? `${IMAGE_BASE_URL}${img.image_url}` : img.image_url) || [];
          const totalStock = p.variants ? p.variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0) : 0;
          return {
            ...p,
            price: Number(p.sale_price) || Number(p.base_price),
            image: mappedImages.length > 0 ? mappedImages[0] : '',
            images: mappedImages,
            stock_quantity: totalStock,
            sizes: [...new Set(p.variants?.map(v => v.size).filter(Boolean))] || [],
            colors: [...new Set(p.variants?.map(v => v.color).filter(Boolean))] || []
          };
        });
        setProducts(mappedData);
      })
      .catch(err => console.error("Error fetching products:", err));

    fetch(`${BASE_URL}/public/hero`)
      .then(res => res.json())
      .then(data => setHeroSlides(data))
      .catch(err => console.error("Error fetching hero slides:", err));
  }, []);

  const categories = ['All', 'Ethnic', 'Fusion', 'Occasion', 'Saree', 'Formal', 'Semi-Formal'];

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  // Gallery: 8 detailed highlights (zoomed into embroidery/design details)
  const galleryHighlights = [
    { src: '/images/highlight_1.png' },
    { src: '/images/highlight_2.png' },
    { src: '/images/highlight_3.png' },
    { src: '/images/highlight_4.png' },
    { src: '/images/highlight_5.png' },
    { src: '/images/highlight_6.png' },
    { src: '/images/highlight_7.png' },
    { src: '/images/highlight_8.png' },
  ];

  // ── Auto-slide every 4.5s ──────────────────────────────────
  const goToSlide = useCallback((index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating]);

  const nextSlide = useCallback(() => {
    if (heroSlides.length <= 1) return;
    goToSlide((currentSlide + 1) % heroSlides.length);
  }, [currentSlide, goToSlide, heroSlides.length]);

  const prevSlide = useCallback(() => {
    if (heroSlides.length <= 1) return;
    goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
  }, [currentSlide, goToSlide, heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(nextSlide, 4500);
    return () => clearInterval(timer);
  }, [nextSlide, heroSlides.length]);

  return (
    <div className="home-page">

      {/* ===== HERO SLIDER ===== */}
      <section className="hero-slider">
        {/* Full-width image panel */}
        <div className="hero-image-panel">
          {heroSlides.length === 0 ? (
            <div style={{width:'100%', height:'100%', background:'#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
              <h2>Welcome to Dua Libas</h2>
            </div>
          ) : heroSlides.map((slide, idx) => (
            <img
              key={idx}
              src={slide.image_url.startsWith('/uploads') ? `${IMAGE_BASE_URL}${slide.image_url}` : slide.image_url}
              alt={`Dua Libas Banner ${idx + 1}`}
              className={`hero-full-img ${
                idx === currentSlide ? 'hero-full-img-active' : ''
              }`}
              style={{
                position: idx === 0 ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                zIndex: idx === currentSlide ? 1 : 0
              }}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          className="hero-arrow left"
          onClick={prevSlide}
          aria-label="Previous Slide"
        >
          <ChevronLeft />
        </button>
        <button
          className="hero-arrow right"
          onClick={nextSlide}
          aria-label="Next Slide"
        >
          <ChevronRight />
        </button>

        {/* Dots */}
        <div className="hero-dots">
          {heroSlides.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            ></span>
          ))}
        </div>
      </section>

      {/* ===== EXPLORE COLLECTIONS ===== */}
      <section className="collections-section">
        <h2 className="section-title">Explore our Collections</h2>
        <div className="collections-grid">
          <Link to="/shop" className="collection-block">
            <img src="/images/kurta3.png" alt="New Arrivals" />
            <div className="collection-label">New Arrivals</div>
          </Link>
          <Link to="/shop" className="collection-block collection-center">
            <img src="/images/collection_center.png" alt="Featured Collection" />
            <div className="collection-label">Featured</div>
          </Link>
          <Link to="/shop" className="collection-block">
            <img src="/images/kurta4.png" alt="Best Sellers" />
            <div className="collection-label">Best Sellers</div>
          </Link>
        </div>
      </section>

      {/* ===== ALL PRODUCTS ===== */}
      <section className="products-section">
        <h2 className="section-title">All Products</h2>

        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="products-grid-4">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="load-more-wrap">
          <Link to="/shop" className="load-more-btn">View All Products</Link>
        </div>
      </section>

      {/* ===== PROMO BANNER ===== */}
      <section className="promo-strip">
        <div className="promo-text-scroll">
          <span>Empowered Women, Empowered Fashion &nbsp;&nbsp;✦&nbsp;&nbsp; Empowered Women, Empowered Fashion &nbsp;&nbsp;✦&nbsp;&nbsp; Empowered Women, Empowered Fashion &nbsp;&nbsp;✦&nbsp;&nbsp; Empowered Women, Empowered Fashion &nbsp;&nbsp;✦&nbsp;&nbsp;</span>
        </div>
      </section>

      {/* ===== INSTAGRAM GALLERY / HIGHLIGHTS ===== */}
      <section className="gallery-section">
        <h2 className="section-title">Join the ranks of the fashion elite</h2>
        <p className="section-sub">Discover the intricate details of our handcrafted designs</p>
        <div className="gallery-single-image" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <img 
            src="/images/elite_details_collage.jpg" 
            alt="Fashion Elite Details Collage" 
            style={{ width: '100%', height: 'auto', borderRadius: '16px', display: 'block', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
          />
        </div>
      </section>

    </div>
  );
};

export default Home;
