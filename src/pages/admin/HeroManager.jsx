import { BASE_URL, IMAGE_BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Trash2, Upload, Plus } from 'lucide-react';

const HeroManager = () => {
  const [slides, setSlides] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await fetch(`${BASE_URL}/public/hero`);
      if (res.ok) {
        const data = await res.json();
        setSlides(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = error => reject(error);
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const base64 = await fileToBase64(file);
      const payload = {
        image_base64: base64,
        image_filename: file.name
      };

      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/hero`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchSlides();
      } else {
        alert('Failed to upload slide');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading slide');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hero slide?')) return;
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await fetch(`${BASE_URL}/admin/hero/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSlides();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Manage Hero Slider</h2>
        <div style={{ position: 'relative' }}>
          <button disabled={isUploading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> {isUploading ? 'Uploading...' : 'Add New Slide'}
          </button>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleUpload} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
          />
        </div>
      </div>

      <div className="admin-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {slides.length === 0 ? (
            <p style={{ color: '#64748b' }}>No slides found.</p>
          ) : (
            slides.map((slide, index) => (
              <div key={slide.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                <img 
                  src={slide.image_url.startsWith('/uploads') ? `${IMAGE_BASE_URL}${slide.image_url}` : slide.image_url} 
                  alt={`Slide ${index + 1}`} 
                  style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} 
                />
                <button 
                  onClick={() => handleDelete(slide.id)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroManager;
