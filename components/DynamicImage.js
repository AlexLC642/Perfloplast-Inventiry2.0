'use client';
import { useState, useEffect, useMemo } from 'react';

// Studio Staging Engine v6.1 - "The High-Performance Realism Standard"
// Optimized for: Instantaneous Color Swapping & Hardware-Accelerated Compositing.
export default function DynamicImage({ src, maskSrc, color, transform = { scale: 1, x: 0, y: 0 }, sceneSrc = '' }) {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [resolvedMask, setResolvedMask] = useState(null);
  const [resolvedScene, setResolvedScene] = useState(null);

  // Robust Blob URL Management (v6.4)
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

    // Cleanup: only revoke URLs we created (Blobs/Files)
    return () => {
      if (srcUrl && typeof src !== 'string') URL.revokeObjectURL(srcUrl);
      if (maskUrl && typeof maskSrc !== 'string') URL.revokeObjectURL(maskUrl);
      if (sceneUrl && typeof sceneSrc !== 'string') URL.revokeObjectURL(sceneUrl);
    };
  }, [src, maskSrc, sceneSrc]);

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
      {resolvedScene && (
        <img src={resolvedScene} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
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
