'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicImage from './DynamicImage';
import Logo from './Logo';

export default function ProductCard({ product, onClick, isLightboxView = false, activeTransform = null, sceneSrc = '' }) {
  // Memoize types and colors for performance
  const availableTypes = useMemo(() => {
    const baseType = { name: 'Original', image: product.image, maskImage: product.maskImage };
    const customTypes = product.types && product.types.length > 0 
      ? product.types.filter(t => t !== null).map(t => ({
          name: typeof t === 'string' ? t : (t?.name || ''),
          image: typeof t === 'string' ? (product.image || '') : (t?.image || product.image || ''),
          maskImage: typeof t === 'string' ? (product.maskImage || null) : (t?.maskImage || null),
          baseHue: (typeof t === 'object' && t?.baseHue !== undefined) ? t.baseHue : product.baseHue, 
          imageTransform: (typeof t === 'object' && t?.imageTransform) ? t.imageTransform : (product.imageTransform || { scale: 1, x: 0, y: 0 })
        }))
      : [];
    
    // If there are custom types, we show the original + those types
    const baseTypeWithMetadata = { 
      name: 'Original', 
      image: product.image,
      maskImage: product.maskImage,
      baseHue: product.baseHue,
      imageTransform: product.imageTransform || { scale: 1, x: 0, y: 0 }
    };

    return customTypes.length > 0 ? [baseTypeWithMetadata, ...customTypes] : [baseTypeWithMetadata];
  }, [product.id, product.types, product.image, product.maskImage, product.baseHue, product.imageTransform]);
    
  const availableColors = useMemo(() => {
    return product.colors && product.colors.length > 0
      ? product.colors
      : [{ name: 'Blanco', hex: '#ffffff' }];
  }, [product.colors]);

  const [selectedType, setSelectedType] = useState(availableTypes[0]);
  const [selectedColor, setSelectedColor] = useState(availableColors[0]);

  // Reset selection and Preload alternate images for models
  useEffect(() => {
    setSelectedType(availableTypes[0]);
    setSelectedColor(availableColors[0]);

    // Preload model images to avoid loading stutters
    availableTypes.forEach(type => {
      if (type.image) {
        const img = new Image();
        img.src = type.image;
      }
    });
  }, [product.id, availableTypes, availableColors]);

  const cardStyles = isLightboxView ? {
    background: '#fcfcfc', // Off-white for better white-lid contrast
    borderRadius: '40px',
    boxShadow: '0 40px 100px rgba(0,0,0,0.18)',
    cursor: 'default',
    width: '100%',
    padding: 0,
    border: '1px solid rgba(0,0,0,0.08)'
  } : {
    background: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '40px',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 1
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
      style={{
        ...cardStyles,
        height: isLightboxView ? '100%' : 'auto'
      }}
    >
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        aspectRatio: isLightboxView ? 'unset' : '16/11', 
        flex: isLightboxView ? 1 : 'none',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: isLightboxView ? 'transparent' : `radial-gradient(circle at 50% 50%, ${selectedColor.hex}15 0%, transparent 70%)`,
        transition: 'background 0.8s ease',
        minHeight: isLightboxView ? '500px' : 'auto'
      }}>
        {/* Company Branding Watermark (Top-Left) */}
        <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 30, opacity: 0.35, pointerEvents: 'none' }}>
          <Logo size={18} color="#0047AB" />
        </div>

        {/* Studio Floor Line (Subtle grounding) */}
        <div style={{
          position: 'absolute',
          bottom: '22%',
          width: '70%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 50%, transparent 100%)',
          zIndex: 0
        }} />

        {/* Contact Shadow (Multiply blend for realistic feel on global background) */}
        <div style={{ 
          position: 'absolute', 
          bottom: '22%', 
          width: '45%', 
          height: '14px', 
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 80%)', 
          filter: 'blur(10px)', 
          borderRadius: '50%', 
          zIndex: 1, 
          opacity: 0.8, 
          transform: 'scaleY(0.7)',
          mixBlendMode: 'multiply' 
        }} />

        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          padding: isLightboxView ? '64px' : '0', // Add "air" around the product in detail view
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <DynamicImage 
            key={selectedType?.name || 'original'}
            color={selectedColor?.hex || '#ffffff'} 
            src={selectedType?.image || product.image} 
            maskSrc={selectedType?.maskImage || product.maskImage}
            transform={activeTransform || selectedType?.imageTransform || product.imageTransform}
            sceneSrc={product.sceneBackground || sceneSrc}
          />
        </div>
        
        {/* Decorative elements only in grid view */}
        {!isLightboxView && (
          <div style={{ position: 'absolute', bottom: '22px', left: '24px', right: '24px', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ maxWidth: '70%' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1b', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h3>
                
                {/* Variant Indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  {availableColors.length > 1 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {availableColors.slice(0, 3).map((c, i) => (
                        <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                      ))}
                      {availableColors.length > 3 && <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>+</span>}
                    </div>
                  )}
                  {availableTypes.length > 1 && (
                    <div style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {availableTypes.length} Modelos
                    </div>
                  )}
                </div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #c5a059 0%, #a38241 100%)', padding: '6px 14px', borderRadius: '12px', color: 'white', fontWeight: '900', fontSize: '15px', boxShadow: '0 8px 16px rgba(197, 160, 89, 0.2)', marginBottom: '4px' }}>
                Q{Number(product.price || 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Selection controls - only visible in Lightbox side panel */}
      {isLightboxView && (
        <div className="lightbox-details">
          <div className="lightbox-details-inner">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{product.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Product</span>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', verticalAlign: 'super', marginRight: '4px' }}>Q</span>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#c5a059' }}>{Number(product.price || 0).toFixed(2)}</span>
                </div>
              </div>
              
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.7', marginBottom: '40px' }}>
                Diseño exclusivo Perflo-Plast. Fabricado con materiales de alta resistencia, ideal para maximizar el estilo y funcionalidad de tus espacios.
              </p>

              {(product.types && product.types.length > 0) && (
                <div style={{ marginBottom: '48px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '4px', height: '12px', background: '#c5a059', borderRadius: '2px' }} />
                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Modelos Disponibles</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
                    <motion.button
                      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => { e.stopPropagation(); setSelectedType(availableTypes[0]); }}
                      style={{
                        padding: '16px 12px', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        background: selectedType?.name === 'Original' ? 'white' : '#f8fafc',
                        border: selectedType?.name === 'Original' ? '2.5px solid #c5a059' : '1px solid #e2e8f0',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                      }}
                    >
                       <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '14px', overflow: 'hidden', padding: '6px', border: '1px solid #f1f5f9' }}>
                          <img src={product.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                       </div>
                       <span style={{ fontSize: '11px', fontWeight: '900', color: selectedType?.name === 'Original' ? '#1e293b' : '#64748b' }}>Original</span>
                    </motion.button>
                    {availableTypes.slice(1).map((t, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => { e.stopPropagation(); setSelectedType(t); }}
                        style={{
                          padding: '16px 12px', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                          background: selectedType?.name === t.name ? 'white' : '#f8fafc',
                          border: selectedType?.name === t.name ? '2.5px solid #c5a059' : '1px solid #e2e8f0',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                        }}
                      >
                       <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '14px', overflow: 'hidden', padding: '6px', border: '1px solid #f1f5f9' }}>
                          <img src={t.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                       </div>
                       <span style={{ fontSize: '11px', fontWeight: '900', color: selectedType?.name === t.name ? '#1e293b' : '#64748b' }}>{t.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {(product.colors && product.colors.length > 0) && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '4px', height: '12px', background: '#c5a059', borderRadius: '2px' }} />
                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Paleta de Colores</h4>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {product.colors.map((c, idx) => (
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
                  </div>
                </div>
              )}
            </div>

            <div style={{ paddingTop: '40px', marginTop: '40px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ref: {product.id.slice(0, 8)}</div>
               <Logo size={32} color="#cbd5e1" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
