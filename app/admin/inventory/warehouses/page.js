'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/inventory/warehouses');
      const data = await res.json();
      if (Array.isArray(data)) setWarehouses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location }),
      });
      if (res.ok) {
        setShowModal(false);
        setName('');
        setLocation('');
        fetchWarehouses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>Almacenes</h1>
          <p style={{ color: '#64748b' }}>Gestiona las ubicaciones físicas de tu inventario.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #1a1a1b 0%, #334155 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.2)'
          }}
        >
          + Nuevo Almacén
        </motion.button>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>Cargando almacenes...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {warehouses.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: '24px',
                background: 'white',
                borderRadius: '24px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏢</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1b', marginBottom: '4px' }}>{w.name}</h3>
              <p style={{ fontSize: '14px', color: '#64748b' }}>{w.location || 'Sin ubicación definida'}</p>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '12px', padding: '4px 12px', background: '#f1f5f9', borderRadius: '20px', color: '#475569', fontWeight: '600' }}>
                  ID: {w.id}
                </span>
                <span style={{ fontSize: '12px', padding: '4px 12px', background: '#ecfdf5', borderRadius: '20px', color: '#059669', fontWeight: '600' }}>
                  Activo
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '100%', maxWidth: '500px', background: 'white', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Crear Nuevo Almacén</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Nombre del Almacén</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ej. Bodega Central"
                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Ubicación / Dirección</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej. Zona Industrial Sur"
                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#1a1a1b', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {saving ? 'Guardando...' : 'Crear Almacén'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
