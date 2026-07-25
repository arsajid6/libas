import { BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';

const ContactUs = () => {
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
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
    fetchStoreSettings();
  }, []);

  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '60vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', fontFamily: 'serif', color: 'var(--color-primary)' }}>Contact Us</h1>
      <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '40px' }}>We'd love to hear from you. Reach out to us using the details below.</p>
      
      {storeSettings ? (
        <div style={{ display: 'grid', gap: '30px', textAlign: 'left', background: '#f9f9f9', padding: '40px', borderRadius: '12px' }}>
          <div>
            <h3 style={{ color: '#333', marginBottom: '5px' }}>Address</h3>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>{storeSettings.address}</p>
          </div>
          <div>
            <h3 style={{ color: '#333', marginBottom: '5px' }}>Phone / WhatsApp</h3>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>{storeSettings.phone}</p>
          </div>
          <div>
            <h3 style={{ color: '#333', marginBottom: '5px' }}>Email</h3>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>{storeSettings.email}</p>
          </div>
          <div>
            <h3 style={{ color: '#333', marginBottom: '5px' }}>Business Hours</h3>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>{storeSettings.timing_text}</p>
          </div>
        </div>
      ) : (
        <p>Loading contact information...</p>
      )}
    </div>
  );
};

export default ContactUs;
