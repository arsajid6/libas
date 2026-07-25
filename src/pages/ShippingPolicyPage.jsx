import { BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';

const ShippingPolicyPage = () => {
  const [shipping, setShipping] = useState(null);

  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const res = await fetch(`${BASE_URL}/public/shipping`);
        if (res.ok) {
          setShipping(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch shipping:', err);
      }
    };
    fetchShipping();
  }, []);

  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', fontFamily: 'serif', color: 'var(--color-primary)' }}>Shipping Policy</h1>
      
      <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#555' }}>
        <h3 style={{ marginTop: '20px', color: '#333' }}>Order Processing</h3>
        <p>All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.</p>

        <h3 style={{ marginTop: '20px', color: '#333' }}>Shipping Rates & Delivery Estimates</h3>
        {shipping ? (
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li>Standard Shipping Fee: Rs. {shipping.flat_rate}</li>
            {shipping.free_shipping_enabled && (
              <li>Free Shipping on orders over Rs. {shipping.free_shipping_min}</li>
            )}
            <li>Estimated Delivery Time: {shipping.delivery_time}</li>
            {shipping.cod_enabled && (
              <li>Cash on Delivery (COD) is available. {shipping.cod_fee > 0 ? `A COD fee of Rs. ${shipping.cod_fee} applies.` : ''}</li>
            )}
          </ul>
        ) : (
          <p>Loading shipping information...</p>
        )}

        <h3 style={{ marginTop: '20px', color: '#333' }}>Shipment Confirmation & Order Tracking</h3>
        <p>You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s).</p>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
