import React from 'react';

const SizeGuide = () => {
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', fontFamily: 'serif', color: 'var(--color-primary)', textAlign: 'center' }}>Size Guide</h1>
      
      <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '30px', textAlign: 'center' }}>
        Find your perfect fit. Our sizes are designed to fit the following body measurements.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '40px' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            <th style={{ padding: '15px' }}>Size</th>
            <th style={{ padding: '15px' }}>Chest (inches)</th>
            <th style={{ padding: '15px' }}>Waist (inches)</th>
            <th style={{ padding: '15px' }}>Hip (inches)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '15px', fontWeight: 'bold' }}>Small (S)</td>
            <td style={{ padding: '15px' }}>34 - 36</td>
            <td style={{ padding: '15px' }}>28 - 30</td>
            <td style={{ padding: '15px' }}>36 - 38</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '15px', fontWeight: 'bold' }}>Medium (M)</td>
            <td style={{ padding: '15px' }}>38 - 40</td>
            <td style={{ padding: '15px' }}>32 - 34</td>
            <td style={{ padding: '15px' }}>40 - 42</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '15px', fontWeight: 'bold' }}>Large (L)</td>
            <td style={{ padding: '15px' }}>42 - 44</td>
            <td style={{ padding: '15px' }}>36 - 38</td>
            <td style={{ padding: '15px' }}>44 - 46</td>
          </tr>
          <tr>
            <td style={{ padding: '15px', fontWeight: 'bold' }}>Extra Large (XL)</td>
            <td style={{ padding: '15px' }}>46 - 48</td>
            <td style={{ padding: '15px' }}>40 - 42</td>
            <td style={{ padding: '15px' }}>48 - 50</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SizeGuide;
