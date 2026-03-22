'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicImage from '../../../components/DynamicImage';

export default function AdminDashboard({ params, searchParams }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const generateAutoMask = async (sourceFile, setTargetMask) => {
    if (!sourceFile) return;
    const img = new Image();
    img.src = URL.createObjectURL(sourceFile);
    await new Promise(resolve => img.onload = resolve);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 10) continue; 
      
      // ZERO-BLEED NEUTRAL DETECTION: Precise separation of Lid vs Body
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min; // Represents how "Colorfull" the pixel is
      
      // Neutral check: White lids/labels have low RGB difference.
      // Colored plastic has high difference (e.g., Red or Blue dominant).
      if (diff < 50 && max > 125) { 
        data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 0; // Transparent (Protect)
      } else {
        data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 255; // Opaque (Color)
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => {
      const maskFile = new File([blob], "auto_mask_v3.png", { type: "image/png" });
      setTargetMask(maskFile);
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
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
    setSaving(true);
    try {
      // 1. Upload Main Image
      let imageUrl = editingProduct ? editingProduct.image : '/images/chair.png';
      if (file) {
        const processedFile = await processImage(file);
        const formData = new FormData();
        formData.append('file', processedFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // 2. Upload Main Mask if exists
      let maskUrl = editingProduct ? (editingProduct.maskImage || null) : null;
      if (maskFile) {
        const formData = new FormData();
        formData.append('file', maskFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        maskUrl = uploadData.url;
      }
      
      // 2.5 Upload Product-Specific Scene Background
      let productSceneUrl = editingProduct ? (editingProduct.sceneBackground || null) : null;
      if (productSceneFile) {
        const formData = new FormData();
        formData.append('file', productSceneFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        productSceneUrl = uploadData.url;
      }

      // 3. Upload Type Images and save their individual settings
      const finalTypes = await Promise.all(types.map(async (t) => {
        let typeImageUrl = t.image || imageUrl;
        if (t.file) {
          try {
            const processedFile = await processImage(t.file);
            const formData = new FormData();
            formData.append('file', processedFile);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Upload failed');
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
            if (!uploadRes.ok) throw new Error('Mask upload failed');
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
        colors, 
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
        throw new Error(errorData.message || 'Error en el servidor');
      }

      setShowForm(false);
      setName(''); setPrice(''); setFile(null); setColors([]); setTypes([]);
      fetchProducts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      let sceneUrl = settings.productSceneBackground;
      if (sceneFile) {
        const formData = new FormData();
        formData.append('file', sceneFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        sceneUrl = uploadData.url;
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSceneBackground: sceneUrl }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setShowSettings(false);
        setSceneFile(null);
      }
    } catch (err) {
      alert('Error al guardar ajustes');
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
        hex: tempColorHex 
      };
      setColors([...colors, newColor]);
      setTempColorName('');
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
          gap: '32px',
          marginBottom: '48px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <div className="header-text">
                <h1 style={{ 
                  fontFamily: 'var(--font-display)',
                  margin: 0, 
                  fontSize: '32px', 
                  fontWeight: '800', 
                  letterSpacing: '-0.03em', 
                  color: '#1a1a1b' 
                }}>Gestión de Inventario</h1>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '14px', color: '#c5a059', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Operaciones Premium</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSettings(true)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.8)', 
                  color: '#1e293b', 
                  border: '1px solid #e2e8f0', 
                  padding: '12px 24px', 
                  borderRadius: '16px', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  boxShadow: '0 10px 20px rgba(0,0,0,0.05)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '15px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Ajustes de Escena
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openForm()}
                style={{ 
                  background: 'linear-gradient(135deg, #c5a059 0%, #a38241 100%)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 28px', 
                  borderRadius: '16px', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  boxShadow: '0 15px 30px -8px rgba(197, 160, 89, 0.4)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '15px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo Producto
              </motion.button>
            </div>
          </div>

          {/* Stats Summary Bar */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '24px' 
          }}>
            {[
              { label: 'Total Productos', value: products.length, icon: '📦', color: '#c5a059' },
              { label: 'Con Colores', value: products.filter(p => p.colors?.length > 0).length, icon: '🎨', color: '#c5a059' },
              { label: 'Con Modelos', value: products.filter(p => p.types?.length > 0).length, icon: '📐', color: '#c5a059' },
              { label: 'Estado', value: 'Operativo', icon: '✨', color: '#2ecc71' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.7)', 
                  backdropFilter: 'blur(30px)', 
                  padding: '24px', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(197, 160, 89, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '14px', 
                  background: 'rgba(197, 160, 89, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1b', letterSpacing: '-0.02em' }}>{stat.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </header>

        {/* Product Grid */}
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
          gap: '32px' 
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
                    borderRadius: '32px', 
                    padding: '24px',
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
                      aspectRatio: '16/10',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.05)',
                      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.02)'
                    }}>
                      <DynamicImage 
                        src={product.image} 
                        maskSrc={product.maskImage}
                        color="#ffffff"
                        transform={product.imageTransform}
                        sceneSrc={product.sceneBackground || settings.productSceneBackground}
                      />
                      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 50 }}>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openForm(product)} 
                        style={{ background: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.08)', color: '#c5a059' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => confirmDelete(product.id)} 
                        style={{ background: '#fef2f2', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </motion.button>
                    </div>
                  </div>

                  <div style={{ padding: '0 4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1a1a1b', fontFamily: 'var(--font-display)' }}>{product.name}</h4>
                      <div style={{ 
                        background: 'linear-gradient(135deg, #c5a059 0%, #a38241 100%)', 
                        padding: '6px 14px', 
                        borderRadius: '12px', 
                        color: 'white', 
                        fontWeight: '800', 
                        fontSize: '16px',
                        boxShadow: '0 8px 16px -4px rgba(197, 160, 89, 0.3)'
                      }}>
                        <span style={{ fontSize: '11px', opacity: 0.8, marginRight: '2px' }}>Q</span>{product.price}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '10px' }}>Variantes de Color</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {product.colors?.map((c, i) => (
                            <div key={i} title={c.name} style={{ width: '14px', height: '14px', borderRadius: '50%', background: c.hex, border: '2px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
                          ))}
                          {(!product.colors || product.colors.length === 0) && <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Sin colores</span>}
                        </div>
                      </div>
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
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} 
                style={{ background: 'white', borderRadius: '40px', maxWidth: '1240px', width: '100%', maxHeight: '92vh', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 40px 80px -15px rgba(15, 23, 42, 0.3)', display: 'flex', flexDirection: 'column' }}
              >
                {/* Modal Header */}
                <div style={{ padding: '32px 48px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.04em' }}>
                      {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Refactorización Premium — Configuración por etapas</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setShowForm(false)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}>Cancelar</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={saving} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {saving ? 'Guardando...' : 'Publicar Cambios'}
                    </motion.button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 380px', flex: 1, overflow: 'hidden' }}>
                  {/* Left Sidebar: Tabs */}
                  <div style={{ background: '#f8fafc', borderRight: '1px solid #f1f5f9', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { id: 'general', label: 'Información General', icon: '📄' },
                      { id: 'colors', label: 'Paleta de Colores', icon: '🎨' },
                      { id: 'types', label: 'Modelos y Variantes', icon: '📦' }
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '14px', border: 'none', background: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#1e293b' : '#64748b', fontSize: '14px', fontWeight: '800', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
                        <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                    <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(197, 160, 89, 0.05)', borderRadius: '20px', border: '1px solid rgba(197, 160, 89, 0.1)' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#a38241', fontWeight: '700', textAlign: 'center' }}>Calidad de Catálogo Perflo-Plast</p>
                    </div>
                  </div>

                  {/* Middle Area: Active Tab Content */}
                  <div style={{ padding: '48px', overflowY: 'auto', background: 'white' }}>
                    <AnimatePresence mode="wait">
                      {activeTab === 'general' && (
                        <motion.div key="general" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>Configuración General</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Nombre del Producto</label>
                              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Pichel de 2 Litros" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '16px', fontSize: '15px', fontWeight: '500' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Precio Base (Q)</label>
                              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '16px', fontSize: '15px', fontWeight: '700' }} />
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Imagen Representativa (PNG)</label>
                              <div style={{ position: 'relative', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '20px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <input type="file" accept="image/png" onChange={(e) => setFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} />
                                <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c5a059', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file ? file.name : (editingProduct?.image ? editingProduct.image.split('/').pop() : 'Subir Imagen')}
                                </span>
                                {(file || editingProduct?.image) && (
                                  <button type="button" onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (file) setFile(null); 
                                    else setEditingProduct({...editingProduct, image: null});
                                  }} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', zIndex: 20 }}>Eliminar</button>
                                )}
                              </div>
                            </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Máscara Alpha (Opcional)</label>
                                <div style={{ position: 'relative', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '20px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                  <input type="file" accept="image/png" onChange={(e) => setMaskFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} />
                                  <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                  </div>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {maskFile ? maskFile.name : (editingProduct?.maskImage ? editingProduct.maskImage.split('/').pop() : 'Subir Máscara')}
                                  </span>
                                  {(maskFile || editingProduct?.maskImage) && (
                                    <button type="button" onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (maskFile) setMaskFile(null); 
                                      else setEditingProduct({...editingProduct, maskImage: null});
                                    }} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', zIndex: 20 }}>Eliminar</button>
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
                                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>Escenario Personalizado (Opcional)</h4>
                                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '12px' }}>Si subes una imagen aquí, este producto ignorará el fondo global.</p>
                              </div>
                              <div style={{ position: 'relative', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '24px', textAlign: 'center', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <input type="file" accept="image/*" onChange={(e) => setProductSceneFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} />
                                <div style={{ width: '40px', height: '40px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c5a059' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
                                  {productSceneFile ? productSceneFile.name : (editingProduct?.sceneBackground ? 'Cambiar fondo específico' : 'Subir fondo para este producto')}
                                </span>
                                {(productSceneFile || editingProduct?.sceneBackground) && (
                                  <button type="button" onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (productSceneFile) setProductSceneFile(null); 
                                    else setEditingProduct({...editingProduct, sceneBackground: null});
                                  }} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', zIndex: 20 }}>Quitar</button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}

                      {activeTab === 'colors' && (
                        <motion.div key="colors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>Paleta de Colores</h4>
                          
                          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <input type="text" placeholder="Nombre (Ej: Azul Real)" value={tempColorName} onChange={(e) => setTempColorName(e.target.value)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                              <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', border: '2px solid #cbd5e1', position: 'relative' }}>
                                <input type="color" value={tempColorHex} onChange={(e) => setTempColorHex(e.target.value)} style={{ position: 'absolute', inset: '-5px', width: '150%', height: '150%', border: 'none', cursor: 'pointer' }} />
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
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: c.hex }} />
                                {c.name}
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
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                          {/* Model Photo Upload */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foto del Modelo</label>
                            <div style={{ position: 'relative', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '24px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' }}>
                              <input type="file" accept="image/png" onChange={(e) => setTempTypeFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} title="" />
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
                              <input type="file" accept="image/png" onChange={(e) => setTempTypeMaskFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} title="" />
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
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: adjustTarget === i ? '#f0f9ff' : 'white', borderRadius: '24px', border: adjustTarget === i ? '2px solid #0ea5e9' : '1px solid #f1f5f9', boxShadow: adjustTarget === i ? '0 10px 20px rgba(14, 165, 233, 0.1)' : '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }}>
                                <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                  {(t.file || t.image) ? (
                                    <img src={t.file ? URL.createObjectURL(t.file) : t.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  ) : (
                                    <div style={{ opacity: 0.2 }}>📦</div>
                                  )}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{t.name}</p>
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: (t.maskFile || t.maskImage) ? '#dcfce7' : '#f1f5f9', color: (t.maskFile || t.maskImage) ? '#166534' : '#64748b' }}>
                                      {(t.maskFile || t.maskImage) ? 'MÁSCARA ACTIVA' : 'SIN MÁSCARA'}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button type="button" onClick={() => setAdjustTarget(i)} style={{ padding: '10px 18px', borderRadius: '12px', background: adjustTarget === i ? '#0ea5e9' : 'white', color: adjustTarget === i ? 'white' : '#0ea5e9', border: '1px solid #0ea5e9', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    Ajustar
                                  </button>
                                  <button type="button" onClick={() => setTypes(types.filter((_, idx) => idx !== i))} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
                  <div style={{ background: '#f8fafc', borderLeft: '1px solid #f1f5f9', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', maxHeight: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e80' }} />
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Studio Preview Live</h4>
                    </div>
                    
                    <div style={{ width: '100%', aspectRatio: '16/11', flexShrink: 0, minHeight: '220px', background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Studio Floor Line (Sync with ProductCard) */}
                      <div style={{ position: 'absolute', bottom: '22%', width: '70%', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 50%, transparent 100%)', zIndex: 0 }} />

                      {/* Contact Shadow (Sync with ProductCard) */}
                      <div style={{ position: 'absolute', bottom: '22%', width: '45%', height: '14px', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, transparent 80%)', filter: 'blur(8px)', borderRadius: '50%', zIndex: 1, opacity: 0.9, transform: 'scaleY(0.7)' }} />

                      <DynamicImage 
                        src={getActiveSettings().image} 
                        maskSrc={getActiveSettings().maskImage || (getActiveSettings().isMain ? editingProduct?.maskImage : types[adjustTarget]?.maskImage)}
                        color={colors.length > 0 ? colors[0].hex : (editingProduct?.colors?.[0]?.hex || '#d32f2f')} 
                        baseHue={getActiveSettings().baseHue}
                        transform={getActiveSettings().imageTransform}
                        sceneSrc={productSceneFile || (editingProduct?.sceneBackground || (sceneFile || settings.productSceneBackground))}
                      />
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
                         <div style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#1e293b', padding: '4px 12px', borderRadius: '12px', fontSize: '9px', fontWeight: '900', border: '1px solid #e2e8f0', backdropFilter: 'blur(4px)' }}>
                           {getActiveSettings().isMain ? 'VISTA PRINCIPAL' : `MODELO: ${types[adjustTarget]?.name.toUpperCase()}`}
                         </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                       {/* Universal Reset */}
                       <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                         <button 
                           onClick={() => updateActiveSettings({ imageTransform: { scale: 1, x: 0, y: 0 } })} 
                           style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px 20px', borderRadius: '14px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                         >
                           🔄 REESTABLECER TODO (CENTRAR)
                         </button>
                       </div>
                       {/* Control Card: Scale */}
                       <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                           <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Escala del Producto</span>
                           <button onClick={() => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, scale: 1} })} style={{ background: 'none', border: 'none', color: '#c5a059', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>Reset (1x)</button>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                           <button onClick={() => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, scale: Math.max(0.1, Math.round((getActiveSettings().imageTransform.scale - 0.05) * 100) / 100)} })} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: '900', cursor: 'pointer' }}>−</button>
                           <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                             <input type="range" min="0.1" max="3" step="0.01" value={getActiveSettings().imageTransform.scale} onChange={(e) => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, scale: parseFloat(e.target.value)} })} style={{ width: '100%', accentColor: '#c5a059', height: '6px', cursor: 'pointer' }} />
                           </div>
                           <button onClick={() => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, scale: Math.min(3, Math.round((getActiveSettings().imageTransform.scale + 0.05) * 100) / 100)} })} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: '900', cursor: 'pointer' }}>+</button>
                         </div>
                         <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', fontWeight: '900', color: '#c5a059' }}>{getActiveSettings().imageTransform.scale}x</div>
                       </div>
                       
                       {/* Control Card: Position X */}
                       <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                           <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desplazamiento Horizontal (X %)</span>
                           <button onClick={() => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, x: 0} })} style={{ background: 'none', border: 'none', color: '#c5a059', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>Centrar</button>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                           <button onClick={() => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, x: getActiveSettings().imageTransform.x - 1} })} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: '900', cursor: 'pointer' }}>‹</button>
                           <input type="range" min="-100" max="100" value={getActiveSettings().imageTransform.x} onChange={(e) => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, x: parseInt(e.target.value)} })} style={{ flex: 1, accentColor: '#c5a059', height: '6px' }} />
                           <button onClick={() => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, x: getActiveSettings().imageTransform.x + 1} })} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: '900', cursor: 'pointer' }}>›</button>
                         </div>
                       </div>

                       {/* Control Card: Position Y */}
                       <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                           <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desplazamiento Vertical (Y %)</span>
                           <button onClick={() => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, y: 0} })} style={{ background: 'none', border: 'none', color: '#c5a059', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>Centrar</button>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                           <button onClick={() => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, y: getActiveSettings().imageTransform.y + 1} })} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: '900', cursor: 'pointer' }}>⌵</button>
                           <input type="range" min="-100" max="100" value={getActiveSettings().imageTransform.y} onChange={(e) => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, y: parseInt(e.target.value)} })} style={{ flex: 1, accentColor: '#c5a059', height: '6px' }} />
                           <button onClick={() => updateActiveSettings({ imageTransform: {...getActiveSettings().imageTransform, y: getActiveSettings().imageTransform.y - 1} })} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: '900', cursor: 'pointer' }}>⌃</button>
                         </div>
                       </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.6' }}>
                      Cualquier ajuste de zoom o posición se aplica individualmente al modelo seleccionado.
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
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} 
                style={{ background: 'white', borderRadius: '32px', maxWidth: '600px', width: '100%', padding: '40px', boxShadow: '0 40px 80px rgba(0,0,0,0.1)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Ajustes de Escena</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Configura el ambiente global de tus productos.</p>
                  </div>
                  <button onClick={() => setShowSettings(false)} style={{ border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', fontSize: '20px' }}>×</button>
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
                        accept="image/*" 
                        onChange={(e) => setSceneFile(e.target.files[0])} 
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
