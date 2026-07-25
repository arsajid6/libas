import React from 'react';

const TermsOfService = () => {
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', fontFamily: 'serif', color: 'var(--color-primary)' }}>Terms of Service</h1>
      
      <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#555' }}>
        <p>Welcome to DUA LIBAS. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions.</p>

        <h3 style={{ marginTop: '20px', color: '#333' }}>1. General Conditions</h3>
        <p>We reserve the right to refuse service to anyone for any reason at any time. You agree not to reproduce, duplicate, copy, sell, or exploit any portion of the Service without express written permission by us.</p>

        <h3 style={{ marginTop: '20px', color: '#333' }}>2. Products and Pricing</h3>
        <p>Prices for our products are subject to change without notice. We reserve the right to modify or discontinue the Service (or any part or content thereof) without notice at any time.</p>

        <h3 style={{ marginTop: '20px', color: '#333' }}>3. Accuracy of Information</h3>
        <p>We are not responsible if information made available on this site is not accurate, complete, or current. The material on this site is provided for general information only.</p>
        
        <h3 style={{ marginTop: '20px', color: '#333' }}>4. Changes to Terms</h3>
        <p>You can review the most current version of the Terms of Service at any time on this page. We reserve the right to update, change or replace any part of these Terms of Service.</p>
      </div>
    </div>
  );
};

export default TermsOfService;
