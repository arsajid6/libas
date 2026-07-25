import React from 'react';

const ReturnPolicy = () => {
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', fontFamily: 'serif', color: 'var(--color-primary)' }}>Return & Exchange Policy</h1>
      
      <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#555' }}>
        <h3 style={{ marginTop: '20px', color: '#333' }}>Returns</h3>
        <p>We accept returns within 7 days of delivery. The items must be unused, unwashed, and in their original packaging with all tags attached.</p>

        <h3 style={{ marginTop: '20px', color: '#333' }}>Exchanges</h3>
        <p>If you need a different size or color, we offer an easy exchange process. Please contact our support team within 7 days of receiving your order.</p>

        <h3 style={{ marginTop: '20px', color: '#333' }}>Refunds</h3>
        <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, the refund will be processed within 5-7 business days.</p>
        
        <h3 style={{ marginTop: '20px', color: '#333' }}>Non-Returnable Items</h3>
        <p>Sale items, accessories, and customized products are non-refundable and cannot be exchanged.</p>
      </div>
    </div>
  );
};

export default ReturnPolicy;
