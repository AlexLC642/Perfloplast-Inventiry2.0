'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FidelityImage from '../../../components/FidelityImage';

export default function AdminDashboard({ params, searchParams }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [maskFile, setMaskFile] = useState(null);
  const [colors, setColors] = useState([]);
  const [types, setTypes] = useState([]);
  const [baseHue, setBaseHue] = useState(0);
  const [imageTransform, setImageTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  // Temp Color Fields
  const [tempColorName, setTempColorName] = useState('');
  const [tempColorHex, setTempColorHex] = useState('#000000');
  const [tempColorFile, setTempColorFile] = useState(null);
  const [productSceneFile, setProductSceneFile] = useState(null);
  const [tempType, setTempType] = useState('');
  const [tempTypeFile, setTempTypeFile] = useState(null);
  const [tempTypeMaskFile, setTempTypeMaskFile] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState('main'); // 'main' or index of type

  const [activeTab, setActiveTab] = useState('general'); // 'general', 'colors', 'types'
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Global Settings State
  const [settings, setSettings] = useState({ productSceneBackground: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [sceneFile, setSceneFile] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Professional Color Presets (Industry Standard Plastic)
  const PRESET_COLORS = [
    { name: 'Rojo Corporativo', hex: '#d32f2f' },
    { name: 'Azul Intenso', hex: '#1976d2' },
    { name: 'Verde Bosque', hex: '#388e3c' },
    { name: 'Naranja Vibrante', hex: '#f57c00' },
    { name: 'Cian Moderno', hex: '#00bcd4' },
    { name: 'Gris Carbón', hex: '#455a64' },
    { name: 'Amarillo Calma', hex: '#fbc02d' },
    { name: 'Púrpura Real', hex: '#7b1fa2' },
    { name: 'Negro Piano', hex: '#1a1a1a' },
    { name: 'Blanco Crema', hex: '#f5f5f5' }
  ];

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  };

  const validateFile = (file, type = 'image') => {
    if (!file) return false;
    
    // 1. Type Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('❌ Formato no permitido. Por favor sube una imagen JPG, PNG o WEBP.');
      return false;
    }

    // 2. Size Validation (4MB limit for Vercel/Next.js stability)
    const maxSize = 4.5 * 1024 * 1024; 
    if (file.size > maxSize) {
      alert(`⚠️ ARCHIVO MUY PESADO (${(file.size / (1024 * 1024)).toFixed(2)}MB)\n\nEl límite permitido es de 4.5MB por imagen. Por favor reduce el tamaño antes de subir.`);
      return false;
    }

    // 3. Dimension Suggestion (Async check)
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        if (img.width < 1280 || img.height < 720) {
          console.warn('Imagen de baja resolución detectada:', img.width, 'x', img.height);
          // Optional: We don't alert here to avoid annoying the user, 
          // but we could add a subtle UI hint later.
        }
        URL.revokeObjectURL(img.src);
      };
    }

    return true;
  };

  const generateAutoMask = async (sourceFile, setTargetMask) => {
    if (!validateFile(sourceFile)) return;
    const img = new Image();
    const url = URL.createObjectURL(sourceFile);
    img.src = url;
    await new Promise(resolve => img.onload = resolve);
    
    const canvas = document.createElement('canvas');
    const tempCanvas = document.createElement('canvas');
    canvas.width = tempCanvas.width = img.width;
    canvas.height = tempCanvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    const tctx = tempCanvas.getContext('2d');
    
    // 1. Draw original to temp
    tctx.drawImage(img, 0, 0);
    const imageData = tctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 2. Sample Background Color (Average of 4 corners)
    const getPixel = (x, y) => {
      const i = (y * canvas.width + x) * 4;
      return [data[i], data[i+1], data[i+2]];
    };
    const c1 = getPixel(2, 2);
    const c2 = getPixel(canvas.width - 3, 2);
    const c3 = getPixel(2, canvas.height - 3);
    const c4 = getPixel(canvas.width - 3, canvas.height - 3);
    
    const bg = [
      (c1[0] + c2[0] + c3[0] + c4[0]) / 4,
      (c1[1] + c2[1] + c3[1] + c4[1]) / 4,
      (c1[2] + c2[2] + c3[2] + c4[2]) / 4
    ];

    // 3. Process Mask (Euclidean Distance Removal)
    const threshold = 40; // Sensitivity
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const dist = Math.sqrt(
        Math.pow(r - bg[0], 2) + 
        Math.pow(g - bg[1], 2) + 
        Math.pow(b - bg[2], 2)
      );

      if (dist < threshold) {
        data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 0; // Transparent
      } else {
        data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 255; // Opaque
      }
    }
    
    // 4. Soft-Edge Pass (Feathering)
    tctx.putImageData(imageData, 0, 0);
    ctx.filter = 'blur(1.5px)'; // Soft feathering for professional blending
    ctx.drawImage(tempCanvas, 0, 0);
    
    canvas.toBlob((blob) => {
      const maskFile = new File([blob], "auto_mask_v3_premium.png", { type: "image/png" });
      setTargetMask(maskFile);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const openForm = (product = null) => {
    // ALWAYS clear file and temp states first to prevent pollution
    setFile(null);
    setMaskFile(null);
    setTempTypeFile(null);
    setTempTypeMaskFile(null);
    setTempType('');
    setTempColorName('');
    setTempColorHex('#000000');
    setAdjustTarget('main');
    setActiveTab('general');
    
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setPrice(product.price);
      setColors(product.colors || []);
      setTempColorFile(null); // Clear color file on open
      const formattedTypes = (product.types || []).map(t => ({
        name: typeof t === 'string' ? t : (t.name || ''),
        image: typeof t === 'string' ? (product.image || '') : (t.image || ''),
        baseHue: t.baseHue !== undefined ? t.baseHue : null,
        imageTransform: t.imageTransform || { scale: 1, x: 0, y: 0 }
      }));
      setTypes(formattedTypes);
      setBaseHue(product.baseHue || 0);
      setImageTransform(product.imageTransform || { scale: 1, x: 0, y: 0 });
      setProductSceneFile(null);
    } else {
      setEditingProduct(null);
      setName('');
      setPrice('');
      setColors([]);
      setTypes([]);
      setBaseHue(0);
      setImageTransform({ scale: 1, x: 0, y: 0 });
      setProductSceneFile(null);
    }
    setShowForm(true);
  };

  const confirmDelete = (id) => {
    setItemToDelete(id);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/products/${itemToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setShowConfirm(false);
        setItemToDelete(null);
        fetchProducts();
      } else {
        alert('Error al eliminar producto');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const processImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          // Resizing Logic: Max 1920px to stay within Vercel limits
          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const threshold = 240; 
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2];
            if (r > threshold && g > threshold && b > threshold) data[i+3] = 0;
          }
          ctx.putImageData(imageData, 0, 0);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".png", { type: 'image/png' }));
          }, 'image/png');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Mandatory Fields Validation
    if (!name.trim() || !price) {
      alert('⚠️ CAMPOS VACÍOS: Debes asignar un nombre y un precio al producto.');
      return;
    }

    setSaving(true);
    try {
      // 1. Upload Main Image
      let imageUrl = editingProduct ? editingProduct.image : '/images/chair.png';
      if (file) {
        const processedFile = await processImage(file);
        const formData = new FormData();
        formData.append('file', processedFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        
        if (!uploadRes.ok) {
          if (uploadRes.status === 413) {
            throw new Error('⚠️ IMAGEN DEMASIADO GRANDE: El archivo excede el límite permitido por el servidor (4.5MB).');
          }
          let upErr;
          try { upErr = await uploadRes.json(); } catch(e) { upErr = { error: 'Error inesperado en el servidor' }; }
          const errorMsg = upErr.instruction 
            ? `⚠️ ERROR: ${upErr.error}\n\nDETALLE: ${upErr.detail}\n\nINSTRUCCIÓN: ${upErr.instruction}`
            : upErr.error || 'Error al subir la imagen principal';
          throw new Error(errorMsg);
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // 2. Upload Main Mask if exists
      let maskUrl = editingProduct ? (editingProduct.maskImage || null) : null;
      if (maskFile) {
        const formData = new FormData();
        formData.append('file', maskFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          if (uploadRes.status === 413) throw new Error('⚠️ MÁSCARA DEMASIADO GRANDE: El archivo excede el límite (4.5MB).');
          let upErr;
          try { upErr = await uploadRes.json(); } catch(e) { upErr = { error: 'Error en servidor' }; }
          const errorMsg = upErr.instruction 
            ? `⚠️ ERROR DE MÁSCARA: ${upErr.error}\n\nDETALLE: ${upErr.detail}\n\nINSTRUCCIÓN: ${upErr.instruction}`
            : upErr.error || 'Error al subir la máscara';
          throw new Error(errorMsg);
        }
        const uploadData = await uploadRes.json();
        maskUrl = uploadData.url;
      }
      
      // 2.5 Upload Product-Specific Scene Background
      let productSceneUrl = editingProduct ? (editingProduct.sceneBackground || null) : null;
      if (productSceneFile) {
        const formData = new FormData();
        formData.append('file', productSceneFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const upErr = await uploadRes.json();
          const errorMsg = upErr.instruction 
            ? `⚠️ ERROR DE ESCENA: ${upErr.error}\n\nDETALLE: ${upErr.detail}\n\nINSTRUCCIÓN: ${upErr.instruction}`
            : upErr.error || 'Error al subir el fondo específico';
          throw new Error(errorMsg);
        }
        const uploadData = await uploadRes.json();
        productSceneUrl = uploadData.url;
      }

      // 3. Upload Color-Specific Images
      const finalColors = await Promise.all(colors.map(async (c) => {
        if (!c.file) return c; // Existing or hex-only
        try {
          const processedFile = await processImage(c.file);
          const formData = new FormData();
          formData.append('file', processedFile);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!uploadRes.ok) throw new Error('Error al subir foto de color');
          const data = await uploadRes.json();
          return { name: c.name, hex: c.hex, image: data.url };
        } catch (e) {
          console.error(e);
          return c;
        }
      }));

      // 4. Upload Type Images and save their individual settings
      const finalTypes = await Promise.all(types.map(async (t) => {
        let typeImageUrl = t.image || imageUrl;
        if (t.file) {
          try {
            const processedFile = await processImage(t.file);
            const formData = new FormData();
            formData.append('file', processedFile);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!uploadRes.ok) {
              const upErr = await uploadRes.json();
              throw new Error(upErr.instruction 
                ? `${upErr.error}: ${upErr.detail}` 
                : (upErr.error || 'Upload failed'));
            }
            const uploadData = await uploadRes.json();
            typeImageUrl = uploadData.url;
          } catch (error) {
            console.error('Error uploading type image:', error);
          }
        }

        let typeMaskUrl = t.maskImage || null;
        if (t.maskFile) {
          try {
            const formData = new FormData();
            formData.append('file', t.maskFile);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!uploadRes.ok) {
              const upErr = await uploadRes.json();
              throw new Error(upErr.instruction 
                ? `${upErr.error}: ${upErr.detail}` 
                : (upErr.error || 'Mask upload failed'));
            }
            const uploadData = await uploadRes.json();
            typeMaskUrl = uploadData.url;
          } catch (error) {
            console.error('Error uploading type mask:', error);
          }
        }

        return { 
          name: t.name, 
          image: typeImageUrl,
          maskImage: typeMaskUrl,
          baseHue: t.baseHue !== undefined ? t.baseHue : null,
          imageTransform: t.imageTransform || { scale: 1, x: 0, y: 0 }
        };
      }));

      const productData = { 
        name, 
        price, 
        image: imageUrl, 
        maskImage: maskUrl,
        colors: finalColors, 
        types: finalTypes,
        baseHue,
        imageTransform,
        sceneBackground: productSceneUrl
      };
      
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.instruction 
          ? `⚠️ ERROR: ${errorData.error}\n\nDETALLE: ${errorData.detail}\n\nINSTRUCCIÓN: ${errorData.instruction}`
          : errorData.error || 'Error en el servidor al guardar el producto';
        throw new Error(errorMsg);
      }

      setShowForm(false);
      setName(''); setPrice(''); setFile(null); setColors([]); setTypes([]);
      fetchProducts();
    } catch (err) {
      console.error('Final Submit Error:', err);
      const finalMsg = err.message.includes('⚠️') ? err.message : `⚠️ ERROR: ${err.message}`;
      alert(finalMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log('🔄 Click detectado en Guardar Escenario...');
    const isDev = window.location.hostname === 'localhost';
    console.log(`--- [${isDev ? 'DEV' : 'PROD'}] Guardado v7.22.2 ---`);
    
    // 1. Mandatory Validation
    if (!sceneFile && !settings?.productSceneBackground) {
      alert('⚠️ ESCENARIO VACÍO: Debes seleccionar una imagen de fondo antes de guardar.');
      setSavingSettings(false);
      return;
    }

    setSavingSettings(true);
    
    try {
      let sceneUrl = settings?.productSceneBackground || '';
      
      // 1. UPLOAD IMAGE
      if (sceneFile) {
        const formData = new FormData();
        formData.append('file', sceneFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        
        if (!uploadRes.ok) {
          const upErr = await uploadRes.json();
          const errorMsg = upErr.instruction 
            ? `⚠️ ERROR: ${upErr.error}\n\nDETALLE: ${upErr.detail}\n\nINSTRUCCIÓN: ${upErr.instruction}`
            : upErr.error || 'Error al subir el escenario';
          throw new Error(errorMsg);
        }
        const uploadData = await uploadRes.json();
        sceneUrl = uploadData.url;
      }

      // 2. PERSIST SETTINGS
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSceneBackground: sceneUrl }),
      });

      if (res.ok) {
        const updated = await res.json();
        // Handle MongoDB response structure ({ value: { ... } } or { ... })
        const finalSettings = updated.value || updated;
        setSettings(finalSettings);
        setShowSettings(false);
        setSceneFile(null);
        alert('✅ ¡Escenario global actualizado con éxito!');
        // Force refresh of current products to show the new background
        fetchProducts();
      } else {
        const errorData = await res.json();
        const errorMsg = errorData.instruction 
          ? `⚠️ ERROR: ${errorData.error}\n\nDETALLE: ${errorData.detail}\n\nINSTRUCCIÓN: ${errorData.instruction}`
          : errorData.error || 'Error al guardar los ajustes';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Settings Error:', err);
      // If the error message already has emoji/prefix, don't duplicate it
      const finalMsg = err.message.includes('⚠️') ? err.message : `⚠️ ERROR: ${err.message}`;
      alert(finalMsg);
    } finally {
      setSavingSettings(false);
    }
  };

  const addColor = () => {
    if (tempColorName && tempColorHex) {
      // Use name + hex + timestamp for uniqueness
      const newColor = { 
        id: Date.now(), 
        name: tempColorName, 
        hex: tempColorHex,
        file: tempColorFile // Add the file object
      };
      setColors([...colors, newColor]);
      setTempColorName('');
      setTempColorFile(null); // Reset file
      // Set to a different random color for next add to encourage changes
      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      setTempColorHex(randomColor);
    }
  };

  const addType = () => {
    if (tempType) {
      setTypes([...types, { 
        name: tempType, 
        file: tempTypeFile, 
        maskFile: tempTypeMaskFile,
        baseHue: null, 
        imageTransform: { scale: 1, x: 0, y: 0 } 
      }]);
      setTempType('');
      setTempTypeFile(null);
      setTempTypeMaskFile(null);
    }
  };

  const getActiveSettings = () => {
    if (adjustTarget === 'main' || !types[adjustTarget]) {
      return { 
        image: file || (editingProduct?.image || '/images/chair.png'), 
        maskImage: maskFile || (editingProduct?.maskImage || null),
        baseHue, 
        imageTransform,
        isMain: true
      };
    }
    const t = types[adjustTarget];
    return {
      image: t.file || (t.image || editingProduct?.image || '/images/chair.png'),
      maskImage: t.maskFile || (t.maskImage || null),
      baseHue: t.baseHue,
      imageTransform: t.imageTransform,
      isMain: false
    };
  };

  const updateActiveSettings = (updates) => {
    if (adjustTarget === 'main') {
      if (updates.baseHue !== undefined) setBaseHue(updates.baseHue);
      if (updates.imageTransform !== undefined) setImageTransform(updates.imageTransform);
    } else if (types[adjustTarget]) {
      const newTypes = [...types];
      if (updates.baseHue !== undefined) newTypes[adjustTarget].baseHue = updates.baseHue;
      if (updates.imageTransform !== undefined) newTypes[adjustTarget].imageTransform = updates.imageTransform;
      setTypes(newTypes);
    }
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      padding: '40px 24px',
      background: 'transparent'
    }}>
      <div className="container" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Navigation & Stats Header */}
        <header style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: isMobile ? '32px' : '48px',
          marginBottom: '48px'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            gap: isMobile ? '32px' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <motion.div 
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                style={{ 
                  background: 'linear-gradient(135deg, #1a1a1b 0%, #334155 100%)', 
                  borderRadius: '18px', 
                  width: '56px', 
                  height: '56px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.2)' 
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </motion.div>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '28px' : '48px', 
                  fontWeight: '900', 
                  fontFamily: 'var(--font-display)', 
                  letterSpacing: '-0.03em', 
                  color: '#0f172a' 
                }}>Inventario</h1>
                <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '10px', color: '#c5a059', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Gestión Premium</p>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px',
              width: isMobile ? '100%' : 'auto'
            }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSettings(true)}
                style={{ 
                  flex: isMobile ? 1 : 'none',
                  background: 'white', 
                  color: '#475569', 
                  border: '1px solid #e2e8f0', 
                  padding: '12px 20px', 
                  borderRadius: '16px', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                {isMobile ? 'Ajustes' : 'Ajustes de Escena'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openForm()}
                style={{ 
                  flex: isMobile ? 1 : 'none',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 28px', 
                  borderRadius: '16px', 
                  fontWeight: '800', 
                  cursor: 'pointer', 
                  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {isMobile ? 'Nuevo' : 'Nuevo Producto'}
              </motion.button>
            </div>
          </div>

          {/* Stats Summary Bar */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: isMobile ? '16px' : '24px' 
          }}>
            {[
              { 
                label: 'Catálogo Total', 
                value: products.length, 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, 
                color: '#0ea5e9',
                bg: 'rgba(14, 165, 233, 0.1)'
              },
              { 
                label: 'Variedad de Color', 
                value: products.reduce((acc, p) => acc + (p.colors?.length || 0), 0), 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1s-.4-.7-.4-1.1c0-.9.7-1.6 1.6-1.6H17c2.8 0 5-2.2 5-5 0-5.5-4.5-10-10-10z"/></svg>, 
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.1)'
              },
              { 
                label: 'Modelos Registrados', 
                value: products.reduce((acc, p) => acc + (p.types?.length || 0), 0), 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1-2.83-2.83l-3.94 3.6Z"/><path d="m3.1 20.9 4.83-4.83a.5.5 0 0 0 0-.7l-1.06-1.06a.5.5 0 0 1 0-.7l2.47-2.47a2 2 0 0 1 2.83 0l1.59 1.59a2 2 0 0 1 0 2.83l-2.47 2.47a.5.5 0 0 1-.7 0l-1.06-1.06a.5.5 0 0 0-.7 0L3.1 20.9a2 2 0 1 0 2.8 2.8l4.83-4.83"/><path d="m15 15 6 6"/><path d="m21 15-6 6"/></svg>, 
                color: '#8b5cf6',
                bg: 'rgba(139, 92, 246, 0.1)'
              },
              { 
                label: 'Estado Sistema', 
                value: 'Operativo', 
                icon: <div style={{ position: 'relative', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }} />
                         <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', zIndex: 1 }} />
                      </div>, 
                color: '#10b981',
                bg: 'rgba(16, 185, 129, 0.1)'
              }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.8)', 
                  backdropFilter: 'blur(40px)', 
                  padding: isMobile ? '16px' : '24px', 
                  borderRadius: isMobile ? '20px' : '28px', 
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '12px' : '20px',
                  boxShadow: '0 8px 30px -10px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background Accent */}
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '80px', height: '80px', background: stat.bg, borderRadius: '50%', filter: 'blur(30px)', opacity: 0.6, zIndex: 0 }} />
                
                <div style={{ 
                  width: isMobile ? '40px' : '56px', 
                  height: isMobile ? '40px' : '56px', 
                  borderRadius: isMobile ? '12px' : '16px', 
                  background: stat.bg, 
                  color: stat.color,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1,
                  flexShrink: 0
                }}>
                  {/* Scale icons for mobile */}
                  <div style={{ transform: isMobile ? 'scale(0.8)' : 'none' }}>
                    {stat.icon}
                  </div>
                </div>
                <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.label}</div>
                  <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    {stat.value}
                    {i < 3 && <span style={{ fontSize: isMobile ? '9px' : '12px', fontWeight: '700', color: '#cbd5e1' }}>ud.</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </header>

        {/* Product Grid */}
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(340px, 1fr))', 
          gap: isMobile ? '16px' : '32px' 
        }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', opacity: 0.5, fontFamily: 'var(--font-display)', fontWeight: '700' }}>
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
                Cargando inventario administrativo...
              </motion.div>
            </div>
          ) : (
            <AnimatePresence>
              {products.map((product, i) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -8 }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(30px)', 
                    WebkitBackdropFilter: 'blur(30px)',
                    borderRadius: isMobile ? '24px' : '32px', 
                    padding: isMobile ? '14px' : '24px',
                    border: '1px solid rgba(197, 160, 89, 0.1)',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    height: 'fit-content'
                  }}
                >
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: isMobile ? '1/1' : '16/10',
                      borderRadius: isMobile ? '16px' : '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: isMobile ? '12px' : '24px',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.05)',
                      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.02)'
                    }}>
                      <FidelityImage 
                        src={product.image} 
                        maskSrc={product.maskImage}
                        color="#ffffff"
                        transform={{
                          ...product.imageTransform,
                          scale: isMobile ? (product.imageTransform?.scale || 1) * 0.9 : (product.imageTransform?.scale || 1)
                        }}
                        sceneSrc={product.sceneBackground || settings.productSceneBackground}
                      />
                      <div style={{ position: 'absolute', top: isMobile ? '8px' : '16px', right: isMobile ? '8px' : '16px', display: 'flex', gap: isMobile ? '6px' : '8px', zIndex: 50 }}>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openForm(product)} 
                        style={{ background: 'white', border: 'none', width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', borderRadius: isMobile ? '10px' : '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,0,0,0.08)', color: '#c5a059' }}
                      >
                        <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => confirmDelete(product.id)} 
                        style={{ background: '#fef2f2', border: 'none', width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', borderRadius: isMobile ? '10px' : '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                      >
                        <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </motion.button>
                    </div>
                  </div>

                  <div style={{ padding: '0 4px' }}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: isMobile ? '8px' : '16px', gap: isMobile ? '4px' : '0' }}>
                      <h4 style={{ margin: 0, fontSize: isMobile ? '15px' : '20px', fontWeight: '800', color: '#1a1a1b', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{product.name}</h4>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #c5a059 0%, #a38241 100%)', 
                        padding: isMobile ? '2px 8px' : '6px 14px', 
                        borderRadius: isMobile ? '6px' : '12px', 
                        color: 'white', 
                        fontWeight: '900', 
                        fontSize: isMobile ? '12px' : '16px',
                        boxShadow: '0 4px 10px -2px rgba(197, 160, 89, 0.3)'
                      }}>
                        <span style={{ fontSize: isMobile ? '9px' : '11px', opacity: 0.8, marginRight: '2px' }}>Q</span>{product.price}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px', marginTop: isMobile ? '4px' : '12px' }}>
                      <div>
                        <div style={{ fontSize: isMobile ? '8px' : '10px', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: isMobile ? '4px' : '10px' }}>Variantes</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {product.colors?.slice(0, isMobile ? 4 : undefined).map((c, i) => (
                            <div key={i} title={c.name} style={{ width: isMobile ? '10px' : '14px', height: isMobile ? '10px' : '14px', borderRadius: '50%', background: c.hex, border: '1px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
                          ))}
                          {product.colors?.length > (isMobile ? 4 : 999) && <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>+{product.colors.length - 4}</span>}
                          {(!product.colors || product.colors.length === 0) && <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>Sin colores</span>}
                        </div>
                      </div>
                      {!isMobile && (
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '10px' }}>Modelos / Tipos</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {product.types?.map((t, i) => (
                              <span key={i} style={{ 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                padding: '4px 12px', 
                                borderRadius: '8px', 
                                background: 'rgba(197, 160, 89, 0.1)', 
                                color: '#a38241',
                                border: '1px solid rgba(197, 160, 89, 0.15)'
                              }}>{typeof t === 'string' ? t : (t?.name || "Modelo")}</span>
                            ))}
                            {(!product.types || product.types.length === 0) && <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Sin modelos</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </section>

        {/* Product Modal Form */}
        <AnimatePresence>
          {showForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '0' : '20px' }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} 
                style={{ 
                  background: 'white', 
                  borderRadius: isMobile ? '0' : '40px', 
                  maxWidth: '1240px', 
                  width: '100%', 
                  height: isMobile ? '100%' : 'auto',
                  maxHeight: isMobile ? '100%' : '92vh', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(255,255,255,0.8)', 
                  boxShadow: '0 40px 80px -15px rgba(15, 23, 42, 0.3)', 
                  display: 'flex', 
                  flexDirection: 'column' 
                }}
              >
                {/* Modal Header */}
                <div style={{ 
                  padding: isMobile ? '16px 20px' : '32px 48px', 
                  borderBottom: '1px solid #f1f5f9', 
                  display: 'flex', 
                  flexDirection: isMobile ? 'row' : 'row',
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  gap: '12px',
                  background: '#f8fafc',
                  position: 'sticky',
                  top: 0,
                  zIndex: 20
                }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: isMobile ? '16px' : '24px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                    </h3>
                    {!isMobile && <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Refactorización Premium — Configuración por etapas</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => setShowForm(false)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: isMobile ? '8px 12px' : '10px 16px', borderRadius: '12px', fontSize: isMobile ? '11px' : '13px', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}>Cerrar</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={saving} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', border: 'none', padding: isMobile ? '8px 16px' : '10px 24px', borderRadius: '12px', fontSize: isMobile ? '11px' : '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 16px rgba(15, 23, 42, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {saving ? '...' : 'Publicar'}
                    </motion.button>
                  </div>
                </div>
 
                {/* Mobile Navigation Tabs (Guaranteed Visibility) */}
                {isMobile && (
                  <div style={{ 
                    background: '#ffffff', 
                    borderBottom: '1px solid #e2e8f0',
                    padding: '10px 16px', 
                    display: 'flex', 
                    gap: '12px',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    zIndex: 50,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    flexShrink: 0
                  }}>
                    <style dangerouslySetInnerHTML={{ __html: `
                      .no-scrollbar::-webkit-scrollbar { display: none; }
                      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}} />
                    {[
                      { id: 'general', label: 'Información', icon: '📄' },
                      { id: 'colors', label: 'Colores', icon: '🎨' },
                      { id: 'types', label: 'Modelos', icon: '📦' }
                    ].map(tab => (
                      <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className="no-scrollbar"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '10px 16px', 
                          borderRadius: '12px', 
                          border: activeTab === tab.id ? '1px solid #c5a059' : '1px solid #f1f5f9', 
                          background: activeTab === tab.id ? 'rgba(197, 160, 89, 0.05)' : 'white', 
                          color: activeTab === tab.id ? '#c5a059' : '#64748b', 
                          fontSize: '13px', 
                          fontWeight: '800', 
                          cursor: 'pointer', 
                          flex: '0 0 auto',
                          transition: 'all 0.2s ease',
                          boxShadow: activeTab === tab.id ? '0 4px 10px rgba(197, 160, 89, 0.1)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '240px 1fr 380px', 
                  flex: 1, 
                  overflowY: isMobile ? 'auto' : 'hidden' 
                }}>
                  {/* Desktop Sidebar: Tabs (Hidden on mobile) */}
                  {!isMobile && (
                    <div style={{ 
                      background: '#f8fafc', 
                      borderRight: '1px solid #f1f5f9', 
                      padding: '32px 16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px'
                    }}>
                      {[
                        { id: 'general', label: 'Información General', icon: '📄' },
                        { id: 'colors', label: 'Paleta de Colores', icon: '🎨' },
                        { id: 'types', label: 'Modelos y Variantes', icon: '📦' }
                      ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '14px 20px', 
                          borderRadius: '14px', 
                          border: 'none', 
                          background: activeTab === tab.id ? 'white' : 'transparent', 
                          color: activeTab === tab.id ? '#1e293b' : '#64748b', 
                          fontSize: '13px', 
                          fontWeight: '800', 
                          cursor: 'pointer', 
                          transition: 'all 0.2s', 
                          boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                        }}>
                          <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Middle Area: Active Tab Content */}
                  <div style={{ padding: isMobile ? '20px' : '48px', overflowY: isMobile ? 'visible' : 'auto', background: 'white' }}>
                    <AnimatePresence mode="wait">
                      {activeTab === 'general' && (
                        <motion.div key="general" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '24px' : '32px' }}>
                          <h4 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.02em' }}>Configuración General</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre del Producto</label>
                              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto..." style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: '600', color: '#0f172a' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio Base (Q)</label>
                              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: '800', color: '#c5a059' }} />
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Imagen Representativa (PNG) — <span style={{ color: '#c5a059' }}>Máx 4.5MB</span></label>
                              <div style={{ position: 'relative', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '20px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <input 
                                  type="file" 
                                  accept="image/png,image/jpeg,image/webp" 
                                  onChange={(e) => {
                                    const f = e.target.files[0];
                                    if (validateFile(f)) setFile(f);
                                  }} 
                                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                                />
                                <div style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c5a059', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                  <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                </div>
                                <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: '700', color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file ? file.name : (editingProduct?.image ? editingProduct.image.split('/').pop() : 'Subir Imagen')}
                                </span>
                                {(file || editingProduct?.image) && (
                                  <button type="button" onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (file) setFile(null); 
                                    else setEditingProduct({...editingProduct, image: null});
                                  }} style={{ position: 'absolute', top: '12px', right: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', zIndex: 20, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)' }}>Eliminar</button>
                                )}
                              </div>
                            </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Máscara Alpha (Opcional)</label>
                                <div style={{ position: 'relative', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '20px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                  <input 
                                    type="file" 
                                    accept="image/png,image/jpeg,image/webp" 
                                    onChange={(e) => {
                                      const f = e.target.files[0];
                                      if (validateFile(f)) setMaskFile(f);
                                    }} 
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                                  />
                                  <div style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                  </div>
                                  <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: '700', color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {maskFile ? maskFile.name : (editingProduct?.maskImage ? editingProduct.maskImage.split('/').pop() : 'Subir Máscara')}
                                  </span>
                                  {(maskFile || editingProduct?.maskImage) && (
                                    <button type="button" onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (maskFile) setMaskFile(null); 
                                      else setEditingProduct({...editingProduct, maskImage: null});
                                    }} style={{ position: 'absolute', top: '12px', right: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', zIndex: 20, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)' }}>Eliminar</button>
                                  )}
                                </div>
                                {file && !maskFile && (
                                  <button type="button" onClick={() => generateAutoMask(file, setMaskFile)} style={{ marginTop: '12px', background: '#f1f5f9', color: '#444', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '14px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', alignSelf: 'center' }}>
                                    ✨ Generar Máscara Automática
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Per-Product Scene Background Override */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                              <div>
                                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>Escenario Personalizado — <span style={{ color: '#c5a059' }}>Máx 4.5MB</span></h4>
                                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '12px' }}>Imagen de fondo específica para este producto.</p>
                              </div>
                              <div style={{ position: 'relative', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '24px', textAlign: 'center', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <input 
                                  type="file" 
                                  accept="image/jpeg,image/png,image/webp" 
                                  onChange={(e) => {
                                    const f = e.target.files[0];
                                    if (validateFile(f)) setProductSceneFile(f);
                                  }} 
                                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                                />
                                <div style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c5a059' }}>
                                  <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                </div>
                                <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: '700', color: '#1e293b' }}>
                                  {productSceneFile ? productSceneFile.name : (editingProduct?.sceneBackground ? 'Cambiar escenario' : 'Subir fondo específico')}
                                </span>
                                {(productSceneFile || editingProduct?.sceneBackground) && (
                                  <button type="button" onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (productSceneFile) setProductSceneFile(null); 
                                    else setEditingProduct({...editingProduct, sceneBackground: null});
                                  }} style={{ position: 'absolute', top: '12px', right: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', zIndex: 20, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)' }}>Quitar</button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}

                      {activeTab === 'colors' && (
                        <motion.div key="colors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>Paleta de Colores</h4>
                          
                          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                              <input type="text" placeholder="Nombre (Ej: Azul Real)" value={tempColorName} onChange={(e) => setTempColorName(e.target.value)} style={{ flex: 1, minWidth: '180px', padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', border: '2px solid #cbd5e1', position: 'relative' }}>
                                  <input type="color" value={tempColorHex} onChange={(e) => setTempColorHex(e.target.value)} style={{ position: 'absolute', inset: '-5px', width: '150%', height: '150%', border: 'none', cursor: 'pointer' }} />
                                </div>

                                {/* New Color Image Upload Button */}
                                <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '14px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: tempColorFile ? '#f0f9ff' : 'white', overflow: 'hidden' }}>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const f = e.target.files[0];
                                      if (validateFile(f)) setTempColorFile(f);
                                    }} 
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                                  />
                                  {tempColorFile && tempColorFile instanceof Blob ? (
                                    <img src={URL.createObjectURL(tempColorFile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                  )}
                                  {tempColorFile && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setTempColorFile(null); }} style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', border: 'none', width: '16px', height: '16px', borderRadius: '50%', fontSize: '10px', cursor: 'pointer', zIndex: 20 }}>×</button>
                                  )}
                                </div>
                              </div>

                              <button type="button" onClick={addColor} style={{ width: '48px', height: '48px', background: '#c5a059', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                            </div>
                            
                            <div>
                              <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Sugerencias de Calidad</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {PRESET_COLORS.map(p => (
                                  <button key={p.hex} type="button" onClick={() => { setTempColorName(p.name); setTempColorHex(p.hex); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.hex }} />
                                    {p.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '24px', background: '#fffbeb', borderRadius: '24px', border: '1px solid #fde68a' }}>
                            {colors.length > 0 ? colors.map((c, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 16px', borderRadius: '14px', border: '1px solid #fef3c7', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', fontSize: '13px', fontWeight: '800' }}>
                                {/* Color-Specific Image Thumbnail */}
                                { (c.file || c.image) && (
                                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <img src={c.file && c.file instanceof Blob ? URL.createObjectURL(c.file) : c.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  </div>
                                )}
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: typeof c === 'object' ? c.hex : c, border: '1px solid rgba(0,0,0,0.1)' }} />
                                {typeof c === 'object' ? c.name : ''}
                                <button type="button" onClick={() => setColors(colors.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'none', color: '#f87171', fontSize: '18px', cursor: 'pointer', marginLeft: '4px' }}>×</button>
                              </div>
                            )) : <p style={{ margin: 0, fontSize: '14px', color: '#92400e', fontStyle: 'italic' }}>No has añadido colores aún.</p>}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'types' && (
                        <motion.div key="types" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>Modelos y Variantes</h4>
                          
                      <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <input type="text" placeholder="Ej: Con Tapa Rosca" value={tempType} onChange={(e) => setTempType(e.target.value)} style={{ flex: 1, padding: '18px 24px', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: '500', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} />
                          <button type="button" onClick={addType} style={{ padding: '0 32px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)', transition: 'all 0.3s ease' }}>Añadir Modelo</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px' }}>
                          {/* Model Photo Upload */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foto del Modelo</label>
                            <div style={{ position: 'relative', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '24px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' }}>
                              <input 
                                type="file" 
                                accept="image/png,image/jpeg,image/webp" 
                                onChange={(e) => {
                                  const f = e.target.files[0];
                                  if (validateFile(f)) setTempTypeFile(f);
                                }} 
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                                title="" 
                              />
                              <div style={{ width: '44px', height: '44px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c5a059' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tempTypeFile ? tempTypeFile.name : 'Seleccionar Foto'}
                              </span>
                              {tempTypeFile && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); setTempTypeFile(null); }} style={{ position: 'absolute', top: '12px', right: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', zIndex: 20 }}>Quitar</button>
                              )}
                            </div>
                          </div>

                          {/* Model Mask Upload */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Máscara (Opcional)</label>
                            <div style={{ position: 'relative', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '24px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' }}>
                              <input 
                                type="file" 
                                accept="image/png,image/jpeg,image/webp" 
                                onChange={(e) => {
                                  const f = e.target.files[0];
                                  if (validateFile(f)) setTempTypeMaskFile(f);
                                }} 
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                                title="" 
                              />
                              <div style={{ width: '44px', height: '44px', background: 'rgba(71, 85, 105, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tempTypeMaskFile ? tempTypeMaskFile.name : 'Seleccionar Máscara'}
                              </span>
                              {tempTypeMaskFile && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); setTempTypeMaskFile(null); }} style={{ position: 'absolute', top: '12px', right: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', zIndex: 20 }}>Quitar</button>
                              )}
                            </div>
                            {tempTypeFile && !tempTypeMaskFile && (
                              <button type="button" onClick={() => generateAutoMask(tempTypeFile, setTempTypeMaskFile)} style={{ background: '#f1f5f9', color: '#444', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', alignSelf: 'center', marginTop: '4px' }}>
                                ✨ Generar Máscara Automática
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modelos Registrados</p>
                            {types.length === 0 ? (
                              <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>No has añadido modelos aún.</p>
                              </div>
                            ) : types.map((t, i) => (
                              <div key={i} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: isMobile ? '12px' : '20px', 
                                padding: isMobile ? '12px' : '20px', 
                                background: adjustTarget === i ? '#f0f9ff' : 'white', 
                                borderRadius: isMobile ? '16px' : '24px', 
                                border: adjustTarget === i ? '2px solid #0ea5e9' : '1px solid #f1f5f9', 
                                boxShadow: adjustTarget === i ? '0 8px 10px -5px rgba(14, 165, 233, 0.1)' : '0 4px 12px rgba(0,0,0,0.02)'
                              }}>
                                <div style={{ width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px', background: 'white', borderRadius: isMobile ? '10px' : '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #f1f5f9', flexShrink: 0 }}>
                                  {(t.file || t.image) ? (
                                    <img src={t.file ? URL.createObjectURL(t.file) : t.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  ) : (
                                    <div style={{ opacity: 0.2, fontSize: isMobile ? '16px' : '24px' }}>📦</div>
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: isMobile ? '13px' : '15px', fontWeight: '800', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: (t.maskFile || t.maskImage) ? '#dcfce7' : '#f1f5f9', color: (t.maskFile || t.maskImage) ? '#166534' : '#64748b' }}>
                                      {(t.maskFile || t.maskImage) ? 'MÁSCARA' : 'SIN MÁSCARA'}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button type="button" onClick={() => setAdjustTarget(i)} style={{ padding: isMobile ? '8px 12px' : '10px 18px', borderRadius: '10px', background: adjustTarget === i ? '#0ea5e9' : 'white', color: adjustTarget === i ? 'white' : '#0ea5e9', border: '1px solid #0ea5e9', fontSize: isMobile ? '11px' : '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    Ajustar
                                  </button>
                                  <button type="button" onClick={() => setTypes(types.filter((_, idx) => idx !== i))} style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', borderRadius: '10px', background: '#fef2f2', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <svg width={isMobile ? "14" : "18"} height={isMobile ? "14" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right Sidebar: Live Preview */}
                  <div style={{ 
                    background: '#f8fafc', 
                    borderLeft: isMobile ? 'none' : '1px solid #f1f5f9', 
                    borderTop: isMobile ? '1px solid #f1f5f9' : 'none',
                    padding: isMobile ? '24px' : '32px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '24px', 
                    overflowY: isMobile ? 'visible' : 'auto'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e80' }} />
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Studio Preview Live</h4>
                    </div>
                    
                    <div style={{ width: '100%', aspectRatio: isMobile ? '16/10' : '16/11', flexShrink: 0, minHeight: isMobile ? '180px' : '220px', background: "#f1f5f9 url('/images/backgrounds/marble-bg.png') center/cover no-repeat", borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Watermark Logo (Sync with ProductCard) */}
                      <div style={{ position: 'absolute', top: isMobile ? '16px' : '24px', left: isMobile ? '16px' : '24px', zIndex: 5, opacity: 0.15, pointerEvents: 'none' }}>
                        <Logo size={isMobile ? 22 : 28} color="#0047AB" showIcon={false} />
                      </div>

                      {/* Studio Floor Line (Sync with ProductCard) */}
                      <div style={{ position: 'absolute', bottom: '22%', width: '70%', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 50%, transparent 100%)', zIndex: 0 }} />

                      {/* Contact Shadow (Sync with ProductCard) */}
                      <div style={{ position: 'absolute', bottom: '22%', width: '45%', height: '14px', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, transparent 80%)', filter: 'blur(8px)', borderRadius: '50%', zIndex: 1, opacity: 0.9, transform: 'scaleY(0.7)' }} />

                      <div style={{ transform: isMobile ? 'scale(0.7)' : 'none' }}>
                        <FidelityImage 
                          src={(colors.length > 0 && typeof colors[0] === 'object' && (colors[0].file || colors[0].image)) || getActiveSettings().image} 
                          maskSrc={(colors.length > 0 && typeof colors[0] === 'object' && (colors[0].file || colors[0].image)) ? null : (getActiveSettings().maskImage || (getActiveSettings().isMain ? editingProduct?.maskImage : types[adjustTarget]?.maskImage))}
                          color={(colors.length > 0 && typeof colors[0] === 'object' && (colors[0].file || colors[0].image)) ? 'transparent' : (colors.length > 0 ? (typeof colors[0] === 'object' ? colors[0].hex : colors[0]) : (editingProduct?.colors?.[0]?.hex || editingProduct?.colors?.[0] || 'transparent'))} 
                          baseHue={getActiveSettings().baseHue}
                          transform={getActiveSettings().imageTransform}
                          sceneSrc={productSceneFile || (editingProduct?.sceneBackground || (sceneFile || settings.productSceneBackground))}
                        />
                      </div>
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
                         <div style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#1e293b', padding: '4px 12px', borderRadius: '12px', fontSize: '9px', fontWeight: '900', border: '1px solid #e2e8f0', backdropFilter: 'blur(4px)' }}>
                           {getActiveSettings().isMain ? 'VISTA PRINCIPAL' : `MODELO: ${types[adjustTarget]?.name.toUpperCase()}`}
                         </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr', gap: '16px' }}>
                       {/* Universal Reset */}
                       <button 
                         onClick={() => updateActiveSettings({ imageTransform: { scale: 1, x: 0, y: 0 } })} 
                         style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '12px 20px', borderRadius: '16px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                       >
                         🔄 REESTABLECER AJUSTES
                       </button>

                       {/* Control Card: Scale */}
                       <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                           <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Escala</span>
                           <span style={{ fontSize: '12px', fontWeight: '900', color: '#c5a059' }}>{getActiveSettings().imageTransform.scale}x</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <input type="range" min="0.1" max="3" step="0.01" value={getActiveSettings().imageTransform.scale} onChange={(e) => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, scale: parseFloat(e.target.value)} })} style={{ width: '100%', accentColor: '#c5a059', height: '6px', cursor: 'pointer' }} />
                         </div>
                       </div>
                       
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                         {/* Control Card: X */}
                         <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                           <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '12px' }}>EJE X</span>
                           <input type="range" min="-100" max="100" value={getActiveSettings().imageTransform.x} onChange={(e) => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, x: parseInt(e.target.value)} })} style={{ width: '100%', accentColor: '#c5a059', height: '4px' }} />
                         </div>
                         {/* Control Card: Y */}
                         <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                           <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '12px' }}>EJE Y</span>
                           <input type="range" min="-100" max="100" value={getActiveSettings().imageTransform.y} onChange={(e) => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, y: parseInt(e.target.value)} })} style={{ width: '100%', accentColor: '#c5a059', height: '4px' }} />
                         </div>
                       </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.6', opacity: isMobile ? 0.7 : 1 }}>
                      Los ajustes se guardan por modelo.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showConfirm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                style={{ 
                  background: 'white', 
                  padding: '40px', 
                  borderRadius: '28px', 
                  maxWidth: '400px', 
                  width: '90%', 
                  textAlign: 'center', 
                  boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' 
                }}
              >
                <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>¿Eliminar producto?</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>Esta acción eliminará permanentemente el artículo del catálogo y del sistema de inventario.</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', color: '#475569' }}>Mantener</button>
                  <button onClick={handleDelete} style={{ flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>Eliminar</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: isMobile ? '0' : '20px' }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                style={{ 
                  background: 'white', 
                  borderRadius: isMobile ? '0' : '32px', 
                  maxWidth: '700px', 
                  width: '100%', 
                  height: isMobile ? '100%' : 'auto',
                  maxHeight: isMobile ? '100%' : '90vh',
                  padding: isMobile ? '24px' : '40px', 
                  boxShadow: '0 30px 60px rgba(0,0,0,0.2)', 
                  position: 'relative',
                  overflowY: 'auto'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div>
                    <h3 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Escenario Global</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Ambiente para todos los productos.</p>
                  </div>
                  <button onClick={() => setShowSettings(false)} style={{ border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* 1. Selector de Nuevo Fondo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Cargar Nuevo Fondo (Global)
                    </label>
                    <div style={{ 
                      position: 'relative', 
                      background: '#f8fafc', 
                      border: '2px dashed #cbd5e1', 
                      borderRadius: '24px', 
                      padding: '48px 24px', 
                      textAlign: 'center', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '12px', 
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden'
                    }}>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp" 
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (validateFile(f)) setSceneFile(f);
                        }} 
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                      />
                      
                      {sceneFile ? (
                        <div style={{ position: 'relative', zIndex: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                          <img src={URL.createObjectURL(sceneFile)} style={{ width: '200px', height: '100px', objectFit: 'cover', borderRadius: '14px', boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: '#006666' }}>✓ Imagen Seleccionada</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{sceneFile.name}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setSceneFile(null); }} style={{ background: 'white', border: '1px solid #fee2e2', padding: '10px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', color: '#ef4444' }}>Deseleccionar</button>
                        </div>
                      ) : (
                        <>
                          <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c5a059', boxShadow: '0 8px 16px rgba(0,0,0,0.06)' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>Haz clic o arrastra un archivo</span>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Recomendado: 1920x1080 o superior</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 2. Visualización de Fondo Almacenado (FORCE PREVIEW) */}
                  {(settings?.productSceneBackground || (!sceneFile && settings.productSceneBackground)) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '28px', background: '#f8fafc', borderRadius: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                          <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Escenario Actual en Producción</span>
                        </div>
                        <button 
                          onClick={() => setSettings({ ...settings, productSceneBackground: '' })} 
                          style={{ 
                            background: '#fee2e2', 
                            color: '#ef4444', 
                            border: 'none', 
                            padding: '10px 18px', 
                            borderRadius: '12px', 
                            fontSize: '11px', 
                            fontWeight: '900', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                          Eliminar Fondo
                        </button>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '160px', 
                        borderRadius: '20px', 
                        overflow: 'hidden', 
                        border: '4px solid white', 
                        boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                        position: 'relative',
                        background: '#e2e8f0'
                      }}>
                        <img 
                          src={settings.productSceneBackground || '/images/placeholder-bg.jpg'} 
                          alt="Current backdrop"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    </div>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSettingsSubmit}
                    disabled={savingSettings}
                    style={{ 
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                      color: 'white', 
                      border: 'none', 
                      padding: '22px', 
                      borderRadius: '24px', 
                      fontWeight: '900', 
                      fontSize: '16px', 
                      cursor: 'pointer', 
                      boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.4)', 
                      marginTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}
                  >
                    {savingSettings ? 'Procesando Escenario...' : 'Guardar y Publicar Escenario'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
