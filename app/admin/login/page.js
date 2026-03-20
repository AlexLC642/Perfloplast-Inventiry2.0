'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin/dashboard');
      } else {
        setError(data.message || 'Error de autenticación');
      }
    } catch (err) {
      setError('Ocurrió un error al intentar iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'transparent' }}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
          width: '100%', 
          maxWidth: '440px', 
          padding: '60px 48px', 
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '40px',
          border: '1px solid rgba(197, 160, 89, 0.2)',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative corner accent */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle at top right, rgba(197, 160, 89, 0.15), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative' }}>
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{ 
              width: '72px', 
              height: '72px', 
              background: 'linear-gradient(135deg, #c5a059 0%, #a38241 100%)', 
              borderRadius: '22px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              color: 'white',
              boxShadow: '0 12px 24px -6px rgba(197, 160, 89, 0.4)'
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </motion.div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.25em', 
            color: '#c5a059', 
            marginBottom: '12px', 
            fontWeight: '800' 
          }}>
            Panel de Control
          </h1>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1a1a1b', 
            letterSpacing: '-0.03em',
            margin: 0
          }}>
            Identificación
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Solo personal autorizado</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#1a1a1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correo Corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nombre@perfloplast.com"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(197, 160, 89, 0.1)',
                padding: '16px 20px',
                borderRadius: '16px',
                color: '#1a1a1b',
                outline: 'none',
                fontSize: '15px',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#c5a059';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 0 0 4px rgba(197, 160, 89, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(197, 160, 89, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#1a1a1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(197, 160, 89, 0.1)',
                padding: '16px 20px',
                borderRadius: '16px',
                color: '#1a1a1b',
                outline: 'none',
                fontSize: '15px',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#c5a059';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 0 0 4px rgba(197, 160, 89, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(197, 160, 89, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
              }}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ background: '#fef2f2', color: '#ef4444', padding: '14px', borderRadius: '14px', fontSize: '13px', textAlign: 'center', border: '1px solid #fee2e2', fontWeight: '600' }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #1a1a1b 0%, #334155 100%)',
              color: 'white',
              border: 'none',
              padding: '18px',
              borderRadius: '20px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '12px',
              fontSize: '16px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}
                />
                <span>Validando Acceso</span>
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
