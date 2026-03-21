'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import Logo from '../components/Logo';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);
  const [settings, setSettings] = useState({ productSceneBackground: '' });
  
  // Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedProductIndex === null) return;
      
      if (e.key === 'ArrowRight') nextProduct();
      if (e.key === 'ArrowLeft') prevProduct();
      if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProductIndex]); 

  const itemsPerPage = 8; 

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Failed to fetch settings:", err));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const paginatedProducts = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  const openLightbox = (product) => {
    const index = filteredProducts.findIndex(p => p.id === product.id);
    setSelectedProductIndex(index);
  };

  const closeLightbox = () => {
    setSelectedProductIndex(null);
  };

  const nextProduct = (e) => {
    e?.stopPropagation();
    if (selectedProductIndex < filteredProducts.length - 1) {
      setSelectedProductIndex(prev => prev + 1);
    } else {
      setSelectedProductIndex(0); 
    }
  };

  const prevProduct = (e) => {
    e?.stopPropagation();
    if (selectedProductIndex > 0) {
      setSelectedProductIndex(prev => prev - 1);
    } else {
      setSelectedProductIndex(filteredProducts.length - 1); 
    }
  };

  const selectedProduct = selectedProductIndex !== null ? filteredProducts[selectedProductIndex] : null;

  return (
    <main className="container" style={{ paddingBottom: '100px', position: 'relative' }}>
      <header className="catalog-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Logo size={56} />
        </div>

        <motion.a 
          href="/admin/login" 
          className="admin-access-btn" 
          title="Configuración / Admin"
          whileHover={{ rotate: 180, scale: 1.2, color: '#a38241' }}
          whileTap={{ scale: 0.9 }}
          style={{ 
            color: '#c5a059', 
            textDecoration: 'none',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V22a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </motion.a>
      </header>

      <section style={{ marginTop: '60px' }}>
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar productos por nombre..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Carousel Area */}
        <div style={{ position: 'relative', minHeight: '550px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', opacity: 0.5, padding: '100px 0', color: '#1a1a1b' }}>Cargando catálogo premium...</p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.5, padding: '100px 0', color: '#1a1a1b' }}>No se encontraron productos.</p>
          ) : (
            <>
              <motion.div 
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="product-grid"
              >
                <AnimatePresence mode="popLayout">
                  {paginatedProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      sceneSrc={settings.productSceneBackground}
                      onClick={() => openLightbox(product)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Navigation Controls */}
              {totalPages > 1 && (
                <div className="nav-controls">
                  <button 
                    onClick={prevPage} 
                    disabled={currentPage === 0}
                    className="nav-btn"
                    title="Anterior"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                    <span>{currentPage + 1}</span>
                    <span style={{ opacity: 0.4 }}>/</span>
                    <span>{totalPages}</span>
                  </div>
                  <button 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages - 1}
                    className="nav-btn"
                    title="Siguiente"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Lightbox Gallery Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay"
            onClick={closeLightbox}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="lightbox-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <ProductCard 
                product={selectedProduct} 
                isLightboxView={true} 
                sceneSrc={settings.productSceneBackground}
                key={`lightbox-${selectedProduct.id}`} 
              />
              
              <button 
                onClick={prevProduct}
                className="nav-btn lightbox-nav"
                style={{ position: 'absolute', left: '30px', top: '50%', transform: 'translateY(-50%)', zIndex: 3000, width: '56px', height: '56px' }}
                title="Anterior (←)"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
              
              <button 
                onClick={nextProduct}
                className="nav-btn lightbox-nav"
                style={{ position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)', zIndex: 3000, width: '56px', height: '56px' }}
                title="Siguiente (→)"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>

              <button 
                onClick={closeLightbox}
                style={{
                  position: 'absolute', top: '32px', left: '32px', background: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#64748b', zIndex: 3001
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="main-footer" style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.5, color: '#1a1a1b' }}>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>&copy; {new Date().getFullYear()} Perflo-Plast. Industria de Plástico.</span>
        </div>
      </footer>
    </main>
  );
}
