import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product, quantity = 1, size = null, color = null) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.id === product.id && item.size === size && item.color === color
      );
      
      if (existingItemIndex > -1) {
        const newItems = [...prev];
        const existingItem = newItems[existingItemIndex];
        const requested = existingItem.quantity + quantity;
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: product.stock_quantity ? Math.min(requested, product.stock_quantity) : requested
        };
        return newItems;
      }
      const initialQuantity = product.stock_quantity ? Math.min(quantity, product.stock_quantity) : quantity;
      return [...prev, { ...product, quantity: initialQuantity, size, color }];
    });
  };

  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, delta) => {
    setCartItems(prev => {
      const newItems = [...prev];
      const existingItem = newItems[index];
      const maxStock = existingItem.stock_quantity;
      let newQty = existingItem.quantity + delta;
      if (maxStock !== undefined && maxStock !== null) {
        newQty = Math.min(newQty, maxStock);
      }
      newItems[index] = { ...existingItem, quantity: Math.max(1, newQty) };
      return newItems;
    });
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, updateQuantity, 
      isCartOpen, setIsCartOpen, cartTotal, cartCount, setCartItems
    }}>
      {children}
    </CartContext.Provider>
  );
};
