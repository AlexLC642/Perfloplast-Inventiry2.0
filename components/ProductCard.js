'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FidelityImage from './FidelityImage';
import Logo from './Logo';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function ProductCard({ product, onClick, isLightboxView = false, activeTransform = null, sceneSrc = '' }) {
  const availableTypes = useMemo(() => {
    const baseType = {
      name: 'Original',
      image: product.image,
      maskImage: product.maskImage,
      baseHue: product.baseHue,
      imageTransform: product.imageTransform || { scale: 1, x: 0, y: 0 },
      price: null,   // null = usar precio del producto
      colors: null,  // null = usar colores del producto
    };

    const customTypes = product.types && product.types.length > 0
      ? product.types.filter(t => t !== null).map(t => ({
          name: typeof t === 'string' ? t : (t?.name || ''),
          image: typeof t === 'string' ? (product.image || '') : (t?.image || product.image || ''),
          maskImage: typeof t === 'string' ? (product.maskImage || null) : (t?.maskImage || null),
          baseHue: (typeof t === 'object' && t?.baseHue !== undefined) ? t.baseHue : product.baseHue,
          imageTransform: (typeof t === 'object' && t?.imageTransform) ? t.imageTransform : (product.imageTransform || { scale: 1, x: 0, y: 0 }),
          lumina: (typeof t === 'object' && t?.lumina) ? t.lumina : product.lumina,
          // Independent price & colors per model
          price: (typeof t === 'object' && t?.price && t.price !== '') ? t.price : null,
          colors: (typeof t === 'object' && t?.colors && t.colors.length > 0) ? t.colors : null,
        }))
      : [];

    return customTypes.length > 0 ? [baseType, ...customTypes] : [baseType];
  }, [product.id, product.types, product.image, product.maskImage, product.baseHue, product.imageTransform]);

  const baseColors = useMemo(() => {
    return product.colors && product.colors.length > 0
      ? product.colors
      : [{ name: 'Blanco', hex: '#ffffff' }];
  }, [product.colors]);

  const [selectedType, setSelectedType] = useState(availableTypes[0]);
  const [selectedColor, setSelectedColor] = useState(baseColors[0]);

  // Derived: colors and price based on selected type
  const activeColors = selectedType?.colors || baseColors;
  const activePrice = selectedType?.price !== null && selectedType?.price !== undefined
    ? selectedType.price
    : product.price;

  // When type changes, reset color to first of that type's palette
  const handleTypeSelect = (t) => {
    setSelectedType(t);
    const cols = t.colors || baseColors;
    setSelectedColor(cols[0]);
  };

  useEffect(() => {
    setSelectedType(availableTypes[0]);
    setSelectedColor(baseColors[0]);
    availableTypes.forEach(type => {
      if (type.image) { const img = new Image(); img.src = type.image; }
    });
  }, [product.id]);

  const isMobile = useIsMobile();

  const cardStyles = isLightboxView ? {
    background: '#fcfcfc',
    borderRadius: isMobile ? '32px' : '40px',
    boxShadow: '0 40px 100px rgba(0,0,0,0.18)',
    cursor: 'default',
    width: '100%',
    padding: 0,
    border: '1px solid rgba(0,0,0,0.08)'
  } : {
    background: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: isMobile ? '24px' : '40px',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 1,
    minHeight: isMobile ? '160px' : '220px'
  };

  return (
    <motion.div
      layout={!isLightboxView}
      className={`product-card ${isLightboxView ? 'in-lightbox' : ''}`}
      onClick={!isLightboxView ? onClick : undefined}
      initial={!isLightboxView ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={!isLightboxView ? { y: -15, boxShadow: '0 40px 80px rgba(0,0,0,0.15)' } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ ...cardStyles, height: isLightboxView ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{
        position: 'relative', width: '100%',
        aspectRatio: isLightboxView ? 'unset' : (isMobile ? '1/1' : '16/11'),
        flex: isLightboxView ? 1 : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isLightboxView ? 'transparent' : `radial-gradient(circle at 50% 50%, ${selectedColor?.hex || '#fff'}15 0%, transparent 70%)`,
        transition: 'background 0.8s ease',
        minHeight: isLightboxView ? (isMobile ? '300px' : '500px') : 'auto',
        overflow: 'hidden'
      }}>
        {(!isMobile || isLightboxView) && (
          <div style={{ position: 'absolute', top: isMobile ? '20px' : '32px', left: isMobile ? '20px' : '32px', zIndex: 30, opacity: 0.15, pointerEvents: 'none' }}>
            <Logo size={isMobile ? 22 : 28} color="#0047AB" showIcon={false} />
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '22%', width: '70%', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 50%, transparent 100%)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '22%', width: '45%', height: '14px', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 80%)', filter: 'blur(10px)', borderRadius: '50%', zIndex: 1, opacity: 0.8, transform: 'scaleY(0.7)', mixBlendMode: 'multiply' }} />

        <div style={{ position: 'absolute', inset: 0, padding: isLightboxView ? (isMobile ? '40px' : '80px') : '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FidelityImage
            key={`${selectedType?.name || 'original'}-${selectedColor?.name || 'color'}`}
            color={selectedColor?.image ? 'transparent' : (selectedColor?.hex || '#ffffff')}
            src={selectedType?.image || product.image}
            maskSrc={selectedType?.maskImage || product.maskImage}
            textureSrc={selectedColor ? (selectedColor.file || selectedColor.image) : null}
            textureTransform={selectedColor ? (selectedColor.textureTransform || { scale: 1, x: 0, y: 0 }) : { scale: 1, x: 0, y: 0 }}
            transform={activeTransform || selectedType?.imageTransform || product.imageTransform}
            sceneSrc={product.sceneBackground || sceneSrc}
            lumina={selectedType?.lumina || product.lumina}
            isLightboxView={isLightboxView}
          />
        </div>

        {/* Card footer (non-lightbox) */}
        {!isLightboxView && (
          <div style={{ padding: isMobile ? '12px 14px 14px' : '16px 24px 24px', background: 'white', borderTop: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '14px' : '17px', fontWeight: '800', color: '#1a1a1b', letterSpacing: '-0.02em', flex: 1 }}>{product.name}</h3>
              <div style={{ background: 'linear-gradient(135deg, #c5a059 0%, #a38241 100%)', padding: '2px 8px', borderRadius: '8px', color: 'white', fontWeight: '900', fontSize: isMobile ? '11px' : '13px', boxShadow: '0 4px 10px rgba(197, 160, 89, 0.2)', flexShrink: 0 }}>
                Q{Number(activePrice || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeColors.length > 1 && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {activeColors.slice(0, 3).map((c, i) => (
                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                  ))}
                </div>
              )}
              {availableTypes.length > 1 && (
                <div style={{ background: '#f8fafc', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {availableTypes.length} Modelos
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox detail panel */}
      {isLightboxView && (
        <div className="lightbox-details">
          <div className="lightbox-details-inner">
            <div style={{ flex: 1 }}>
              {/* Title + Dynamic Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {(selectedType && selectedType.name !== 'Original') ? selectedType.name : product.name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Product</span>
                  </div>
                </div>
                {/* DYNAMIC PRICE — changes with model */}
                <motion.div
                  key={String(activePrice)}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#f8fafc', padding: '12px 20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', verticalAlign: 'super', marginRight: '4px' }}>Q</span>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#c5a059' }}>{Number(activePrice || 0).toFixed(2)}</span>
                </motion.div>
              </div>

              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.7', marginBottom: '40px' }}>
                Diseño exclusivo Perflo-Plast. Fabricado con materiales de alta resistencia, ideal para maximizar el estilo y funcionalidad de tus espacios.
              </p>

              {/* Models */}
              {(product.types && product.types.length > 0) && (
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '4px', height: '12px', background: '#c5a059', borderRadius: '2px' }} />
                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Modelos Disponibles</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '8px' }}>
                    {/* Base / Original */}
                    <motion.button
                      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => { e.stopPropagation(); handleTypeSelect(availableTypes[0]); }}
                      style={{
                        padding: '8px 4px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        background: selectedType?.name === 'Original' ? 'white' : '#f8fafc',
                        border: selectedType?.name === 'Original' ? '2px solid #c5a059' : '1px solid #e2e8f0',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', overflow: 'hidden', padding: '3px', border: '1px solid #f1f5f9' }}>
                        <img src={product.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: selectedType?.name === 'Original' ? '#1e293b' : '#64748b' }}>Original</span>
                    </motion.button>

                    {availableTypes.slice(1).map((t, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => { e.stopPropagation(); handleTypeSelect(t); }}
                        style={{
                          padding: '8px 4px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                          background: selectedType?.name === t.name ? 'white' : '#f8fafc',
                          border: selectedType?.name === t.name ? '2px solid #c5a059' : '1px solid #e2e8f0',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', overflow: 'hidden', padding: '3px', border: '1px solid #f1f5f9' }}>
                          {t.image
                            ? <img src={t.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', opacity: 0.3 }}>📦</div>
                          }
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: selectedType?.name === t.name ? '#1e293b' : '#64748b' }}>{t.name}</span>
                        {t.price && (
                          <span style={{ fontSize: '9px', fontWeight: '800', color: '#c5a059' }}>Q{Number(t.price).toFixed(2)}</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* DYNAMIC COLOR PALETTE — changes with model */}
              {activeColors.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '4px', height: '12px', background: '#c5a059', borderRadius: '2px' }} />
                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                      Paleta de Colores
                      {selectedType?.name && selectedType.name !== 'Original' && selectedType?.colors && (
                        <span style={{ marginLeft: '8px', color: '#c5a059', fontWeight: '700' }}>— {selectedType.name}</span>
                      )}
                    </h4>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedType?.name || 'base'}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
                    >
                      {activeColors.map((c, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.2, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); setSelectedColor(c); }}
                          style={{
                            width: '42px', height: '42px', borderRadius: '50%', background: c.hex, cursor: 'pointer',
                            border: selectedColor?.hex === c.hex ? '3px solid #c5a059' : '4px solid white',
                            boxShadow: selectedColor?.hex === c.hex ? '0 8px 20px ' + c.hex + '55' : '0 4px 12px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s'
                          }}
                          title={c.name}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div style={{ paddingTop: '40px', marginTop: '40px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ref: {product.id?.slice(0, 8)}</div>
              <Logo size={48} color="#cbd5e1" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
