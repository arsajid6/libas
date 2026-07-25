import { BASE_URL, IMAGE_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import { ChevronDown, ChevronUp, Grid, LayoutGrid, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import './Shop.css';

const SORT_OPTIONS = [
  'Featured',
  'Most relevant',
  'Best selling',
  'Alphabetically, A-Z',
  'Alphabetically, Z-A',
  'Price, low to high',
  'Price, high to low',
  'Date, old to new',
  'Date, new to old'
];

const Shop = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  
  const [products, setProducts] = useState([]);
  
  // UI States
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isAvailOpen, setIsAvailOpen] = useState(false);
  const [gridView, setGridView] = useState('grid-5'); // 'grid-5' or 'grid-10'
  const [sortBy, setSortBy] = useState('Featured');
  
  // Filter States
  const [selectedAvailability, setSelectedAvailability] = useState('All');

  const sortRef = useRef(null);
  const availRef = useRef(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) setIsSortOpen(false);
      if (availRef.current && !availRef.current.contains(event.target)) setIsAvailOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let url = `${BASE_URL}/public/products`;
    if (category) {
      url += `?category=${category}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const mappedData = data.map(p => {
          const mappedImages = p.images?.map(img => img.image_url.startsWith('/uploads') ? `${IMAGE_BASE_URL}${img.image_url}` : img.image_url) || [];
          const totalStock = p.variants ? p.variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0) : 0;
          return {
            ...p,
            price: Number(p.sale_price) || Number(p.base_price),
            image: mappedImages.length > 0 ? mappedImages[0] : '',
            images: mappedImages,
            stock_quantity: totalStock,
            created_at: p.created_at || new Date().toISOString()
          };
        });
        setProducts(mappedData);
      })
      .catch(err => console.error("Error fetching products:", err));
  }, [category]);

  // Apply Filters
  let filteredProducts = products.filter(p => {
    const matchAvailability = selectedAvailability === 'All' || 
                              (selectedAvailability === 'In Stock' ? p.stock_quantity > 0 : p.stock_quantity === 0);
    return matchAvailability;
  });

  // Apply Sorting
  filteredProducts = filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'Alphabetically, A-Z': return a.name.localeCompare(b.name);
      case 'Alphabetically, Z-A': return b.name.localeCompare(a.name);
      case 'Price, low to high': return a.price - b.price;
      case 'Price, high to low': return b.price - a.price;
      case 'Date, old to new': return new Date(a.created_at) - new Date(b.created_at);
      case 'Date, new to old': return new Date(b.created_at) - new Date(a.created_at);
      default: return 0; 
    }
  });

  return (
    <div className="shop-page container py-8 mt-4">
      <div className="shop-header">
        <h1>{category ? category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Shop All'}</h1>
        <p>{category ? `Explore our exclusive ${category.split('-').join(' ')} range.` : 'Explore our complete range of minimalist garments.'}</p>
      </div>

      <div className="shop-toolbar-wrapper">
        <div className="shop-toolbar">
          <div className="toolbar-left">
            <div className="filter-dropdown" ref={availRef}>
              <button className="filter-toggle-btn" onClick={() => setIsAvailOpen(!isAvailOpen)}>
                Availability {isAvailOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isAvailOpen && (
                <div className="filter-dropdown-menu">
                  <div className="filter-options-list">
                    {['All', 'In Stock', 'Out of Stock'].map(avail => (
                      <label key={avail} className="filter-checkbox">
                        <input 
                          type="radio" 
                          name="availability"
                          checked={selectedAvailability === avail}
                          onChange={() => {
                            setSelectedAvailability(avail);
                            setIsAvailOpen(false);
                          }}
                        />
                        <span>{avail}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="toolbar-right">
            <span className="items-count">{filteredProducts.length} items</span>
            
            <div className="sort-dropdown-container" ref={sortRef}>
              <button className="sort-toggle-btn" onClick={() => setIsSortOpen(!isSortOpen)}>
                Sort {isSortOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {isSortOpen && (
                <div className="sort-dropdown-menu">
                  {SORT_OPTIONS.map(option => (
                    <button 
                      key={option} 
                      className={`sort-option ${sortBy === option ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(option);
                        setIsSortOpen(false);
                      }}
                    >
                      {sortBy === option && <Check size={16} className="check-icon" />}
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid-toggles">
              <button 
                className={`grid-btn ${gridView === 'grid-5' ? 'active' : ''}`}
                onClick={() => setGridView('grid-5')}
              >
                <Grid size={20} />
              </button>
              <button 
                className={`grid-btn ${gridView === 'grid-10' ? 'active' : ''}`}
                onClick={() => setGridView('grid-10')}
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="shop-layout">
        <main className="shop-grid-main">
          <div className={`products-grid ${gridView === 'grid-10' ? 'products-grid-10' : 'products-grid-5'}`}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="no-results">
              <p>No products match your selected filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
