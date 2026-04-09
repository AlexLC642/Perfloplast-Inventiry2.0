'use client';
import { useState, useEffect, useMemo, useId } from 'react';

/**
 * FIDELITY ENGINE v7.40 - "VIBRANT CORE" 🎨
 * RESTORED: Maximum plastic saturation and clean masking.
 * REMOVED: Specular recovery layers that caused "washed out" colors.
 */
export default function FidelityImage({ 
  src, 
  maskSrc, 
  color, 
  transform = { scale: 1, x: 0, y: 0 }, 
  sceneSrc = '', 
  isLightboxView = false,
  textureSrc = null,
  textureTransform = { scale: 1, x: 0, y: 0 },
  lumina = { brightness: 1, contrast: 1 }
}) {
  const smartEraserId = useId().replace(/:/g, '');
  
  const [imageSource, setImageSource] = useState(null);
  const [maskSource, setMaskSource] = useState(null);
  const [sceneSource, setSceneSource] = useState(null);
  const [textureSource, setTextureSource] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
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

  const safeColor = (typeof color === 'string') ? color : (color?.hex || 'transparent');
  const isNeutral = !safeColor || safeColor.toLowerCase() === '#ffffff' || safeColor.toLowerCase() === 'transparent';
  
  const baseStyles = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'contain', transformOrigin: 'center center',
    transform: `scale(${transform.scale}) translate(${transform.x}%, ${transform.y}%)`,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: hasError ? 0 : 1,
  };

  const optimizeUrl = (url, width = 1200) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
    if (url.includes('/upload/f_auto')) return url;
    return url.replace('/upload/', `/upload/f_auto,q_auto:good,w_${width},c_limit/`);
  };

  const optimizedSrc = useMemo(() => optimizeUrl(imageSource, isLightboxView ? 1600 : 1000), [imageSource, isLightboxView]);
  const optimizedMask = useMemo(() => optimizeUrl(maskSource, isLightboxView ? 1600 : 1000), [maskSource, isLightboxView]);
  const optimizedScene = useMemo(() => optimizeUrl(sceneSource, 1920), [sceneSource]);
  const optimizedTexture = useMemo(() => optimizeUrl(textureSource, 1000), [textureSource]);

  const effectiveImageSource = optimizedSrc || optimizedTexture;
  const activeMask = optimizedMask ? `url(${optimizedMask})` : (effectiveImageSource ? `url(${effectiveImageSource})` : null);
  
  const maskStyles = {
    ...baseStyles,
    maskImage: activeMask, WebkitMaskImage: activeMask,
    maskSize: 'contain', 
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center', 
    WebkitMaskPosition: 'center',
  };

  if (!effectiveImageSource || (typeof effectiveImageSource === 'string' && effectiveImageSource.length < 5)) {
    return (
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/images/backgrounds/marble-bg.png')", backgroundSize: 'cover' }} />
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', borderRadius: 'inherit', background: optimizedScene ? 'none' : "#f1f5f9 url('/images/backgrounds/marble-bg.png') center/cover no-repeat" }}>
      {optimizedScene && (
        <div style={{ position: 'absolute', inset: '-1px', backgroundImage: `url(${optimizedScene})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1 }} />
      )}

      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {(!hasError && optimizedSrc && !optimizedTexture) && (
          <img 
            src={optimizedSrc} 
            alt="" 
            loading="lazy"
            decoding="async"
            style={{ ...baseStyles, zIndex: 1, filter: 'contrast(1.05) brightness(1.02)' }} 
          />
        )}

        {((!isNeutral || optimizedTexture) && !hasError) && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
             {/* 1. Neutralizer (Deep Grayscale) */}
             {(optimizedSrc && !optimizedTexture) && (
              <img 
                src={optimizedSrc} 
                loading="lazy"
                decoding="async"
                style={{ ...maskStyles, filter: `grayscale(1) brightness(${1.0 * (lumina?.brightness || 1)}) contrast(${1.0 * (lumina?.contrast || 1)})`, zIndex: 3 }} 
              />
             )}
             
             {/* 2. Color/Texture */}
             <div style={{ ...maskStyles, backgroundColor: optimizedTexture ? 'transparent' : safeColor, mixBlendMode: optimizedTexture ? 'normal' : 'color', opacity: optimizedTexture ? 1 : 0.9, zIndex: 4 }}>
                {optimizedTexture && (
                   <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${optimizedTexture})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', transform: `scale(${textureTransform?.scale || 1}) translate(${textureTransform?.x || 0}%, ${textureTransform?.y || 0}%)` }} />
                )}
             </div>
             
             {/* 3. Soft Volume (High Saturation) */}
             {(!optimizedTexture) && (
              <div style={{ ...maskStyles, backgroundColor: safeColor, mixBlendMode: 'soft-light', opacity: optimizedMask ? 0.5 : 0.35, zIndex: 5 }} />
             )}

             {/* 4. Removed specular recovery - Relying 100% on Mask precision */}
          </div>
        )}
      </div>
    </div>
  );
}
