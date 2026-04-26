import { useState } from 'react'
import { loginUser, TOKEN_KEY } from '../services/api'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) { setError('Username and password are required'); return }
    setError('')
    setLoading(true)
    try {
      const data = await loginUser(username.trim(), password)
      localStorage.setItem(TOKEN_KEY, data.access_token)
      onLogin({ username: data.username, role: data.role })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed — check credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Exo 2', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Login card */}
      <div style={{
        width: 420,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '40px 36px',
        position: 'relative',
        boxShadow: '0 0 60px rgba(0,212,255,0.08), 0 24px 48px rgba(0,0,0,0.6)',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 36, right: 36, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
          borderRadius: 1,
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, color: 'var(--cyan)', marginBottom: 10 }}>⬡</div>
          <div style={{
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 700,
            color: 'var(--cyan)',
            fontSize: 16,
            letterSpacing: 2,
            marginBottom: 4,
          }}>
            <span style={{ color: 'var(--red)' }}>IARM</span> VAPT REPORTS
          </div>
          <div style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: 1 }}>
            Secure Access — v1.0
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} autoComplete="on">
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 10, color: 'var(--dim)',
              letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
            }}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: 'var(--dim)',
              }}>⬡</span>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                style={{
                  width: '100%', background: '#0a0f14',
                  border: '1px solid var(--border)', borderRadius: 6,
                  padding: '10px 12px 10px 34px',
                  color: 'var(--text)', fontFamily: "'Exo 2', sans-serif",
                  fontSize: 13, outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--cyan)'
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,212,255,0.15)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block', fontSize: 10, color: 'var(--dim)',
              letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: 'var(--dim)',
              }}>🔑</span>
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', background: '#0a0f14',
                  border: '1px solid var(--border)', borderRadius: 6,
                  padding: '10px 40px 10px 34px',
                  color: 'var(--text)', fontFamily: "'Exo 2', sans-serif",
                  fontSize: 13, outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--cyan)'
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,212,255,0.15)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--dim)', fontSize: 12, padding: 4,
                }}
                title={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)',
              borderLeft: '3px solid var(--red)', borderRadius: 6,
              padding: '10px 14px', fontSize: 12, color: '#ff8888',
              marginBottom: 18,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.12)',
              border: '1px solid var(--cyan)',
              borderRadius: 6,
              color: 'var(--cyan)',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(0,212,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = loading ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.12)' }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--cyan)' }} /> AUTHENTICATING...</>
              : '→ SIGN IN'
            }
          </button>
        </form>

      </div>
    </div>
  )
}
