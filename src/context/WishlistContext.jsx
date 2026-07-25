import { BASE_URL } from '../config';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      setWishlistCount(0);
      return;
    }
    
    try {
      const res = await fetch(`${BASE_URL}/user/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data);
        setWishlistCount(data.length);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const addToWishlist = async (productId) => {
    if (!user) return false;
    try {
      const res = await fetch(`${BASE_URL}/user/wishlist/${productId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchWishlist();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return false;
    try {
      const res = await fetch(`${BASE_URL}/user/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchWishlist();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId || item.product_id === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
