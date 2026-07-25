import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', fontFamily: 'serif', color: 'var(--color-primary)' }}>Privacy Policy</h1>
      
      <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#555' }}>
        <p>Your privacy is important to us. This policy outlines how DUA LIBAS collects, uses, and protects your personal information.</p>

        <h3 style={{ marginTop: '20px', color: '#333' }}>Information We Collect</h3>
        <p>We may collect personal information such as your name, email address, phone number, shipping address, and payment details when you place an order or create an account.</p>

        <h3 style={{ marginTop: '20px', color: '#333' }}>How We Use Your Information</h3>
        <p>The information we collect is used to process your orders, improve our website, and communicate with you about updates and offers.</p>

        <h3 style={{ marginTop: '20px', color: '#333' }}>Data Security</h3>
        <p>We implement a variety of security measures to maintain the safety of your personal information when you place an order.</p>
        
        <h3 style={{ marginTop: '20px', color: '#333' }}>Contacting Us</h3>
        <p>If there are any questions regarding this privacy policy, you may contact us using the information on our Contact Us page.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
