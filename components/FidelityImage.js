'use client';
import { useState, useEffect, useMemo, useId } from 'react';

/**
 * FIDELITY ENGINE v7.30 - "STABLE RADIANCE" 🎨
 * RESTORED: Extreme vibrancy and balanced light protection.
 * FIXED: Removed global "nuke" filters that caused washed-out colors.
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

  const effectiveImageSource = imageSource || textureSource;
  const activeMask = maskSource ? `url(${maskSource})` : (effectiveImageSource ? `url(${effectiveImageSource})` : null);
  const texturePos = `${(textureTransform?.x || 0) + 50}% ${(textureTransform?.y || 0) + 50}%`;

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
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', borderRadius: 'inherit', background: sceneSource ? 'none' : "#f1f5f9 url('/images/backgrounds/marble-bg.png') center/cover no-repeat" }}>
      {sceneSource && (
        <div style={{ position: 'absolute', inset: '-1px', backgroundImage: `url(${sceneSource})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1 }} />
      )}

      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {(!hasError && imageSource && !textureSource) && (
          <img src={imageSource} alt="" style={{ ...baseStyles, zIndex: 1, filter: 'contrast(1.05) brightness(1.02)' }} />
        )}

        {((!isNeutral || textureSource) && !hasError) && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
             {/* 1. Neutralizer */}
             {(imageSource && !textureSource) && (
              <img 
                src={imageSource} 
                style={{ ...maskStyles, filter: `grayscale(1) brightness(${1.04 * (lumina?.brightness || 1)}) contrast(${1.08 * (lumina?.contrast || 1)})`, zIndex: 3 }} 
              />
             )}
             
             {/* 2. Color/Texture */}
             <div style={{ ...maskStyles, backgroundColor: textureSource ? 'transparent' : safeColor, mixBlendMode: textureSource ? 'normal' : 'color', opacity: textureSource ? 1 : 0.88, zIndex: 4 }}>
                {textureSource && (
                   <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${textureSource})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', transform: `scale(${textureTransform?.scale || 1}) translate(${textureTransform?.x || 0}%, ${textureTransform?.y || 0}%)` }} />
                )}
             </div>
             
             {/* 3. Volume (RESTORED SATURATION) */}
             {(!textureSource) && (
              <div style={{ ...maskStyles, backgroundColor: safeColor, mixBlendMode: 'soft-light', opacity: maskSource ? 0.45 : 0.32, zIndex: 5 }} />
             )}

             {/* 4. Natural Specular Recovery */}
             {(imageSource && !textureSource) && (
              <div style={{ 
                ...maskStyles, 
                backgroundImage: `url(${imageSource})`, 
                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                mixBlendMode: 'screen', 
                opacity: maskSource ? 0.72 : 0.42, 
                filter: `grayscale(1) contrast(${ (maskSource ? 4 : 2.5) * (lumina?.contrast || 1) }) brightness(1.0)`,
                zIndex: 6 
              }} />
             )}
          </div>
        )}
      </div>
    </div>
  );
}
