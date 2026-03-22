'use client';
import { useState, useEffect, useMemo } from 'react';

// Studio Staging Engine v6.1 - "The High-Performance Realism Standard"
// Optimized for: Instantaneous Color Swapping & Hardware-Accelerated Compositing.
export default function DynamicImage({ src, maskSrc, color, transform = { scale: 1, x: 0, y: 0 }, sceneSrc = '' }) {
  // 1. ALL HOOKS MUST BE AT THE TOP (Rules of Hooks)
  const filterId = useMemo(() => `smart-eraser-${Math.random().toString(36).substr(2, 9)}`, []);

  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [resolvedMask, setResolvedMask] = useState(null);
  const [resolvedScene, setResolvedScene] = useState(null);

  useEffect(() => {
    let srcUrl = null;
    let maskUrl = null;
    let sceneUrl = null;

    if (src) {
      if (typeof src === 'string') srcUrl = src;
      else srcUrl = URL.createObjectURL(src);
    }
    
    if (maskSrc) {
      if (typeof maskSrc === 'string') maskUrl = maskSrc;
      else maskUrl = URL.createObjectURL(maskSrc);
    }

    if (sceneSrc) {
      if (typeof sceneSrc === 'string') sceneUrl = sceneSrc;
      else sceneUrl = URL.createObjectURL(sceneSrc);
    }

    setResolvedSrc(srcUrl);
    setResolvedMask(maskUrl);
    setResolvedScene(sceneUrl);

    return () => {
      if (srcUrl && typeof src !== 'string') URL.revokeObjectURL(srcUrl);
      if (maskUrl && typeof maskSrc !== 'string') URL.revokeObjectURL(maskUrl);
      if (sceneUrl && typeof sceneSrc !== 'string') URL.revokeObjectURL(sceneUrl);
    };
  }, [src, maskSrc, sceneSrc]);

  // 2. CONDITIONAL RETURN AFTER HOOKS
  if (!resolvedSrc) return null;

  // ---------------------------------------------------------
  // COLORING ENGINE (v6.2 - "Direct GPU Integration")
  // ---------------------------------------------------------
  
  const commonStyles = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out, filter 0.2s ease-out',
    transformOrigin: 'center center',
    transform: `scale(${transform.scale}) translate(${transform.x}%, ${transform.y}%)`,
    willChange: 'transform, opacity, filter',
  };

  const maskUrl = resolvedMask ? `url(${resolvedMask})` : `url(${resolvedSrc})`;
  const containerMaskStyles = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    maskImage: maskUrl,
    WebkitMaskImage: maskUrl,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    zIndex: 10,
    pointerEvents: 'none',
    transformOrigin: 'center center',
    transform: `scale(${transform.scale}) translate(${transform.x}%, ${transform.y}%)`,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out',
    willChange: 'transform, opacity, mask-image',
  };

  const isDefaultColor = !color || color.toLowerCase() === '#ffffff' || color.toLowerCase() === 'transparent';

  return (
    <div 
      className="studio-staging-v7.5-stable" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        backgroundImage: resolvedScene ? `url(${resolvedScene})` : 'none',
        backgroundColor: resolvedScene ? 'transparent' : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 'inherit'
      }}
    >
      {/* SVG FILTER: Smart Background Eraser (v7.5) */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="
            1  0  0  0  0
            0  1  0  0  0
            0  0  1  0  0
            -1.5 -1.5 -1.5 1 3.5
          " />
        </filter>
      </svg>

      <div style={{
        ...containerMaskStyles,
        filter: !resolvedMask ? `url(#${filterId})` : 'none',
        mixBlendMode: (resolvedScene && !resolvedMask) ? 'multiply' : 'normal'
      }}>
        {/* 1. ORIGINAL BASE IMAGE */}
        <img 
          src={resolvedSrc} 
          alt="" 
          style={{ 
            ...commonStyles, 
            transform: 'none',
            zIndex: 1, 
            filter: 'contrast(1.08) saturate(1.05)' 
          }} 
        />

        {/* 2. DYNAMIC COLORING STACK (v7.5 Stable) */}
        {!isDefaultColor && (
          <>
            {/* A. Neutralization pass */}
            <img 
              src={resolvedSrc} 
              alt="" 
              style={{ 
                ...commonStyles,
                transform: 'none',
                filter: 'grayscale(1) brightness(1.1) contrast(0.9)', 
                opacity: 0.9,
                zIndex: 2
              }} 
            />

            {/* B. Main Hue Pass */}
            <div style={{ 
              position: 'absolute', inset: 0, 
              backgroundColor: color, 
              mixBlendMode: 'color', 
              opacity: 0.8,
              zIndex: 3,
            }} />

            {/* C. Soft-Light Polish */}
            <div style={{ 
              position: 'absolute', inset: 0, 
              backgroundColor: color, 
              mixBlendMode: 'soft-light', 
              opacity: 0.6,
              zIndex: 4,
            }} />
            
            {/* D. Specular Reflection Recovery (Final Gloss & Lid Protection) */}
            <div style={{ 
              position: 'absolute', inset: 0, 
              backgroundImage: `url(${resolvedSrc})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              mixBlendMode: 'screen', 
              opacity: 0.55, // Increased for better white-lid preservation
              filter: 'grayscale(1) contrast(5) brightness(0.8)',
              zIndex: 5
            }} />
          </>
        )}
      </div>
    </div>
  );
}
