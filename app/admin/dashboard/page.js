'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [editingColor, setEditingColor] = useState(null); // { name, hex, products }
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Confirm Delete State
  const [deletingColor, setDeletingColor] = useState(null);

  // Fetch all products on mount to build the live stats & color list
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Compute live unique catalog colors with list of associated products
  const uniqueColors = useMemo(() => {
    const colorMap = new Map();
    
    products.forEach(p => {
      if (p.colors && Array.isArray(p.colors)) {
        p.colors.forEach(c => {
          if (c && c.name) {
            const rawName = c.name.trim();
            if (rawName) {
              const capitalized = rawName.charAt(0).toUpperCase() + rawName.slice(1);
              const lowerKey = capitalized.toLowerCase();
              
              if (colorMap.has(lowerKey)) {
                const existing = colorMap.get(lowerKey);
                // Avoid duplicating the same product reference
                if (!existing.products.some(prod => prod.id === p.id)) {
                  existing.products.push(p);
                }
              } else {
                colorMap.set(lowerKey, {
                  name: capitalized,
                  hex: c.hex || '#ffffff',
                  image: c.image || c.imageUrl || null,
                  products: [p]
                });
              }
            }
          }
        });
      }
    });

    return Array.from(colorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Find duplicates that can be auto-unified (differ by casing or trailing spaces)
  const duplicatesToUnify = useMemo(() => {
    const countMap = new Map(); // lowercase -> array of raw names
    const duplicates = [];

    products.forEach(p => {
      if (p.colors && Array.isArray(p.colors)) {
        p.colors.forEach(c => {
          if (c && c.name) {
            const rawName = c.name;
            const lowerKey = rawName.trim().toLowerCase();
            if (!countMap.has(lowerKey)) {
              countMap.set(lowerKey, []);
            }
            const arr = countMap.get(lowerKey);
            if (!arr.includes(rawName)) {
              arr.push(rawName);
            }
          }
        });
      }
    });

    countMap.forEach((rawNames, lowerKey) => {
      if (rawNames.length > 1) {
        const targetCapitalized = lowerKey.charAt(0).toUpperCase() + lowerKey.slice(1);
        duplicates.push({
          target: targetCapitalized,
          rawList: rawNames
        });
      }
    });

    return duplicates;
  }, [products]);

  // Global Rename/Unify API Call
  const handleRenameColor = async (e) => {
    e.preventDefault();
    if (!editingColor || !newName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/colors/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: editingColor.name,
          newName: newName.trim(),
          hex: newHex
        })
      });

      if (res.ok) {
        alert(`✅ Color '${editingColor.name}' actualizado y unificado correctamente.`);
        setEditingColor(null);
        fetchProducts(); // Refresh products
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.error || 'No se pudo actualizar'}`);
      }
    } catch (error) {
      alert(`❌ Error en la red: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Global Delete Color API Call
  const handleDeleteColor = async () => {
    if (!deletingColor) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/colors/rename', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colorName: deletingColor.name
        })
      });

      if (res.ok) {
        alert(`🗑️ El color '${deletingColor.name}' fue removido de todo el catálogo con éxito.`);
        setDeletingColor(null);
        fetchProducts(); // Refresh products
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.error || 'No se pudo eliminar'}`);
      }
    } catch (error) {
      alert(`❌ Error en la red: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-Unify All duplicate casings/spaces
  const handleAutoUnify = async () => {
    if (duplicatesToUnify.length === 0) {
      alert('✨ ¡No se encontraron colores duplicados por minúsculas/mayúsculas! Tu catálogo ya está ordenado.');
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    try {
      for (const dup of duplicatesToUnify) {
        // Find raw names that are different from the target
        const rawToUnify = dup.rawList.filter(name => name !== dup.target);
        for (const rawName of rawToUnify) {
          const res = await fetch('/api/colors/rename', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oldName: rawName,
              newName: dup.target
            })
          });
          if (res.ok) successCount++;
        }
      }
      alert(`✨ ¡Unificación exitosa! Se corrigieron y fusionaron ${successCount} nombres de color duplicados.`);
      fetchProducts();
    } catch (error) {
      alert(`❌ Error al auto-unificar: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '1280px', 
      margin: '0 auto', 
      padding: '40px 24px',
      background: 'url("https://res.cloudinary.com/dlp8m8vst/image/upload/v1713110291/Perfloplast/bg-marble_u8v6v6.jpg")',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      borderRadius: '32px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header Area */}
      <header style={{ 
        marginBottom: '40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        padding: '24px 32px',
        borderRadius: '24px',
        border: '1px solid white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.03)'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Panel de Control Administrativo
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500', margin: 0 }}>
            Visualiza estadísticas en tiempo real y gestiona todos los colores del catálogo de forma global.
          </p>
        </div>
        <button 
          onClick={fetchProducts} 
          style={{ 
            background: 'white', 
            border: '1px solid #cbd5e1', 
            borderRadius: '12px', 
            padding: '10px 16px', 
            fontSize: '13px', 
            fontWeight: '700', 
            color: '#334155', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
        >
          🔄 Actualizar Datos
        </button>
      </header>

      {/* Stats and Navigation cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <motion.div 
          whileHover={{ y: -4 }}
          style={{ background: 'white', padding: '24px 28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div style={{ fontSize: '36px', background: '#f0fdf4', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total de Productos</p>
            <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#1e293b' }}>{loading ? '...' : products.length}</h3>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          style={{ background: 'white', padding: '24px 28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div style={{ fontSize: '36px', background: '#eff6ff', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎨</div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Colores Únicos</p>
            <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#1e293b' }}>{loading ? '...' : uniqueColors.length}</h3>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          style={{ background: 'white', padding: '24px 28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div style={{ fontSize: '36px', background: '#fffbeb', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Acción Rápida</p>
            <a href="/admin/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #c5a059 0%, #ab853e 100%)', color: 'white', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 4px 12px rgba(197, 160, 89, 0.2)' }}>
              Ir al Catálogo 🎨
            </a>
          </div>
        </motion.div>
      </div>

      {/* Global Color Organizer Area */}
      <section style={{ 
        background: 'rgba(255, 255, 255, 0.85)', 
        backdropFilter: 'blur(25px)', 
        padding: '40px', 
        borderRadius: '32px', 
        border: '1px solid white',
        boxShadow: '0 12px 40px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '6px' }}>
              🎨 Organizador Global de Colores
            </h2>
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
              Edita el nombre de un color una vez, y se cambiará automáticamente en todos los productos que lo utilicen.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {duplicatesToUnify.length > 0 && (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAutoUnify}
                disabled={submitting}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  padding: '12px 20px', 
                  fontSize: '13px', 
                  fontWeight: '800', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)'
                }}
              >
                ✨ Auto-Unificar {duplicatesToUnify.length} Duplicados
              </motion.button>
            )}
          </div>
        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #cbd5e1', borderTopColor: '#c5a059', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '600' }}>Cargando catálogo de colores...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : uniqueColors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
            <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 16px 0', fontWeight: '500' }}>No se encontraron colores en el catálogo actual.</p>
            <a href="/admin/catalog" style={{ display: 'inline-block', background: '#1a1a1b', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', fontSize: '14px' }}>
              Crear variantes de color en el Catálogo
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {uniqueColors.map((c) => {
              const productNames = c.products.map(p => p.name).join(', ');
              return (
                <motion.div 
                  key={c.name + c.hex}
                  whileHover={{ y: -3 }}
                  style={{ 
                    background: 'white', 
                    borderRadius: '20px', 
                    padding: '20px', 
                    border: '1px solid #f1f5f9', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.015)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Visual Color Circle / Texture thumbnail */}
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '16px', 
                      background: c.hex,
                      backgroundImage: c.image ? `url(${c.image})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.04)'
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.name}
                      </h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: '600' }}>
                        {c.hex.toUpperCase()}
                      </p>
                      <span 
                        title={`Productos: ${productNames}`}
                        style={{ 
                          fontSize: '11px', 
                          fontWeight: '800', 
                          background: '#f1f5f9', 
                          color: '#475569', 
                          padding: '4px 8px', 
                          borderRadius: '8px',
                          cursor: 'help'
                        }}
                      >
                        👥 Usado en {c.products.length} {c.products.length === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                    <button 
                      onClick={() => {
                        setEditingColor(c);
                        setNewName(c.name);
                        setNewHex(c.hex);
                      }}
                      style={{ 
                        flex: 1, 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '10px', 
                        padding: '8px 12px', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        color: '#475569', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
                    >
                      ✏️ Renombrar / Unificar
                    </button>
                    
                    <button 
                      onClick={() => setDeletingColor(c)}
                      style={{ 
                        background: '#fff5f5', 
                        border: '1px solid #fee2e2', 
                        borderRadius: '10px', 
                        width: '36px', 
                        height: '34px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        color: '#ef4444',
                        transition: 'all 0.2s'
                      }}
                      title="Eliminar de todo el catálogo"
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* RENAME / MERGE MODAL */}
      <AnimatePresence>
        {editingColor && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingColor(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              style={{ 
                position: 'relative', 
                background: 'white', 
                borderRadius: '24px', 
                padding: '32px', 
                maxWidth: '480px', 
                width: '100%', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                border: '1px solid #f1f5f9'
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>
                ✏️ Renombrar / Unificar Color
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
                Estás cambiando el nombre de <strong style={{ color: '#1e293b' }}>'{editingColor.name}'</strong> de forma global. Se actualizará automáticamente en <strong style={{ color: '#c5a059' }}>{editingColor.products.length} productos</strong>.
                <br />
                Si ingresas un nombre que ya existe (ej: "Azul"), se fusionará bajo el mismo color de manera ordenada.
              </p>

              <form onSubmit={handleRenameColor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Nombre del Color</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Azul Marino"
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Código Hex (Opcional)</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
                      <input 
                        type="color" 
                        value={newHex}
                        onChange={(e) => setNewHex(e.target.value)}
                        style={{ position: 'absolute', inset: '-5px', width: '150%', height: '150%', border: 'none', cursor: 'pointer' }}
                      />
                    </div>
                    <input 
                      type="text" 
                      value={newHex}
                      onChange={(e) => setNewHex(e.target.value)}
                      placeholder="#ffffff"
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setEditingColor(null)}
                    style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '13px', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ 
                      flex: 1, 
                      background: 'linear-gradient(135deg, #c5a059 0%, #ab853e 100%)', 
                      border: 'none', 
                      borderRadius: '12px', 
                      padding: '14px', 
                      fontSize: '13px', 
                      fontWeight: '800', 
                      color: 'white', 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(197, 160, 89, 0.25)'
                    }}
                  >
                    {submitting ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {deletingColor && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingColor(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              style={{ 
                position: 'relative', 
                background: 'white', 
                borderRadius: '24px', 
                padding: '32px', 
                maxWidth: '440px', 
                width: '100%', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                border: '1px solid #f1f5f9'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '16px', textAlign: 'center' }}>⚠️</div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>
                ¿Eliminar de todo el catálogo?
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px', textAlign: 'center' }}>
                Estás a punto de eliminar el color <strong style={{ color: '#ef4444' }}>'{deletingColor.name}'</strong> de todos los productos que lo utilizan en el catálogo (<strong style={{ color: '#1e293b' }}>{deletingColor.products.length} productos</strong>).
                <br /><br />
                <span style={{ color: '#ef4444', fontWeight: '700' }}>Esta acción es permanente y no se puede deshacer.</span>
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setDeletingColor(null)}
                  style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '13px', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteColor}
                  disabled={submitting}
                  style={{ 
                    flex: 1, 
                    background: '#ef4444', 
                    border: 'none', 
                    borderRadius: '12px', 
                    padding: '14px', 
                    fontSize: '13px', 
                    fontWeight: '800', 
                    color: 'white', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
                  }}
                >
                  {submitting ? 'Eliminando...' : 'Sí, Eliminar de Todo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer style={{ marginTop: '64px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
        Perflo-Plast © 2026 | Sistema de Catálogo Master Premium
      </footer>
    </div>
  );
}
