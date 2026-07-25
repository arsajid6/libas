import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import { ShoppingBag, X, Heart } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user, openAuthModal } = React.useContext(AuthContext);
  const { isInWishlist, addToWishlist, removeFromWishlist } = React.useContext(WishlistContext);
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || null);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null);
  const [quantity, setQuantity] = useState(1);

  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (product.stock_quantity > 0) {
      setSelectedSize(product.sizes?.[0] || null);
      setSelectedColor(product.colors?.[0] || null);
      setQuantity(1);
      setShowModal(true);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    setShowModal(false);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    setShowModal(false);
    navigate('/checkout');
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const hasSecondaryImage = product.images.length > 1;
  const wishlisted = isInWishlist(product.id);

  return (
    <div 
      className={`product-card-minimal ${hasSecondaryImage ? 'has-secondary' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{ zIndex: showModal ? 9999 : 1, position: showModal ? 'relative' : 'static' }}
    >
      {/* ─── Main Image ─── */}
      <div className={`product-image-wrapper-minimal ${product.stock_quantity === 0 ? 'out-of-stock' : ''}`}>
        {product.isNew && <span className="product-badge">NEW</span>}
        {product.stock_quantity === 0 && <span className="product-badge" style={{ backgroundColor: '#ef4444', color: 'white', right: '12px', left: 'auto' }}>OUT OF STOCK</span>}

        <button 
          onClick={handleWishlistToggle}
          style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
        >
          <Heart size={18} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : '#64748b'} />
        </button>

        <img
          src={product.images[0]}
          alt={product.name}
          className="product-img-minimal primary"
        />
        
        {hasSecondaryImage && (
          <img
            src={product.images[1]}
            alt={`${product.name} hover`}
            className="product-img-minimal secondary"
          />
        )}

        {/* ─── Hover Overlay: Add to Cart ─── */}
        <div className={`product-hover-overlay ${isHovered ? 'visible' : ''}`}>
          <button 
            className="quick-add-btn-minimal" 
            onClick={handleQuickAddClick}
            disabled={product.stock_quantity === 0}
            style={{ opacity: product.stock_quantity === 0 ? 0.5 : 1, cursor: product.stock_quantity === 0 ? 'not-allowed' : 'pointer' }}
          >
            <ShoppingBag size={16} /> Add
          </button>
        </div>
      </div>

      {/* ─── Product Info ─── */}
      <div className="product-info-minimal">
        <Link to={`/product/${product.id}`} onClick={(e) => e.stopPropagation()}>
          <h3 className="product-title-minimal">{product.name}</h3>
        </Link>
        <p style={{ margin: '4px 0', fontSize: '0.8rem', color: product.stock_quantity === 0 ? '#ef4444' : '#64748b' }}>
          {product.stock_quantity === 0 ? 'Out of Stock' : `Stock: ${product.stock_quantity}`}
        </p>
        <div className="product-price-minimal">
          {product.sale_price ? (
            <>
              <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '8px' }}>
                Rs. {Math.round(Number(product.base_price || product.price || 0)).toLocaleString()}
              </span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>
                Rs. {Math.round(Number(product.sale_price)).toLocaleString()}
              </span>
            </>
          ) : (
            <span>Rs. {Math.round(Number(product.base_price || product.price || 0)).toLocaleString()}</span>
          )}
        </div>
        {product.colors && product.colors.length > 1 && (
          <p className="product-variants-count">{product.colors.length} colors available</p>
        )}
      </div>
      {/* ─── Quick Add Modal ─── */}
      {showModal && createPortal(
        <div 
          className="quick-add-modal-overlay" 
          onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div 
            className="quick-add-modal-content" 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <button className="quick-add-modal-close" onClick={(e) => { e.stopPropagation(); setShowModal(false); }}>
              <X size={24} />
            </button>
            <img src={product.images[0]} alt={product.name} className="quick-add-modal-image" />
            <div className="quick-add-modal-info">
              <h2>{product.name}</h2>
              <p className="price">Rs. {Math.round(product.sale_price || product.base_price || product.price || 0).toLocaleString()} PKR</p>
              
              {product.sizes && product.sizes.length > 0 && (
                <>
                  <span className="quick-add-size-label">Size: {selectedSize}</span>
                  <div className="quick-add-size-selector">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        className={`quick-add-size-btn ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {product.colors && product.colors.length > 0 && (
                <>
                  <span className="quick-add-size-label">Color: {selectedColor}</span>
                  <div className="quick-add-size-selector" style={{ marginBottom: '24px' }}>
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        className={`quick-add-size-btn ${selectedColor === color ? 'active' : ''}`}
                        onClick={() => setSelectedColor(color)}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="quick-add-quantity">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>

              {(() => {
                let currentVariantStock = product.stock_quantity;
                if (product.variants && product.variants.length > 0) {
                  const matchedVariant = product.variants.find(v => 
                    (v.color || null) === (selectedColor || null) && 
                    (v.size || null) === (selectedSize || null)
                  );
                  currentVariantStock = matchedVariant ? Number(matchedVariant.stock_quantity) || 0 : 0;
                }
                
                return (
                  <div className="quick-add-actions">
                    <button 
                      className="btn-add-to-cart" 
                      onClick={handleAddToCart}
                      disabled={currentVariantStock === 0}
                      style={{ opacity: currentVariantStock === 0 ? 0.5 : 1, cursor: currentVariantStock === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      {currentVariantStock === 0 ? 'Out of Stock' : 'Add to cart'}
                    </button>
                    <button 
                      className="btn-buy-now" 
                      onClick={handleBuyNow}
                      disabled={currentVariantStock === 0}
                      style={{ opacity: currentVariantStock === 0 ? 0.5 : 1, cursor: currentVariantStock === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      {currentVariantStock === 0 ? 'Out of Stock' : 'Buy it now'}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default ProductCard;
