'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ productSceneBackground: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success('Configuración guardada correctamente');
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando configuración...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1a1a1b', marginBottom: '8px' }}>
          Configuración del Catálogo
        </h1>
        <p style={{ color: '#64748b' }}>Personaliza la apariencia global de tu catálogo premium.</p>
      </header>

      <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1a1a1b', marginBottom: '12px' }}>
            URL del Fondo del Catálogo (Mármol u otro)
          </label>
          <input 
            type="text" 
            value={settings.productSceneBackground}
            onChange={(e) => setSettings({ ...settings, productSceneBackground: e.target.value })}
            placeholder="https://ejemplo.com/fondo.jpg"
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '14px'
            }}
          />
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            Esta imagen se usará como fondo en todas las tarjetas de productos del catálogo.
          </p>
        </div>

        {settings.productSceneBackground && (
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase' }}>Vista Previa</span>
            <div style={{ width: '100%', height: '200px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <img src={settings.productSceneBackground} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          style={{
            background: 'linear-gradient(135deg, #1a1a1b 0%, #334155 100%)',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            marginTop: '24px'
          }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </motion.button>
      </div>
    </div>
  );
}
