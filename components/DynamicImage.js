'use client';
import { useState, useEffect, useMemo, useId } from 'react';

/**
 * FIDELITY ENGINE v7.20 - "CLEAN SLATE" 🚀
 * TOTAL REWRITE to break HMR cache collisions and fix "filterId" duplicate errors.
 */
export default function DynamicImage({ src, maskSrc, color, transform = { scale: 1, x: 0, y: 0 }, sceneSrc = '' }) {
  // 1. UNIQUE IDENTIFIERS (Standardized via React useId)
  const smartEraserId = useId().replace(/:/g, ''); // SVG-safe unique ID
  
  const [imageSource, setImageSource] = useState(null);
  const [maskSource, setMaskSource] = useState(null);
  const [sceneSource, setSceneSource] = useState(null);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false); // Reset error state on source change
    let sUrl = null, mUrl = null, scUrl = null;
    if (src) sUrl = typeof src === 'string' ? src : URL.createObjectURL(src);
    if (maskSrc) mUrl = typeof maskSrc === 'string' ? maskSrc : URL.createObjectURL(maskSrc);
    if (sceneSrc) scUrl = typeof sceneSrc === 'string' ? sceneSrc : URL.createObjectURL(sceneSrc);

    setImageSource(sUrl);
    setMaskSource(mUrl);
    setSceneSource(scUrl);

    return () => {
      if (sUrl && typeof src !== 'string') URL.revokeObjectURL(sUrl);
      if (mUrl && typeof maskSrc !== 'string') URL.revokeObjectURL(mUrl);
      if (scUrl && typeof sceneSrc !== 'string') URL.revokeObjectURL(scUrl);
    };
  }, [src, maskSrc, sceneSrc]);

  // 2. RENDERING LOGIC
  const isNeutral = !color || color.toLowerCase() === '#ffffff' || color.toLowerCase() === 'transparent';
  
  const baseStyles = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'contain', transformOrigin: 'center center',
    transform: `scale(${transform.scale}) translate(${transform.x}%, ${transform.y}%)`,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: hasError ? 0 : 1, // Hide if broken
  };

  const activeMask = maskSource ? `url(${maskSource})` : `url(${imageSource})`;
  const maskStyles = {
    ...baseStyles,
    maskImage: activeMask, WebkitMaskImage: activeMask,
    maskSize: 'contain', WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center', WebkitMaskPosition: 'center',
  };

  // Skip rendering if no valid source or error detected early
  if (!imageSource || imageSource.length < 5) {
    return (
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/images/backgrounds/marble-bg.png')", backgroundSize: 'cover' }} />
    );
  }

  return (
    <div 
      className="fidelity-v7.21-invulnerable" 
      key={imageSource} 
      style={{ 
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden', 
        borderRadius: 'inherit',
        background: "#f1f5f9 url('/images/backgrounds/marble-bg.png') center/cover no-repeat" 
      }}
    >
      {/* 1. OPTIONAL SCENE OVERRIDE */}
      {(sceneSource && !sceneSource.includes('uploads')) && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${sceneSource})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          zIndex: 1
        }} />
      )}

      {/* 2. ISOLATION ENGINE SVG (Active but hidden) */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg">
          <filter id={smartEraserId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1.5 -1.5 -1.5 1 3.5" result="iso" />
            <feGaussianBlur in="iso" stdDeviation="0.4" result="blur" />
            <feComposite in="iso" in2="blur" operator="over" />
          </filter>
        </svg>
      </div>

      {/* 3. PRODUCT STACK */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {/* BASE PHOTO (FILTERED) */}
        {!hasError && (
          <img 
            src={imageSource} 
            alt="" 
            onError={() => setHasError(true)}
            style={{ 
              ...baseStyles, 
              zIndex: 1, 
              filter: !maskSource ? `url(#${smartEraserId}) contrast(1.1) brightness(1.02)` : 'contrast(1.1) brightness(1.02)' 
            }} 
          />
        )}

        {/* LUMINA ENGINE (COLOR LAYERS) */}
        {(!isNeutral && !hasError) && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
             {/* 1. Neutralizer Pass */}
             <img 
                src={imageSource} 
                alt="" 
                onError={() => setHasError(true)}
                style={{ 
                  ...maskStyles, 
                  filter: !maskSource ? `url(#${smartEraserId}) grayscale(1) brightness(1.05) contrast(1.1)` : 'grayscale(1) brightness(1.05) contrast(1.1)', 
                  opacity: 1, 
                  zIndex: 3 
                }} 
             />
             
             {/* 2. Color Burn/Hue */}
             <div style={{ ...maskStyles, backgroundColor: color, mixBlendMode: 'color', opacity: 0.9, zIndex: 4 }} />
             
             {/* 3. Soft Volume */}
             <div style={{ ...maskStyles, backgroundColor: color, mixBlendMode: 'soft-light', opacity: 0.4, zIndex: 5 }} />

             {/* 4. Specular White Recovery */}
             <div style={{ 
                ...maskStyles, 
                backgroundImage: `url(${imageSource})`,
                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                mixBlendMode: 'screen', 
                opacity: 0.75, 
                filter: 'grayscale(1) contrast(4) brightness(0.95)', 
                zIndex: 6 
             }} />
          </div>
        )}
      </div>
    </div>
  );
}
