'use client';
import { useState, useEffect, useMemo, useId } from 'react';

/**
 * FIDELITY ENGINE v7.20 - "CLEAN SLATE" 🚀
 * TOTAL REWRITE to break HMR cache collisions and fix "filterId" duplicate errors.
 */
export default function FidelityImage({ 
  src, 
  maskSrc, 
  color, 
  transform = { scale: 1, x: 0, y: 0 }, 
  sceneSrc = '', 
  isLightboxView = false,
  textureSrc = null,
  textureTransform = { scale: 1, x: 0, y: 0 }
}) {
  useEffect(() => { console.log('🚀 FidelityEngine v7.27: Dynamic Image-Color Mode'); }, []);
  // 1. UNIQUE IDENTIFIERS (Standardized via React useId)
  const smartEraserId = useId().replace(/:/g, ''); // SVG-safe unique ID
  
  const [imageSource, setImageSource] = useState(null);
  const [maskSource, setMaskSource] = useState(null);
  const [sceneSource, setSceneSource] = useState(null);
  const [textureSource, setTextureSource] = useState(null);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false); // Reset error state on source change
    let sUrl = null, mUrl = null, scUrl = null, tUrl = null;
    if (src) sUrl = typeof src === 'string' ? src : URL.createObjectURL(src);
    if (maskSrc) mUrl = typeof maskSrc === 'string' ? maskSrc : URL.createObjectURL(maskSrc);
    if (sceneSrc) scUrl = typeof sceneSrc === 'string' ? sceneSrc : URL.createObjectURL(sceneSrc);
    if (textureSrc) tUrl = typeof textureSrc === 'string' ? textureSrc : (textureSrc instanceof Blob ? URL.createObjectURL(textureSrc) : null);

    setImageSource(sUrl);
    setMaskSource(mUrl);
    setSceneSource(scUrl);
    setTextureSource(tUrl);

    return () => {
      if (sUrl && typeof src !== 'string') URL.revokeObjectURL(sUrl);
      if (mUrl && typeof maskSrc !== 'string') URL.revokeObjectURL(mUrl);
      if (scUrl && typeof sceneSrc !== 'string') URL.revokeObjectURL(scUrl);
      if (tUrl && typeof textureSrc !== 'string') URL.revokeObjectURL(tUrl);
    };
  }, [src, maskSrc, sceneSrc, textureSrc]);

  // 2. RENDERING LOGIC - Ultra-defensive color check
  const safeColor = (typeof color === 'string') ? color : (color?.hex || 'transparent');
  const isNeutral = !safeColor || safeColor.toLowerCase() === '#ffffff' || safeColor.toLowerCase() === 'transparent';
  
  const baseStyles = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'contain', transformOrigin: 'center center',
    transform: `scale(${transform.scale}) translate(${transform.x}%, ${transform.y}%)`,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: hasError ? 0 : 1, // Hide if broken
  };

   const effectiveImageSource = imageSource || textureSource;
  const activeMask = maskSource ? `url(${maskSource})` : (effectiveImageSource ? `url(${effectiveImageSource})` : null);
    const texturePos = `${(textureTransform?.x || 0) + 50}% ${(textureTransform?.y || 0) + 50}%`;
  // Texture-specific styles (Mosaic/Repeat mode with custom scale)
  const textureStyles = textureSource ? {
    backgroundImage: `url(${textureSource})`,
    backgroundSize: `${(textureTransform?.scale || 1) * 100}%`,
    backgroundPosition: texturePos,
    backgroundRepeat: 'no-repeat' // Changed to no-repeat to behave like a photo, not a pattern
  } : {};

  const maskStyles = {
    ...baseStyles,
    maskImage: activeMask, WebkitMaskImage: activeMask,
    maskSize: 'contain', 
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center', 
    WebkitMaskPosition: 'center',
  };

   // Skip rendering if no valid source or error detected early
  if (!effectiveImageSource || (typeof effectiveImageSource === 'string' && effectiveImageSource.length < 5)) {
    return (
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/images/backgrounds/marble-bg.png')", backgroundSize: 'cover' }} />
    );
  }

  return (
    <div 
      className="fidelity-v7.21-invulnerable" 
      style={{ 
        position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', 
        borderRadius: 'inherit',
        background: sceneSource ? 'none' : "#f1f5f9 url('/images/backgrounds/marble-bg.png') center/cover no-repeat",
        transition: 'background 0.3s ease'
      }}
    >
      {/* 1. OPTIONAL SCENE OVERRIDE */}
      {sceneSource && (
        <div style={{
          position: 'absolute', inset: '-1px', // Slight negative inset to prevent sub-pixel gaps
          backgroundImage: `url(${sceneSource})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          mixBlendMode: 'normal',
          zIndex: 1,
          borderRadius: 'inherit'
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
         {(!hasError && imageSource && !textureSource) && (
          <img 
            src={imageSource} 
            alt="" 
            onError={() => setHasError(true)}
            style={{ 
              ...baseStyles, 
              zIndex: 1, 
              filter: 'contrast(1.1) brightness(1.02)',
              opacity: 1
            }} 
          />
        )}

        {/* LUMINA ENGINE (COLOR LAYERS) */}
        {((!isNeutral || textureSource) && !hasError) && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              {/* 1. Neutralizer Pass (Only if no texture) */}
               {(imageSource && !textureSource) && (
                <img 
                   src={imageSource} 
                   alt="" 
                   onError={() => setHasError(true)}
                   style={{ 
                     ...maskStyles, 
                     filter: 'grayscale(1) brightness(1.05) contrast(1.1)', 
                     opacity: 1, 
                     zIndex: 3 
                   }} 
                />
               )}
             
             {/* 2. Color Burn/Hue or Texture */}
             <div style={{ 
                ...maskStyles, 
                backgroundColor: textureSource ? 'transparent' : safeColor, 
                ...textureStyles,
                mixBlendMode: textureSource ? 'normal' : 'color', 
                opacity: textureSource ? 1 : (maskSource ? 0.9 : 0.82), 
                zIndex: 4 
             }} />
             
             {/* 3. Soft Volume Detail (Only if no texture) */}
             {(!textureSource) && (
              <div style={{ 
                 ...maskStyles, 
                 backgroundColor: safeColor, 
                 mixBlendMode: 'soft-light', 
                 opacity: maskSource ? 0.4 : 0.25, 
                 zIndex: 5 
              }} />
             )}

             {/* 4. Specular White Recovery (Only if main image and NO texture exists) */}
             {(imageSource && !textureSource) && (
              <div style={{ 
                 ...maskStyles, 
                 backgroundImage: `url(${imageSource})`,
                 backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                 mixBlendMode: 'screen', 
                 opacity: maskSource ? 0.75 : 0.45, 
                 filter: maskSource ? 'grayscale(1) contrast(4) brightness(0.95)' : 'grayscale(1) contrast(2.5) brightness(0.98)', 
                 zIndex: 6 
              }} />
             )}
          </div>
        )}
      </div>
    </div>
  );
}
