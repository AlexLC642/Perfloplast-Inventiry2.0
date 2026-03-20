'use client';
import { useState, useEffect, useMemo } from 'react';

// Studio Staging Engine v6.1 - "The High-Performance Realism Standard"
// Optimized for: Instantaneous Color Swapping & Hardware-Accelerated Compositing.
export default function DynamicImage({ src, maskSrc, color, transform = { scale: 1, x: 0, y: 0 }, sceneSrc = '' }) {
  // Memoize resolved URLs to avoid flickering and unnecessary effect cycles for static strings
  const resolvedSrc = useMemo(() => {
    if (!src) return null;
    if (typeof src === 'string') return src;
    try { return URL.createObjectURL(src); } catch (e) { return null; }
  }, [src]);

  const resolvedMask = useMemo(() => {
    if (!maskSrc) return null;
    if (typeof maskSrc === 'string') return maskSrc;
    try { return URL.createObjectURL(maskSrc); } catch (e) { return null; }
  }, [maskSrc]);

  // Cleanup blob URLs only if they were actually created
  useEffect(() => {
    return () => {
      if (src && typeof src !== 'string' && resolvedSrc) URL.revokeObjectURL(resolvedSrc);
      if (maskSrc && typeof maskSrc !== 'string' && resolvedMask) URL.revokeObjectURL(resolvedMask);
    };
  }, [src, maskSrc, resolvedSrc, resolvedMask]);

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
    <div className="studio-staging-v61" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'transparent' }}>
      
      {/* 0. GLOBAL SCENE BACKGROUND */}
      {sceneSrc && (
        <img src={sceneSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      )}

      {/* 1. ORIGINAL BASE IMAGE */}
      <img 
        src={resolvedSrc} 
        alt="" 
        style={{ 
          ...commonStyles, 
          zIndex: 1, 
          filter: 'contrast(1.02) saturate(0.98)' 
        }} 
      />

      {/* 2. DYNAMIC COLORING STACK */}
      {!isDefaultColor && (
        <div style={containerMaskStyles}>
          {/* A. Neutralization pass */}
          <img 
            src={resolvedSrc} 
            alt="" 
            style={{ 
              width: '100%', height: '100%', objectFit: 'contain',
              filter: 'grayscale(1) brightness(1.2) contrast(0.85)', 
              opacity: 1
            }} 
          />

          {/* B. Main Hue Pass (GPU accelerated) */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundColor: color, 
            mixBlendMode: 'color', 
            opacity: 0.9,
            zIndex: 11,
            transition: 'background-color 0.2s ease-out',
            willChange: 'background-color'
          }} />

          {/* C. Soft-Light Polish */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundColor: color, 
            mixBlendMode: 'soft-light', 
            opacity: 0.7,
            zIndex: 12,
            transition: 'background-color 0.2s ease-out',
            willChange: 'background-color'
          }} />

          {/* D. Multiply Depth */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundColor: color, 
            mixBlendMode: 'multiply', 
            opacity: 0.15,
            zIndex: 13,
            transition: 'background-color 0.2s ease-out',
            willChange: 'background-color'
          }} />
          
          {/* E. Specular Reflection Recovery */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: `url(${resolvedSrc})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'screen', 
            opacity: 0.35,
            filter: 'grayscale(1) contrast(5) brightness(0.6)',
            zIndex: 14
          }} />
        </div>
      )}
    </div>
  );
}
