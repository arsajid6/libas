import { BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

const CartDrawer = () => {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();
  const [shippingSettings, setShippingSettings] = useState(null);

  useEffect(() => {
    if (isCartOpen && !shippingSettings) {
      fetch(`${BASE_URL}/public/shipping`)
        .then(res => res.json())
        .then(data => setShippingSettings(data))
        .catch(err => console.error(err));
    }
  }, [isCartOpen, shippingSettings]);

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const cartTotalPKR = Math.round(cartTotal);
  
  let freeShippingAlert = null;
  if (shippingSettings && shippingSettings.free_shipping_enabled && cartTotalPKR > 0) {
    if (cartTotalPKR < shippingSettings.free_shipping_min) {
      const remaining = shippingSettings.free_shipping_min - cartTotalPKR;
      freeShippingAlert = (
        <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '10px', fontSize: '13px', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid #bbf7d0' }}>
          Add Rs. {remaining.toLocaleString()} more for Free Shipping!
        </div>
      );
    } else {
      freeShippingAlert = (
        <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '10px', fontSize: '13px', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid #bbf7d0' }}>
          You've unlocked Free Shipping! 🎉
        </div>
      );
    }
  }

  return (
    <div className="cart-overlay">
      <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}></div>
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-btn" onClick={() => setIsCartOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {freeShippingAlert}

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is currently empty.</p>
              <button className="btn-outline mt-4" onClick={() => { setIsCartOpen(false); navigate('/shop'); }}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <p className="cart-item-variant">{item.size && `Size: ${item.size}`} {item.color && `| Color: ${item.color}`}</p>
                    <p className="cart-item-price">Rs. {Math.round(item.price).toLocaleString()}</p>
                    
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(index, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(index, 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Subtotal</span>
              <span>Rs. {cartTotalPKR.toLocaleString()}</span>
            </div>
            <p className="cart-note">Shipping & taxes calculated at checkout</p>
            <button className="btn-primary checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CartDrawer;
