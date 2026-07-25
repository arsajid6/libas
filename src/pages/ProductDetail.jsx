import { BASE_URL, IMAGE_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import { ArrowLeft, ShoppingBag, Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import CustomerReviews from '../components/CustomerReviews';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, openAuthModal } = React.useContext(AuthContext);
  const { isInWishlist, addToWishlist, removeFromWishlist } = React.useContext(WishlistContext);
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetch(`${BASE_URL}/public/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        const mappedImages = data.images?.map(img => img.image_url.startsWith('/uploads') ? `${IMAGE_BASE_URL}${img.image_url}` : img.image_url) || [];
        const sizes = [...new Set(data.variants?.map(v => v.size).filter(Boolean))] || [];
        const colors = [...new Set(data.variants?.map(v => v.color).filter(Boolean))] || [];
        
        const mappedProduct = {
          ...data,
          price: Number(data.sale_price) || Number(data.base_price),
          image: mappedImages.length > 0 ? mappedImages[0] : '',
          images: mappedImages,
          sizes: sizes,
          colors: colors
        };
        
        setProduct(mappedProduct);
        setSelectedSize(sizes[0] || '');
        setSelectedColor(colors[0] || '');
        setIsLoading(false);

        // Fetch related products
        if (data.category) {
          fetch(`${BASE_URL}/public/products?category=${data.category}`)
            .then(res => res.json())
            .then(related => {
              const mappedRelated = related.map(p => {
                const mappedImages = p.images?.map(img => img.image_url.startsWith('/uploads') ? `${IMAGE_BASE_URL}${img.image_url}` : img.image_url) || [];
                return {
                  ...p,
                  price: Number(p.sale_price) || Number(p.base_price),
                  image: mappedImages.length > 0 ? mappedImages[0] : '',
                  images: mappedImages,
                  sizes: [...new Set(p.variants?.map(v => v.size).filter(Boolean))] || [],
                  colors: [...new Set(p.variants?.map(v => v.color).filter(Boolean))] || []
                };
              }).filter(p => p.id !== data.id); // Exclude current product
              setRelatedProducts(mappedRelated);
            })
            .catch(err => console.error("Error fetching related products:", err));
        }
      })
      .catch(err => {
        console.error("Error fetching product:", err);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return <div className="container py-8 mt-8 text-center">Loading product...</div>;
  }

  if (!product) {
    return <div className="container py-8 mt-8 text-center">Product not found</div>;
  }

  const handleAddToCart = () => {
    addToCart(product, 1, selectedSize, selectedColor);
  };

  const handleBuyNow = () => {
    addToCart(product, 1, selectedSize, selectedColor);
    navigate('/checkout');
  };

  let currentVariantStock = product.stock_quantity;
  if (product.variants && product.variants.length > 0) {
    const matchedVariant = product.variants.find(v => 
      (v.color || null) === (selectedColor || null) && 
      (v.size || null) === (selectedSize || null)
    );
    currentVariantStock = matchedVariant ? Number(matchedVariant.stock_quantity) || 0 : 0;
  }

  return (
    <div className="product-detail-page container py-8 mt-4">
      <button className="back-btn mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Back
      </button>

      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="main-image">
            <img src={product.images[activeImage]} alt={product.name} />
          </div>
          <div className="thumbnail-list">
            {product.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`${product.name} view ${idx + 1}`} 
                className={`thumbnail ${activeImage === idx ? 'active' : ''}`}
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>
        </div>

        <div className="product-info-panel">
          <h1 className="detail-title">{product.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <p className="detail-price" style={{ margin: 0 }}>Rs. {product.price.toLocaleString()}</p>
            <span style={{ 
              backgroundColor: currentVariantStock === 0 ? '#fee2e2' : '#f1f5f9', 
              color: currentVariantStock === 0 ? '#ef4444' : '#475569', 
              padding: '4px 12px', 
              borderRadius: '16px', 
              fontSize: '0.9rem', 
              fontWeight: '600' 
            }}>
              {currentVariantStock === 0 ? 'Out of Stock' : `${currentVariantStock} in stock`}
            </span>
          </div>
          
          <div className="detail-description">
            <p>{product.description}</p>
          </div>

          <div className="selection-group">
            <h4 className="selection-title">Color: <span>{selectedColor}</span></h4>
            <div className="color-options">
              {product.colors.map(color => (
                <button 
                  key={color}
                  className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="selection-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 className="selection-title">Size: <span>{selectedSize}</span></h4>
            </div>
            <div className="size-options">
              {product.sizes.map(size => (
                <button 
                  key={size}
                  className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <button 
              className="btn-primary add-to-cart-large" 
              onClick={handleAddToCart}
              disabled={currentVariantStock === 0}
              style={{ flex: 1, opacity: currentVariantStock === 0 ? 0.5 : 1, cursor: currentVariantStock === 0 ? 'not-allowed' : 'pointer' }}
            >
              <ShoppingBag size={20} /> {currentVariantStock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <button 
              onClick={async () => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                if (isInWishlist(product.id)) {
                  await removeFromWishlist(product.id);
                } else {
                  await addToWishlist(product.id);
                }
              }}
              style={{
                width: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Heart size={20} fill={isInWishlist(product.id) ? '#ef4444' : 'none'} color={isInWishlist(product.id) ? '#ef4444' : '#64748b'} />
            </button>
          </div>
          
          <div style={{ marginTop: '16px' }}>
             <button
                className="btn-primary"
                onClick={handleBuyNow}
                disabled={currentVariantStock === 0}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#000', 
                  color: '#fff', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  cursor: currentVariantStock === 0 ? 'not-allowed' : 'pointer', 
                  opacity: currentVariantStock === 0 ? 0.5 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600'
                }}
             >
                PROCEED TO CHECKOUT
             </button>
          </div>
          
          <div className="product-features mt-8">
            <div className="feature-item">
              <strong>Material</strong>
              <p>Premium imported fabrics</p>
            </div>
            <div className="feature-item">
              <strong>Shipping</strong>
              <p>Free standard shipping on orders over Rs. 5000</p>
            </div>
            <div className="feature-item">
              <strong>Returns</strong>
              <p>14-day return policy for unworn items</p>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <div style={{ marginTop: '80px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>You may also like</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            {relatedProducts.slice(0, 4).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div style={{ marginTop: '40px' }}>
        <CustomerReviews productId={product.id} />
      </div>
    </div>
  );
};

export default ProductDetail;
