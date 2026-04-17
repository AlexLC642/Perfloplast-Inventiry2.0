'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FidelityImage from '../../../components/FidelityImage';
import Logo from '../../../components/Logo';

export default function AdminDashboard({ params, searchParams }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [maskFile, setMaskFile] = useState(null);
  const [colors, setColors] = useState([]);
  const [types, setTypes] = useState([]);
  const [baseHue, setBaseHue] = useState(0);
  const [imageTransform, setImageTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [lumina, setLumina] = useState({ brightness: 1, contrast: 1 });
  const [maskThreshold, setMaskThreshold] = useState(58);
  const [whiteThreshold, setWhiteThreshold] = useState(64);
  const [saving, setSaving] = useState(false);
  const [isManualMask, setIsManualMask] = useState(false);

  // Temp Color Fields
  const [tempColorName, setTempColorName] = useState('');
  const [tempColorHex, setTempColorHex] = useState('#000000');
  const [tempColorFile, setTempColorFile] = useState(null);
  const [tempColorTransform, setTempColorTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [productSceneFile, setProductSceneFile] = useState(null);
  const [tempType, setTempType] = useState('');
  const [tempTypeDescription, setTempTypeDescription] = useState('');
  const [tempTypePrice, setTempTypePrice] = useState('');
  const [tempTypeColors, setTempTypeColors] = useState([]);
  const [tempTypeColorHex, setTempTypeColorHex] = useState('#2563eb');
  const [tempTypeColorName, setTempTypeColorName] = useState('');
  const [tempTypeFile, setTempTypeFile] = useState(null);
  const [tempTypeMaskFile, setTempTypeMaskFile] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState('main'); // 'main' or index of type

  const [activeTab, setActiveTab] = useState('general'); // 'general', 'colors', 'types'
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingColorIndex, setEditingColorIndex] = useState(null);
  const [editingTypeIndex, setEditingTypeIndex] = useState(null); // null = adding new, number = editing existing
  const [editingTypeColorIndex, setEditingTypeColorIndex] = useState(null); // null = adding, number = editing color in current type

  // Guard: only auto-regenerate mask when user actively moves a slider
  const userTouchedThreshold = useRef(false);

  // Global Settings State
  const [settings, setSettings] = useState({ productSceneBackground: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [sceneFile, setSceneFile] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Industry Standard Presets
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

  // REAL-TIME SYNC: This fixes the bug where color adjustments (scale/pos) 
  // weren't saved unless the user clicked "ACTUALIZAR" manually.
  const syncColorChanges = (updates) => {
    if (updates.name !== undefined) setTempColorName(updates.name);
    if (updates.hex !== undefined) setTempColorHex(updates.hex);
    if (updates.file !== undefined) setTempColorFile(updates.file);

    let nextTransform;
    if (updates.transform !== undefined) {
      nextTransform = updates.transform;
      setTempColorTransform(nextTransform);
    }

    setColors(prev => {
      // Si no hay edición, simplemente retorna
      if (editingColorIndex === null) return prev;

      const newColors = [...prev];
      const current = newColors[editingColorIndex];
      if (!current) return prev; // Seguro

      newColors[editingColorIndex] = {
        ...current,
        name: updates.name !== undefined ? updates.name : current.name,
        hex: updates.hex !== undefined ? updates.hex : current.hex,
        textureTransform: nextTransform !== undefined ? nextTransform : current.textureTransform,
        file: updates.file === 'clear' ? null : (updates.file || current.file),
        image: updates.file === 'clear' ? null : (updates.file ? null : current.image)
      };

      return newColors;
    });
  };

  const handleTransformChange = (key, value) => {
    setTempColorTransform(prev => {
      const nextTransform = { ...prev, [key]: value };

      if (editingColorIndex !== null) {
        setColors(prevColors => {
          const newColors = [...prevColors];
          const current = newColors[editingColorIndex];
          if (current) {
            newColors[editingColorIndex] = {
              ...current,
              textureTransform: nextTransform
            };
          }
          return newColors;
        });
      }
      return nextTransform;
    });
  };

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

  // Auto-Regenerate Mask when Thresholds change (Real-time Preview)
  // GUARDED: Only runs when user actively moves a slider, NOT on load/mount.
  useEffect(() => {
    if (!userTouchedThreshold.current) return; // Skip mount/load/programmatic changes

    const timer = setTimeout(() => {
      if (adjustTarget !== 'main' && types[adjustTarget]) {
        // Option A: Specific Model
        const t = types[adjustTarget];
        const source = t.file || t.image;
        if (source) {
          generateAutoMask(source, (maskBlob) => {
            const newTypes = [...types];
            newTypes[adjustTarget] = { ...newTypes[adjustTarget], maskFile: maskBlob };
            setTypes(newTypes);
          });
        }
      } else if (adjustTarget === 'main') {
        // Option B: Main Product
        const source = file || (editingProduct?.image || null);
        if (source) {
          generateAutoMask(source, setMaskFile);
        }
      }
    }, 300); // Debounce
    return () => clearTimeout(timer);
  }, [maskThreshold, whiteThreshold]);

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

  const generateAutoMask = async (source, setTargetMask, customThreshold = null) => {
    // source can be a File object or a URL string
    if (!source) return;

    const thresholdToUse = customThreshold !== null ? customThreshold : maskThreshold;
    const currentWhiteThreshold = whiteThreshold; // Sensitivity for white parts
    const img = new Image();

    if (typeof source === 'string') {
      img.crossOrigin = "Anonymous"; // Fix CORS for Cloudinary/external URLs
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image for mask'));
    });

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

    // 2. Super-Sampling Background (Average of corner areas to avoid gold lines)
    const getAreaAvg = (startX, startY, size = 10) => {
      let r = 0, g = 0, b = 0, count = 0;
      for (let y = startY; y < startY + size && y < canvas.height; y++) {
        for (let x = startX; x < startX + size && x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2];
          count++;
        }
      }
      return [r / count, g / count, b / count];
    };

    const corners = [
      getAreaAvg(2, 2),
      getAreaAvg(canvas.width - 12, 2),
      getAreaAvg(2, canvas.height - 12),
      getAreaAvg(canvas.width - 12, canvas.height - 12)
    ];

    const bg = [
      corners.reduce((sum, c) => sum + c[0], 0) / 4,
      corners.reduce((sum, c) => sum + c[1], 0) / 4,
      corners.reduce((sum, c) => sum + c[2], 0) / 4
    ];

    // 3. Process Mask (v12: Perceptual White Guard)
    const bgThreshold = thresholdToUse; // Strictly for background distance
    
    // Sensitivity for white parts: 
    // Higher slider value = lower brightness threshold and higher chroma tolerance
    const whiteShieldMin = 255 - (currentWhiteThreshold * 1.6); 
    const chromaLimit = (currentWhiteThreshold * 0.6);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];

      // A. Background Distance Calculation
      const dist = Math.sqrt(
        Math.pow(r - bg[0], 2) +
        Math.pow(g - bg[1], 2) +
        Math.pow(b - bg[2], 2)
      );

      // B. Independent White Shield (Lid & Label Guard)
      // Use Perceptual Brightness for better white detection
      const pBrightness = (r * 0.299 + g * 0.587 + b * 0.114);
      
      // Chroma (saturation) detection
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);

      // A pixel is "White Part" if it's very bright AND neutral enough
      const isPalePart = (pBrightness > whiteShieldMin) && (chroma < chromaLimit);

      if (dist < bgThreshold || isPalePart) {
        data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0; // Transparent
      } else {
        data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255; // Opaque
      }
    }

    // 4. Denoise Pass (Remove isolated pixel "islands" - fixing the red spots)
    const refinedData = new Uint8ClampedArray(data);
    for (let i = 4 * canvas.width; i < data.length - 4 * canvas.width; i += 4) {
      if (data[i + 3] === 255) { // If opaque
        // Check 4 neighbors
        const n = data[i - (canvas.width * 4) + 3];
        const s = data[i + (canvas.width * 4) + 3];
        const w = data[i - 4 + 3];
        const e = data[i + 4 + 3];
        // If isolated (all neighbors are transparent), remove it
        if (n === 0 && s === 0 && w === 0 && e === 0) refinedData[i + 3] = 0;
      }
    }
    imageData.data.set(refinedData);

    // 5. High-Fidelity Feathering (Soft Edge)
    tctx.putImageData(imageData, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'blur(0.8px)'; // Subtle smooth edge
    ctx.drawImage(tempCanvas, 0, 0);

    canvas.toBlob((blob) => {
      const resultMaskFile = new File([blob], "auto_mask_v10_premium.png", { type: "image/png" });
      setTargetMask(resultMaskFile);
      if (typeof source !== 'string') URL.revokeObjectURL(img.src);
    }, 'image/png');
  };

  // NOTE: Auto-mask generation REMOVED. Masks are now ONLY created when:\n  // 1. User clicks \"✨ Generar Máscara Automática\" button\n  // 2. User manually uploads a mask file\n  // This prevents unwanted masks from appearing on products.

  const openForm = (product = null) => {
    // ALWAYS clear file and temp states first to prevent pollution
    setFile(null);
    setMaskFile(null);
    setTempTypeFile(null);
    setTempTypeMaskFile(null);
    setTempType('');
    setTempTypePrice('');
    setTempTypeColors([]);
    setTempTypeColorHex('#2563eb');
    setTempTypeColorName('');
    setTempColorName('');
    setTempColorHex('#000000');
    setAdjustTarget('main');
    setActiveTab('general');
    userTouchedThreshold.current = false; // Reset guard on form open

    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price);
      setColors(product.colors || []);
      setTempColorFile(null); // Clear color file on open

      // If the product already has a mask, we treat it as "not manual" for now
      // so the slider can still fix it, UNLESS the user explicitly uploads a new one.
      setIsManualMask(false);

      const formattedTypes = (product.types || []).map(t => ({
        name: typeof t === 'string' ? t : (t.name || ''),
        price: t.price || '',
        colors: t.colors || [],
        image: typeof t === 'string' ? (product.image || '') : (t.image || ''),
        maskImage: t.maskImage || null,
        baseHue: t.baseHue !== undefined ? t.baseHue : null,
        imageTransform: t.imageTransform || { scale: 1, x: 0, y: 0 },
        lumina: t.lumina || { brightness: 1, contrast: 1 },
        maskThreshold: t.maskThreshold || 58,
        whiteThreshold: t.whiteThreshold || 64
      }));
      setTypes(formattedTypes);
      setBaseHue(product.baseHue || 0);
      setImageTransform(product.imageTransform || { scale: 1, x: 0, y: 0 });
      setLumina(product.lumina || { brightness: 1, contrast: 1 });
      setMaskThreshold(product.maskThreshold || 58);
      setWhiteThreshold(product.whiteThreshold || 64);
      setProductSceneFile(null);
    } else {
      setEditingProduct(null);
      setName('');
      setDescription('');
      setPrice('');
      setColors([]);
      setTypes([]);
      setBaseHue(0);
      setImageTransform({ scale: 1, x: 0, y: 0 });
      setLumina({ brightness: 1, contrast: 1 });
      setMaskThreshold(58);
      setWhiteThreshold(64);
      setProductSceneFile(null);
      setIsManualMask(false);
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
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > threshold && g > threshold && b > threshold) data[i + 3] = 0;
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
          try { upErr = await uploadRes.json(); } catch (e) { upErr = { error: 'Error inesperado en el servidor' }; }
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
          try { upErr = await uploadRes.json(); } catch (e) { upErr = { error: 'Error en servidor' }; }
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

      const finalColors = await Promise.all(colors.map(async (c) => {
        if (!c.file) return { ...c, lumina: c.lumina }; // Existing or hex-only
        try {
          const processedFile = await processImage(c.file);
          const formData = new FormData();
          formData.append('file', processedFile);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!uploadRes.ok) throw new Error('Error al subir foto de color');
          const data = await uploadRes.json();
          return { 
            name: c.name, 
            hex: c.hex, 
            image: data.url, 
            textureTransform: c.textureTransform,
            lumina: c.lumina 
          };
        } catch (e) {
          console.error(e);
          return { ...c, textureTransform: c.textureTransform };
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
          price: t.price || '',
          colors: t.colors || [],
          image: typeImageUrl,
          maskImage: typeMaskUrl,
          baseHue: t.baseHue !== undefined ? t.baseHue : null,
          imageTransform: t.imageTransform || { scale: 1, x: 0, y: 0 },
          lumina: t.lumina || { brightness: 1, contrast: 1 },
          maskThreshold: t.maskThreshold || 58,
          whiteThreshold: t.whiteThreshold || 64
        };
      }));

      const productData = {
        name,
        description,
        price,
        image: imageUrl,
        maskImage: maskUrl,
        colors: finalColors,
        types: finalTypes,
        baseHue,
        imageTransform,
        lumina,
        maskThreshold,
        whiteThreshold,
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
      setName(''); setDescription(''); setPrice(''); setFile(null); setColors([]); setTypes([]);
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
      if (editingColorIndex !== null) {
        // Update existing color
        const newColors = [...colors];
        const existingColor = newColors[editingColorIndex];

        newColors[editingColorIndex] = {
          ...existingColor,
          name: tempColorName,
          hex: tempColorHex,
          // If tempColorFile is 'clear', we remove it. Otherwise keep existing or use new.
          file: tempColorFile === 'clear' ? null : (tempColorFile || existingColor.file),
          image: tempColorFile === 'clear' ? null : (tempColorFile ? null : existingColor.image),
          textureTransform: tempColorTransform
        };
        setColors(newColors);
        setEditingColorIndex(null);
      } else {
        // Add new color
        const newColor = {
          id: Date.now(),
          name: tempColorName,
          hex: tempColorHex,
          file: tempColorFile && tempColorFile !== 'clear' ? tempColorFile : null,
          textureTransform: tempColorTransform
        };
        setColors([...colors, newColor]);
      }

      setTempColorName('');
      setTempColorFile(null);
      setTempColorTransform({ scale: 1, x: 0, y: 0 });
      // Reset color to a random one to prompt variety
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      setTempColorHex(randomColor);
    }
  };

  const cancelColorEdit = () => {
    setEditingColorIndex(null);
    setTempColorName('');
    setTempColorFile(null);
    setTempColorTransform({ scale: 1, x: 0, y: 0 });
    setTempColorHex('#000000');
  };

  const addType = () => {
    if (!tempType.trim()) return;

    const typeData = {
      name: tempType.trim(),
      description: tempTypeDescription,
      price: tempTypePrice,
      colors: tempTypeColors,
      file: tempTypeFile,
      maskFile: tempTypeMaskFile,
      // Preserve transform when editing
      baseHue: editingTypeIndex !== null ? (types[editingTypeIndex]?.baseHue ?? null) : null,
      imageTransform: editingTypeIndex !== null ? (types[editingTypeIndex]?.imageTransform || { scale: 1, x: 0, y: 0 }) : { scale: 1, x: 0, y: 0 },
      lumina: editingTypeIndex !== null ? (types[editingTypeIndex]?.lumina || { brightness: 1, contrast: 1 }) : { brightness: 1, contrast: 1 },
      // Preserve mask thresholds per model
      maskThreshold: editingTypeIndex !== null ? (types[editingTypeIndex]?.maskThreshold || maskThreshold) : maskThreshold,
      whiteThreshold: editingTypeIndex !== null ? (types[editingTypeIndex]?.whiteThreshold || whiteThreshold) : whiteThreshold,
      // Preserve existing image/mask if no new file uploaded
      image: editingTypeIndex !== null && !tempTypeFile ? (types[editingTypeIndex]?.image || null) : null,
      maskImage: editingTypeIndex !== null && !tempTypeMaskFile ? (types[editingTypeIndex]?.maskImage || null) : null,
    };

    if (editingTypeIndex !== null) {
      // UPDATE existing type
      const newTypes = [...types];
      newTypes[editingTypeIndex] = typeData;
      setTypes(newTypes);
      setEditingTypeIndex(null);
    } else {
      // ADD new type
      setTypes([...types, typeData]);
    }

    // Reset temp fields
    setTempType('');
    setTempTypeDescription('');
    setTempTypePrice('');
    setTempTypeColors([]);
    setTempTypeColorHex('#2563eb');
    setTempTypeColorName('');
    setTempTypeFile(null);
    setTempTypeMaskFile(null);
    setEditingTypeColorIndex(null);
  };

  const startEditType = (idx) => {
    const t = types[idx];
    if (!t) return;
    setEditingTypeIndex(idx);
    setTempType(t.name || '');
    setTempTypeDescription(t.description || '');
    setTempTypePrice(t.price || '');
    setTempTypeColors(t.colors || []);
    setTempTypeColorHex('#2563eb');
    setTempTypeColorName('');
    setTempTypeFile(null);    // Don't pre-load file (it's a URL already)
    setTempTypeMaskFile(null);
    // Sync mask thresholds to this model's saved values
    setMaskThreshold(t.maskThreshold || 58);
    setWhiteThreshold(t.whiteThreshold || 64);
    // Also switch preview to this type
    setAdjustTarget(idx);
  };

  const cancelTypeEdit = () => {
    setEditingTypeIndex(null);
    setTempType('');
    setTempTypeDescription('');
    setTempTypePrice('');
    setTempTypeColors([]);
    setTempTypeColorHex('#2563eb');
    setTempTypeColorName('');
    setTempTypeFile(null);
    setTempTypeMaskFile(null);
    setEditingTypeColorIndex(null);
  };

  const addTypeColor = () => {
    if (!tempTypeColorName.trim()) return;

    const colorData = {
      name: tempTypeColorName.trim(),
      hex: tempTypeColorHex
    };

    if (editingTypeColorIndex !== null) {
      const newColors = [...tempTypeColors];
      newColors[editingTypeColorIndex] = colorData;
      setTempTypeColors(newColors);
      setEditingTypeColorIndex(null);
    } else {
      setTempTypeColors([...tempTypeColors, colorData]);
    }

    setTempTypeColorName('');
    // Keep color for continuity or reset? User might want to keep it to pick another similar
  };

  const startEditTypeColor = (idx) => {
    const c = tempTypeColors[idx];
    if (!c) return;
    setEditingTypeColorIndex(idx);
    setTempTypeColorName(c.name);
    setTempTypeColorHex(c.hex);
  };

  const cancelTypeColorEdit = () => {
    setEditingTypeColorIndex(null);
    setTempTypeColorName('');
  };

  const PRESET_MODEL_COLORS = [
    { name: 'Blanco', hex: '#ffffff' }, { name: 'Negro', hex: '#1a1a1a' },
    { name: 'Gris', hex: '#6b7280' }, { name: 'Azul Marino', hex: '#1e3a8a' },
    { name: 'Azul', hex: '#2563eb' }, { name: 'Celeste', hex: '#38bdf8' },
    { name: 'Verde Oscuro', hex: '#14532d' }, { name: 'Verde', hex: '#16a34a' },
    { name: 'Lima', hex: '#84cc16' }, { name: 'Granate', hex: '#7f1d1d' },
    { name: 'Rojo', hex: '#dc2626' }, { name: 'Naranja', hex: '#ea580c' },
    { name: 'Dorado', hex: '#c5a059' }, { name: 'Amarillo', hex: '#facc15' },
    { name: 'Morado', hex: '#7c3aed' }, { name: 'Rosa', hex: '#db2777' },
    { name: 'Café', hex: '#78350f' }, { name: 'Beige', hex: '#d6d3d1' },
    { name: 'Carbón', hex: '#374151' }, { name: 'Turquesa', hex: '#0d9488' },
  ];

  const getActiveSettings = () => {
    // A. PRIORITY: If editing a MAIN COLOR
    if (activeTab === 'colors' && editingColorIndex !== null && colors[editingColorIndex]) {
      const c = colors[editingColorIndex];
      return {
        image: file || (editingProduct?.image || null),
        maskImage: maskFile || (editingProduct?.maskImage || null),
        baseHue,
        imageTransform,
        lumina: c.lumina || { brightness: 1, contrast: 1 },
        isMain: true,
        isColorMode: true,
        label: `DEL COLOR: ${c.name}`
      };
    }

    // B. PRIORITY: If editing a MODEL COLOR
    if (activeTab === 'types' && editingTypeIndex !== null && editingTypeColorIndex !== null && types[editingTypeIndex]?.colors[editingTypeColorIndex]) {
      const t = types[editingTypeIndex];
      const tc = t.colors[editingTypeColorIndex];
      return {
        image: t.file || (t.image || (file || (editingProduct?.image || null))),
        maskImage: t.maskFile || (t.maskImage || (maskFile || (editingProduct?.maskImage || null))),
        baseHue: t.baseHue,
        imageTransform: t.imageTransform,
        lumina: tc.lumina || { brightness: 1, contrast: 1 },
        isMain: false,
        isColorMode: true,
        label: `DEL MODELO: ${tc.name}`
      };
    }

    // C. FALLBACK: Main view vs Model view
    if (adjustTarget === 'main' || !types[adjustTarget]) {
      return {
        image: file || (editingProduct?.image || null),
        maskImage: maskFile || (editingProduct?.maskImage || null),
        baseHue,
        imageTransform,
        lumina,
        isMain: true,
        isColorMode: false,
        label: 'VISTA PRINCIPAL'
      };
    }
    const t = types[adjustTarget];
    return {
      image: t.file || (t.image || (file || (editingProduct?.image || null))),
      maskImage: t.maskFile || (t.maskImage || (maskFile || (editingProduct?.maskImage || null))),
      baseHue: t.baseHue,
      imageTransform: t.imageTransform,
      lumina: t.lumina,
      isMain: false,
      isColorMode: false,
      label: `MODELO: ${t.name}`
    };
  };

  const updateActiveSettings = (updates) => {
    // 1. ROUTE TO MAIN COLOR
    if (activeTab === 'colors' && editingColorIndex !== null) {
      const newColors = [...colors];
      if (updates.lumina !== undefined) newColors[editingColorIndex].lumina = updates.lumina;
      setColors(newColors);
      return;
    }

    // 2. ROUTE TO MODEL COLOR
    if (activeTab === 'types' && editingTypeIndex !== null && editingTypeColorIndex !== null) {
      const newTypes = [...types];
      if (updates.lumina !== undefined) newTypes[editingTypeIndex].colors[editingTypeColorIndex].lumina = updates.lumina;
      setTypes(newTypes);
      return;
    }

    // 3. ROUTE TO VIEW (MAIN OR TYPE)
    if (adjustTarget === 'main') {
      if (updates.baseHue !== undefined) setBaseHue(updates.baseHue);
      if (updates.imageTransform !== undefined) setImageTransform(updates.imageTransform);
      if (updates.lumina !== undefined) setLumina(updates.lumina);
    } else if (types[adjustTarget]) {
      const newTypes = [...types];
      if (updates.baseHue !== undefined) newTypes[adjustTarget].baseHue = updates.baseHue;
      if (updates.imageTransform !== undefined) newTypes[adjustTarget].imageTransform = updates.imageTransform;
      if (updates.lumina !== undefined) newTypes[adjustTarget].lumina = updates.lumina;
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
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
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
                color: '#0ea5e9',
                bg: 'rgba(14, 165, 233, 0.1)'
              },
              {
                label: 'Variedad de Color',
                value: products.reduce((acc, p) => acc + (p.colors?.length || 0), 0),
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1s-.4-.7-.4-1.1c0-.9.7-1.6 1.6-1.6H17c2.8 0 5-2.2 5-5 0-5.5-4.5-10-10-10z" /></svg>,
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.1)'
              },
              {
                label: 'Modelos Registrados',
                value: products.reduce((acc, p) => acc + (p.types?.length || 0), 0),
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1-2.83-2.83l-3.94 3.6Z" /><path d="m3.1 20.9 4.83-4.83a.5.5 0 0 0 0-.7l-1.06-1.06a.5.5 0 0 1 0-.7l2.47-2.47a2 2 0 0 1 2.83 0l1.59 1.59a2 2 0 0 1 0 2.83l-2.47 2.47a.5.5 0 0 1-.7 0l-1.06-1.06a.5.5 0 0 0-.7 0L3.1 20.9a2 2 0 1 0 2.8 2.8l4.83-4.83" /><path d="m15 15 6 6" /><path d="m21 15-6 6" /></svg>,
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
                        <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => confirmDelete(product.id)}
                        style={{ background: '#fef2f2', border: 'none', width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', borderRadius: isMobile ? '10px' : '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                      >
                        <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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
                    <style dangerouslySetInnerHTML={{
                      __html: `
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
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (tab.id === 'general' || tab.id === 'colors') setAdjustTarget('main');
                        }}
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
                        <button key={tab.id} onClick={() => {
                          setActiveTab(tab.id);
                          if (tab.id === 'general' || tab.id === 'colors') setAdjustTarget('main');
                        }} style={{
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

                          {/* NOMBRE Y PRECIO PRIMERO PARA QUE EL USUARIO NO SE PIERDA */}
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

                          {/* DESCRIPCIÓN JUSTO DEBAJO */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '24px', background: '#f1f5f9', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción para el Catálogo</label>
                            <textarea 
                              value={description} 
                              onChange={(e) => setDescription(e.target.value)} 
                              placeholder="Escribe aquí los detalles, medidas o características del producto..." 
                              style={{ 
                                background: 'white', 
                                border: '1px solid #cbd5e1', 
                                padding: '16px', 
                                borderRadius: '14px', 
                                fontSize: '14px', 
                                fontWeight: '500', 
                                color: '#0f172a',
                                minHeight: '120px',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                              }} 
                            />
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Esta descripción aparecerá en el catálogo y en el PDF.</p>
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
                                    if (validateFile(f)) {
                                      setFile(f);
                                      setIsManualMask(false); // Reset to auto mode for new images
                                    }
                                  }}
                                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                />
                                <div style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c5a059', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                  <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                </div>
                                <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: '700', color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file ? file.name : (editingProduct?.image ? editingProduct.image.split('/').pop() : 'Subir Imagen')}
                                </span>
                                {(file || editingProduct?.image) && (
                                  <button type="button" onClick={(e) => {
                                    e.stopPropagation();
                                    if (file) setFile(null);
                                    else setEditingProduct({ ...editingProduct, image: null });
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
                                    if (validateFile(f)) {
                                      setMaskFile(f);
                                      setIsManualMask(true); // User uploaded their own mask
                                    }
                                  }}
                                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                />
                                <div style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                  <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: '700', color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {maskFile ? maskFile.name : (editingProduct?.maskImage ? editingProduct.maskImage.split('/').pop() : 'Subir Máscara')}
                                  {!isManualMask && (maskFile || editingProduct?.maskImage) && (
                                    <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', border: '1px solid #bbf7d0' }}>✨ AUTO</span>
                                  )}
                                </span>
                                {(maskFile || editingProduct?.maskImage) && (
                                  <button type="button" onClick={(e) => {
                                    e.stopPropagation();
                                    if (maskFile) setMaskFile(null);
                                    else setEditingProduct({ ...editingProduct, maskImage: null });
                                    setIsManualMask(false);
                                  }} style={{ position: 'absolute', top: '12px', right: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', zIndex: 20, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)' }}>Eliminar</button>
                                )}
                              </div>
                              {file && !maskFile && (
                                <button type="button" onClick={() => generateAutoMask(file, setMaskFile)} style={{ marginTop: '12px', background: '#f1f5f9', color: '#444', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '14px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', alignSelf: 'center' }}>
                                  ✨ Generar Máscara Automática
                                </button>
                              )}
                            </div>

                            {/* DUAL SURGICAL CONTROLS (v11: Decoupled Precision) */}
                            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                              {/* 1. BACKGROUND REMOVAL SLIDER */}
                              <div style={{ padding: '24px', background: '#f1f5f9', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>1. Recorte de Fondo (Bordes)</h5>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>Ajusta qué tan limpio es el recorte exterior del producto.</p>
                                  </div>
                                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#c5a059', minWidth: '40px', textAlign: 'right' }}>{maskThreshold}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                  <input
                                    type="range"
                                    min="1"
                                    max="180"
                                    value={maskThreshold}
                                    onChange={(e) => {
                                      userTouchedThreshold.current = true;
                                      setMaskThreshold(parseInt(e.target.value));
                                    }}
                                    style={{ flex: 1, accentColor: '#c5a059', cursor: 'grab' }}
                                  />
                                </div>
                              </div>

                              {/* 2. WHITE LID PROTECTION SLIDER */}
                              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>2. Limpieza de Tapa (Blancos)</h5>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>Sube este valor si la tapa blanca aún se ve con color. No afecta a la base.</p>
                                  </div>
                                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6', minWidth: '#40px', textAlign: 'right' }}>{whiteThreshold}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                  <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={whiteThreshold}
                                    onChange={(e) => {
                                      userTouchedThreshold.current = true;
                                      setWhiteThreshold(parseInt(e.target.value));
                                    }}
                                    style={{ flex: 1, accentColor: '#3b82f6', cursor: 'grab' }}
                                  />
                                </div>
                              </div>
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
                                <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                              </div>
                              <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: '700', color: '#1e293b' }}>
                                {productSceneFile ? productSceneFile.name : (editingProduct?.sceneBackground ? 'Cambiar escenario' : 'Subir fondo específico')}
                              </span>
                              {(productSceneFile || editingProduct?.sceneBackground) && (
                                <button type="button" onClick={(e) => {
                                  e.stopPropagation();
                                  if (productSceneFile) setProductSceneFile(null);
                                  else setEditingProduct({ ...editingProduct, sceneBackground: null });
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
                              <input type="text" placeholder="Nombre (Ej: Azul Real)" value={tempColorName} onChange={(e) => syncColorChanges({ name: e.target.value })} style={{ flex: 1, minWidth: '180px', padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '14px' }} />

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', border: '2px solid #cbd5e1', position: 'relative' }}>
                                  <input type="color" value={tempColorHex} onChange={(e) => syncColorChanges({ hex: e.target.value })} style={{ position: 'absolute', inset: '-5px', width: '150%', height: '150%', border: 'none', cursor: 'pointer' }} />
                                </div>

                                {/* New Color Image Upload Button */}
                                <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '14px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: (tempColorFile || (editingColorIndex !== null && colors[editingColorIndex]?.image)) ? '#f0f9ff' : 'white', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const f = e.target.files[0];
                                      if (validateFile(f)) syncColorChanges({ file: f });
                                    }}
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                  />
                                  {tempColorFile && tempColorFile instanceof Blob ? (
                                    <img src={URL.createObjectURL(tempColorFile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (editingColorIndex !== null && colors[editingColorIndex]?.image && tempColorFile !== 'clear') ? (
                                    <img src={colors[editingColorIndex].image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                  )}
                                  {(tempColorFile || (editingColorIndex !== null && colors[editingColorIndex]?.image && tempColorFile !== 'clear')) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        syncColorChanges({ file: 'clear' });
                                      }}
                                      title="Quitar textura"
                                      style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', border: 'none', width: '20px', height: '20px', borderRadius: '0 0 0 8px', fontSize: '14px', cursor: 'pointer', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>

                              {editingColorIndex !== null ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button type="button" onClick={addColor} style={{ height: '48px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', padding: '0 16px', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓ ACTUALIZAR</button>
                                  <button type="button" onClick={cancelColorEdit} style={{ width: '48px', height: '48px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                </div>
                              ) : (
                                <button type="button" onClick={addColor} style={{ width: '48px', height: '48px', background: '#c5a059', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                              )}
                            </div>

                            {/* NEW: Simple Image Size Slider (Only if image exists) */}
                            {(tempColorFile || (editingColorIndex !== null && colors[editingColorIndex]?.image && tempColorFile !== 'clear')) && (
                              <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '20px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tamaño de Imagen de Color</label>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#0ea5e9' }}>{tempColorTransform.scale}x</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0.01"
                                    max="4"
                                    step="0.01"
                                    value={tempColorTransform.scale}
                                    onChange={(e) => handleTransformChange('scale', parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#0ea5e9', cursor: 'grab' }}
                                  />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                  <div>
                                    <label style={{ fontSize: '10px', fontWeight: '900', color: '#0369a1', display: 'block', marginBottom: '8px' }}>EJE X (%)</label>
                                    <input
                                      type="range"
                                      min="-100"
                                      max="100"
                                      value={tempColorTransform.x || 0}
                                      onChange={(e) => handleTransformChange('x', parseInt(e.target.value))}
                                      style={{ width: '100%', accentColor: '#0ea5e9' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '10px', fontWeight: '900', color: '#0369a1', display: 'block', marginBottom: '8px' }}>EJE Y (%)</label>
                                    <input
                                      type="range"
                                      min="-100"
                                      max="100"
                                      value={tempColorTransform.y || 0}
                                      onChange={(e) => handleTransformChange('y', parseInt(e.target.value))}
                                      style={{ width: '100%', accentColor: '#0ea5e9' }}
                                    />
                                  </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>Ajusta qué tan grande y dónde se ve la foto sobre el producto.</p>
                              </div>
                            )}

                            <div>
                              <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Sugerencias de Calidad</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {PRESET_COLORS.map(p => (
                                  <button key={p.hex} type="button" onClick={() => syncColorChanges({ name: p.name, hex: p.hex })} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.hex }} />
                                    {p.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '24px', background: '#fffbeb', borderRadius: '24px', border: '1px solid #fde68a' }}>
                            {colors.length > 0 ? colors.map((c, i) => {
                              if (!c) return null;
                              const isEditing = editingColorIndex === i;
                              return (
                                <div
                                  key={i}
                                  onClick={() => {
                                    setEditingColorIndex(i);
                                    setTempColorName(c.name);
                                    setTempColorHex(c.hex);
                                    setTempColorFile(null); // Clear temp file, it will use existing image/file
                                    setTempColorTransform(c.textureTransform || { scale: 1, x: 0, y: 0 });
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: isEditing ? '#fff7ed' : 'white',
                                    padding: '10px 16px',
                                    borderRadius: '14px',
                                    border: isEditing ? '2px solid #fbbf24' : '1px solid #fef3c7',
                                    boxShadow: isEditing ? '0 8px 24px rgba(251, 191, 36, 0.2)' : '0 4px 12px rgba(0,0,0,0.03)',
                                    fontSize: '13px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: isEditing ? 'scale(1.02)' : 'scale(1)'
                                  }}
                                >
                                  {/* Color-Specific Image Thumbnail */}
                                  {(typeof c === 'object' && (c.file || c.image)) && (
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                      <img src={c.file && c.file instanceof Blob ? URL.createObjectURL(c.file) : c.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                  )}
                                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: typeof c === 'object' ? c.hex : c, border: '1px solid rgba(0,0,0,0.1)' }} />
                                  <span style={{ color: isEditing ? '#92400e' : '#1e293b' }}>{typeof c === 'object' ? c.name : ''}</span>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setColors(colors.filter((_, idx) => idx !== i)); if (isEditing) cancelColorEdit(); }} style={{ border: 'none', background: 'none', color: '#f87171', fontSize: '18px', cursor: 'pointer', marginLeft: '4px' }}>×</button>
                                </div>
                              )
                            }) : <p style={{ margin: 0, fontSize: '14px', color: '#92400e', fontStyle: 'italic' }}>No has añadido colores aún.</p>}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'types' && (
                        <motion.div key="types" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>Modelos y Variantes</h4>

                          <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                          {/* Header con modo edición */}
                          {editingTypeIndex !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#eff6ff', padding: '12px 20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1d4ed8' }}>Editando: <em style={{ fontStyle: 'normal', color: '#1e293b' }}>{types[editingTypeIndex]?.name}</em></span>
                              <button type="button" onClick={cancelTypeEdit} style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '800', color: '#64748b', background: 'white', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                            </div>
                          )}

                            {/* Nombre + Precio + Botón */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                              <div style={{ flex: 2 }}>
                                <input type="text" placeholder="Ej: Con Tapa Rosca" value={tempType} onChange={(e) => setTempType(e.target.value)} style={{ width: '100%', padding: '18px 24px', borderRadius: '20px', border: editingTypeIndex !== null ? '2px solid #3b82f6' : '1px solid #cbd5e1', fontSize: '15px', fontWeight: '500', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box' }} />
                              </div>
                              <div style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
                                <span style={{ position: 'absolute', left: '18px', top: '18px', fontWeight: '900', color: '#c5a059', fontSize: '15px', pointerEvents: 'none' }}>Q</span>
                                <input type="number" placeholder="0.00" value={tempTypePrice} onChange={(e) => setTempTypePrice(e.target.value)} style={{ width: '100%', padding: '18px 18px 18px 36px', borderRadius: '20px', border: '1px solid #e2e8f0', fontSize: '15px', fontWeight: '800', color: '#c5a059', boxSizing: 'border-box', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} />
                              </div>
                              <button type="button" onClick={addType} style={{ padding: '0 28px', height: '60px', background: editingTypeIndex !== null ? 'linear-gradient(135deg, #1d4ed8, #1e40af)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)', transition: 'all 0.3s ease', whiteSpace: 'nowrap' }}>
                                {editingTypeIndex !== null ? '💾 Guardar' : 'Añadir'}
                              </button>
                            </div>

                            {/* Descripción del Modelo (Estilo Premium similar al General) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                              <label style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción del modelo seleccionado (Opcional)</label>
                              <textarea 
                                placeholder="Describe las medidas o detalles especiales de este modelo..." 
                                value={tempTypeDescription} 
                                onChange={(e) => setTempTypeDescription(e.target.value)} 
                                style={{ 
                                  width: '100%', 
                                  padding: '16px', 
                                  borderRadius: '16px', 
                                  border: '1px solid #e2e8f0', 
                                  fontSize: '14px', 
                                  fontWeight: '500',
                                  minHeight: '80px', 
                                  resize: 'vertical',
                                  fontFamily: 'inherit',
                                  boxSizing: 'border-box',
                                  background: '#fcfcfc',
                                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                                }} 
                              />
                            </div>

                            {/* Color picker libre para el modelo */}
                            <div style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Colores del modelo</p>

                                {/* Row: color picker + nombre + añadir */}
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  {/* Color picker nativo */}
                                  <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: tempTypeColorHex, border: editingTypeColorIndex !== null ? '3px solid #3b82f6' : '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                      <input
                                        type="color"
                                        value={tempTypeColorHex}
                                        onChange={(e) => setTempTypeColorHex(e.target.value)}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Nombre del color (ej: Azul Marino)"
                                    value={tempTypeColorName}
                                    onChange={(e) => setTempTypeColorName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && tempTypeColorName.trim()) addTypeColor(); }}
                                    style={{ flex: 1, minWidth: '140px', padding: '12px 16px', borderRadius: '14px', border: editingTypeColorIndex !== null ? '2px solid #3b82f6' : '1px solid #e2e8f0', fontSize: '13px', fontWeight: '600' }}
                                  />
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={addTypeColor}
                                      style={{ padding: '12px 20px', background: editingTypeColorIndex !== null ? '#3b82f6' : '#0f172a', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: editingTypeColorIndex !== null ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none' }}
                                    >
                                      {editingTypeColorIndex !== null ? '💾 Guardar' : '+ Añadir'}
                                    </button>
                                    {editingTypeColorIndex !== null && (
                                      <button
                                        type="button"
                                        onClick={cancelTypeColorEdit}
                                        style={{ padding: '12px 14px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '14px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Color list */}
                                {tempTypeColors.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {tempTypeColors.map((c, i) => (
                                      <div
                                        key={i}
                                        onClick={() => startEditTypeColor(i)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '7px',
                                          background: editingTypeColorIndex === i ? '#eff6ff' : '#f8fafc',
                                          padding: '6px 10px 6px 8px',
                                          borderRadius: '10px',
                                          border: editingTypeColorIndex === i ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          boxShadow: editingTypeColorIndex === i ? '0 4px 6px -1px rgba(59, 130, 246, 0.1)' : 'none'
                                        }}
                                      >
                                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: c.hex, border: '1.5px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: editingTypeColorIndex === i ? '#1d4ed8' : '#334155' }}>{c.name}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTempTypeColors(tempTypeColors.filter((_, idx) => idx !== i));
                                            if (editingTypeColorIndex === i) cancelTypeColorEdit();
                                          }}
                                          style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
                                        >×</button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              {tempTypeColors.length === 0 && (
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Elige un tono y añádelo. Aparecerá en el catálogo para este modelo.</p>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px' }}>
                              {/* Model Photo Upload */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foto del Modelo</label>
                                <div style={{ position: 'relative', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '24px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease', overflow: 'hidden' }}>
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
                                  
                                  {(tempTypeFile || (editingTypeIndex !== null && types[editingTypeIndex]?.image)) ? (
                                    <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                      <img 
                                        src={tempTypeFile ? URL.createObjectURL(tempTypeFile) : types[editingTypeIndex].image} 
                                        style={{ height: '70px', maxWidth: '100%', objectFit: 'contain', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                                      />
                                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginTop: '10px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {tempTypeFile ? tempTypeFile.name : 'Imagen Guardada'}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <div style={{ width: '44px', height: '44px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c5a059' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                      </div>
                                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Seleccionar Foto</span>
                                    </>
                                  )}

                                  {(tempTypeFile || (editingTypeIndex !== null && types[editingTypeIndex]?.image)) && (
                                    <button 
                                      type="button" 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (tempTypeFile) setTempTypeFile(null); 
                                        else {
                                          const nt = [...types];
                                          nt[editingTypeIndex].image = null;
                                          setTypes(nt);
                                        }
                                      }} 
                                      style={{ position: 'absolute', top: '12px', right: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', zIndex: 20 }}
                                    >
                                      Quitar
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Model Mask Upload */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Máscara (Opcional)</label>
                                <div style={{ position: 'relative', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '24px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease', overflow: 'hidden' }}>
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

                                  {(tempTypeMaskFile || (editingTypeIndex !== null && types[editingTypeIndex]?.maskImage)) ? (
                                    <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                      <div style={{ height: '70px', width: '70px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        <img 
                                          src={tempTypeMaskFile ? URL.createObjectURL(tempTypeMaskFile) : types[editingTypeIndex].maskImage} 
                                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                        />
                                      </div>
                                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginTop: '10px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {tempTypeMaskFile ? tempTypeMaskFile.name : 'Máscara Guardada'}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <div style={{ width: '44px', height: '44px', background: 'rgba(71, 85, 105, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                      </div>
                                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Seleccionar Máscara</span>
                                    </>
                                  )}

                                  {(tempTypeMaskFile || (editingTypeIndex !== null && types[editingTypeIndex]?.maskImage)) && (
                                    <button 
                                      type="button" 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (tempTypeMaskFile) setTempTypeMaskFile(null); 
                                        else {
                                          const nt = [...types];
                                          nt[editingTypeIndex].maskImage = null;
                                          setTypes(nt);
                                        }
                                      }} 
                                      style={{ position: 'absolute', top: '12px', right: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', zIndex: 20 }}
                                    >
                                      Quitar
                                    </button>
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
                                    <img src={t.file && t.file instanceof Blob ? URL.createObjectURL(t.file) : t.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  ) : (
                                    <div style={{ opacity: 0.2, fontSize: isMobile ? '16px' : '24px' }}>📦</div>
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <p style={{ margin: 0, fontSize: isMobile ? '13px' : '15px', fontWeight: '800', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                                    {t.price && (
                                      <div style={{ background: 'linear-gradient(135deg, #c5a059, #a38241)', padding: '2px 10px', borderRadius: '8px', color: 'white', fontWeight: '900', fontSize: '12px', flexShrink: 0 }}>
                                        Q{t.price}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: (t.maskFile || t.maskImage) ? '#dcfce7' : '#f1f5f9', color: (t.maskFile || t.maskImage) ? '#166534' : '#64748b' }}>
                                      {(t.maskFile || t.maskImage) ? 'MÁSCARA' : 'SIN MÁSCARA'}
                                    </span>
                                    {t.colors && t.colors.length > 0 && (
                                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                        {t.colors.slice(0, 6).map((c, ci) => (
                                          <div key={ci} title={c.name} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                                        ))}
                                        {t.colors.length > 6 && <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>+{t.colors.length - 6}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {/* EDITAR */}
                                  <button type="button" onClick={() => startEditType(i)} style={{ padding: isMobile ? '8px 10px' : '10px 16px', borderRadius: '10px', background: editingTypeIndex === i ? '#eff6ff' : 'white', color: editingTypeIndex === i ? '#1d4ed8' : '#475569', border: editingTypeIndex === i ? '1px solid #bfdbfe' : '1px solid #e2e8f0', fontSize: isMobile ? '11px' : '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    ✏️ Editar
                                  </button>
                                  {/* AJUSTAR POSICIÓN */}
                                  <button type="button" onClick={() => { setAdjustTarget(i); setMaskThreshold(types[i]?.maskThreshold || 58); setWhiteThreshold(types[i]?.whiteThreshold || 64); }} style={{ padding: isMobile ? '8px 10px' : '10px 16px', borderRadius: '10px', background: adjustTarget === i ? '#0ea5e9' : 'white', color: adjustTarget === i ? 'white' : '#0ea5e9', border: '1px solid #0ea5e9', fontSize: isMobile ? '11px' : '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    Ajustar
                                  </button>
                                  {/* ELIMINAR */}
                                  <button type="button" onClick={() => { setTypes(types.filter((_, idx) => idx !== i)); if (editingTypeIndex === i) cancelTypeEdit(); if (adjustTarget === i) setAdjustTarget('main'); }} style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', borderRadius: '10px', background: '#fef2f2', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <svg width={isMobile ? "14" : "18"} height={isMobile ? "14" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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
                    {/* Sticky Preview Header */}
                    <div style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 100,
                      background: '#f8fafc',
                      padding: '8px 0 20px 0',
                      marginTop: '-8px', // offset inner padding
                      borderBottom: '1px solid rgba(0,0,0,0.03)',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center', gap: '8px', marginBottom: '16px' }}>
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
                            src={getActiveSettings().image}
                            maskSrc={getActiveSettings().maskImage}
                            color={
                              activeTab === 'types'
                                ? (editingTypeColorIndex !== null ? tempTypeColorHex : (tempTypeColors.length > 0 ? tempTypeColors[0].hex : 'transparent'))
                                : activeTab === 'colors'
                                  ? (editingColorIndex !== null
                                    ? (tempColorFile || colors[editingColorIndex]?.image ? 'transparent' : tempColorHex)
                                    : (tempColorFile ? 'transparent' : (colors.length > 0 ? (typeof colors[0] === 'object' ? colors[0].hex : colors[0]) : 'transparent')))
                                  : (colors.length > 0 ? (typeof colors[0] === 'object' ? colors[0].hex : colors[0]) : 'transparent')
                            }
                            textureSrc={
                              activeTab === 'types'
                                ? (editingTypeIndex !== null && editingTypeColorIndex !== null && types[editingTypeIndex]?.colors[editingTypeColorIndex]?.image)
                                : activeTab === 'colors'
                                  ? (tempColorFile && tempColorFile !== 'clear' ? URL.createObjectURL(tempColorFile) : (editingColorIndex !== null ? colors[editingColorIndex]?.image : null))
                                  : (colors.length > 0 && typeof colors[0] === 'object' ? (colors[0].file || colors[0].image) : null)
                            }
                            textureTransform={
                              activeTab === 'colors'
                                ? tempColorTransform
                                : (activeTab === 'types' && editingTypeIndex !== null && editingTypeColorIndex !== null ? (types[editingTypeIndex].colors[editingTypeColorIndex].textureTransform || { scale: 1, x: 0, y: 0 }) : (colors.length > 0 && typeof colors[0] === 'object' ? colors[0].textureTransform : { scale: 1, x: 0, y: 0 }))
                            }
                            baseHue={getActiveSettings().baseHue}
                            transform={getActiveSettings().imageTransform}
                            lumina={getActiveSettings().lumina}
                            sceneSrc={productSceneFile || (editingProduct?.sceneBackground || (sceneFile || settings.productSceneBackground))}
                          />
                        </div>
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
                          <div style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#1e293b', padding: '4px 12px', borderRadius: '12px', fontSize: '9px', fontWeight: '900', border: '1px solid #e2e8f0', backdropFilter: 'blur(4px)' }}>
                            {getActiveSettings().label}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr', gap: '16px' }}>
                      {/* Universal Reset */}
                      <button
                        onClick={() => updateActiveSettings({ imageTransform: { scale: 1, x: 0, y: 0 }, lumina: { brightness: 1, contrast: 1 } })}
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
                          <input type="range" min="0.1" max="3" step="0.01" value={getActiveSettings().imageTransform.scale} onChange={(e) => updateActiveSettings({ imageTransform: { ...getActiveSettings().imageTransform, scale: parseFloat(e.target.value) } })} style={{ width: '100%', accentColor: '#c5a059', height: '6px', cursor: 'pointer' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Control Card: X */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '12px' }}>EJE X</span>
                          <input type="range" min="-100" max="100" value={getActiveSettings().imageTransform.x} onChange={(e) => updateActiveSettings({ imageTransform: { ...getActiveSettings().imageTransform, x: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: '#c5a059', height: '4px' }} />
                        </div>
                        {/* Control Card: Y */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '12px' }}>EJE Y</span>
                          <input type="range" min="-100" max="100" value={getActiveSettings().imageTransform.y} onChange={(e) => updateActiveSettings({ imageTransform: { ...getActiveSettings().imageTransform, y: parseInt(e.target.value) } })} style={{ width: '100%', accentColor: '#c5a059', height: '4px' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        {/* Control Card: Briilo */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '10px', fontWeight: '900', color: getActiveSettings().isColorMode ? '#2563eb' : '#64748b', display: 'block', marginBottom: '12px' }}>
                            {getActiveSettings().isColorMode ? 'BRILLO DEL COLOR' : 'BRILLO'}
                          </span>
                          <input type="range" min="0.5" max="1.5" step="0.01" value={getActiveSettings().lumina?.brightness ?? 1} onChange={(e) => updateActiveSettings({ lumina: { ...(getActiveSettings().lumina || { brightness: 1, contrast: 1 }), brightness: parseFloat(e.target.value) } })} style={{ width: '100%', accentColor: getActiveSettings().isColorMode ? '#2563eb' : '#334155', height: '4px' }} />
                        </div>
                        {/* Control Card: Sombras */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '10px', fontWeight: '900', color: getActiveSettings().isColorMode ? '#2563eb' : '#64748b', display: 'block', marginBottom: '12px' }}>
                            {getActiveSettings().isColorMode ? 'SOMBRAS DEL COLOR' : 'SOMBRAS'}
                          </span>
                          <input type="range" min="0.5" max="1.5" step="0.01" value={getActiveSettings().lumina?.contrast ?? 1} onChange={(e) => updateActiveSettings({ lumina: { ...(getActiveSettings().lumina || { brightness: 1, contrast: 1 }), contrast: parseFloat(e.target.value) } })} style={{ width: '100%', accentColor: getActiveSettings().isColorMode ? '#2563eb' : '#334155', height: '4px' }} />
                        </div>
                      </div>
                    </div>

                    {/* Mask Threshold Sliders */}
                    {adjustTarget !== 'main' && types[adjustTarget] && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>1. Recorte de Fondo</span>
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Sensibilidad al color del fondo</span>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: '#3b82f6' }}>{maskThreshold}</span>
                          </div>
                          <input type="range" min="10" max="120" value={maskThreshold} onChange={(e) => { userTouchedThreshold.current = true; const v = parseInt(e.target.value); setMaskThreshold(v); if (adjustTarget !== 'main' && types[adjustTarget]) { const nt = [...types]; nt[adjustTarget] = { ...nt[adjustTarget], maskThreshold: v }; setTypes(nt); } }} style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }} />
                        </div>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>2. Limpieza de Tapa (Blancos)</span>
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Sube si la tapa blanca aun se ve con color.</span>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: '#3b82f6' }}>{whiteThreshold}</span>
                          </div>
                          <input type="range" min="10" max="120" value={whiteThreshold} onChange={(e) => { userTouchedThreshold.current = true; const v = parseInt(e.target.value); setWhiteThreshold(v); if (adjustTarget !== 'main' && types[adjustTarget]) { const nt = [...types]; nt[adjustTarget] = { ...nt[adjustTarget], whiteThreshold: v }; setTypes(nt); } }} style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => { const t = types[adjustTarget]; const src = t.file || t.image; if (!src) { alert('Sin imagen para generar mascara.'); return; } generateAutoMask(src, (mb) => { const nt = [...types]; nt[adjustTarget] = { ...nt[adjustTarget], maskFile: mb }; setTypes(nt); }); }}
                          style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '10px 16px', borderRadius: '14px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textAlign: 'center' }}
                        >
                          Regenerar Mascara del Modelo
                        </button>
                      </div>
                    )}
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
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
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
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
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
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
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
