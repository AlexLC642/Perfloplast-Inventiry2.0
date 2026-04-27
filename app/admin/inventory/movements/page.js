'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MovementsPage() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [type, setType] = useState('ENTRY');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movRes, prodRes, whRes] = await Promise.all([
        fetch('/api/inventory/movements'),
        fetch('/api/products'),
        fetch('/api/inventory/warehouses')
      ]);
      
      const movData = await movRes.json();
      const prodData = await prodRes.json();
      const whData = await whRes.json();

      if (Array.isArray(movData)) setMovements(movData);
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(whData)) setWarehouses(whData);
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
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, warehouseId, type, quantity, reason }),
      });
      if (res.ok) {
        setShowModal(false);
        setProductId('');
        setWarehouseId('');
        setQuantity('');
        setReason('');
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al registrar movimiento');
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
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>Movimientos</h1>
          <p style={{ color: '#64748b' }}>Registro histórico de entradas y salidas de inventario.</p>
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
          + Nuevo Movimiento
        </motion.button>
      </header>

      {/* Movements Table */}
      <div style={{ background: 'white', borderRadius: '32px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Fecha</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Producto</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Almacén</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Tipo</th>
              <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Cargando movimientos...</td></tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 24px', fontSize: '14px', color: '#1a1a1b' }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1b', margin: 0 }}>{m.product.name}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>SKU: {m.product.sku}</p>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>{m.warehouse.name}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: '800',
                      background: m.type === 'ENTRY' ? '#ecfdf5' : '#fef2f2',
                      color: m.type === 'ENTRY' ? '#059669' : '#ef4444'
                    }}>
                      {m.type === 'ENTRY' ? 'ENTRADA' : 'SALIDA'}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: '16px', fontWeight: '800', color: '#1a1a1b', textAlign: 'right' }}>
                    {m.type === 'ENTRY' ? '+' : '-'}{m.quantity}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Registrar Movimiento</h2>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Producto</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: 'white' }}
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Almacén</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    required
                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: 'white' }}
                  >
                    <option value="">Selecciona almacén</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: 'white' }}
                  >
                    <option value="ENTRY">Entrada</option>
                    <option value="EXIT">Salida</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Cantidad</label>
                  <input
                    type="number"
                    step="0.001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    placeholder="0.000"
                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Motivo</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Producción diaria"
                    style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', gridColumn: 'span 2' }}>
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
                    {saving ? 'Registrando...' : 'Confirmar Movimiento'}
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
