import { useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Banknote, Boxes, Package, Tags, ClipboardList, Settings } from 'lucide-react'
import { isConfigured } from '../../lib/supabase'
import { useAdminAuth } from '../../lib/useAdminAuth'

export default function AdminLayout() {
  const { session, state, signIn, signOut } = useAdminAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isConfigured) {
    return (
      <div className="setup-warning">
        Falta conectar Supabase (variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>). Mira LEEME.md.
      </div>
    )
  }

  if (state === 'loading') return <div className="admin"><div className="admin-main">Cargando…</div></div>

  if (state === 'out') {
    return (
      <div className="admin">
        <form
          className="login card"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setError('')
            const { error: err } = await signIn(email.trim(), password)
            if (err) setError('Correo o contraseña incorrectos.')
            setBusy(false)
          }}
        >
          <img src="/logo.svg" alt="Tendencia Store" />
          <h1 style={{ textAlign: 'center' }}>Panel administrador</h1>
          <p className="sub" style={{ textAlign: 'center' }}>Ingresa con tu cuenta de administrador.</p>
          {error && <div className="error">{error}</div>}
          <label className="field">
            <span>Correo</span>
            <input className="input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="btn pink" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    )
  }

  if (state === 'not-admin') {
    return (
      <div className="admin">
        <div className="login card">
          <h1>Sin permisos</h1>
          <p className="sub">
            La cuenta <strong>{session?.user.email}</strong> no está autorizada como administrador. Revisa el paso 3 del LEEME.md.
          </p>
          <button className="btn" onClick={() => void signOut()}>Cerrar sesión</button>
        </div>
      </div>
    )
  }

  if (state === 'seller' && !['/admin/punto-de-venta', '/admin/inventario'].includes(location.pathname)) {
    return <Navigate to="/admin/punto-de-venta" replace />
  }

  return (
    <div className="admin">
      <div className="admin-top">
        <strong>TENDENCIA STORE · Admin</strong>
        <nav className="admin-nav">
          <NavLink to="punto-de-venta" className={({ isActive }) => (isActive ? 'active' : '')}><Banknote size={15}/> Punto de venta</NavLink>
          <NavLink to="inventario" className={({ isActive }) => (isActive ? 'active' : '')}><Boxes size={15}/> Inventario</NavLink>
          {state === 'admin' && <NavLink to="productos" className={({ isActive }) => (isActive ? 'active' : '')}><Package size={15}/> Productos</NavLink>}
          {state === 'admin' && <NavLink to="categorias" className={({ isActive }) => (isActive ? 'active' : '')}><Tags size={15}/> Categorías</NavLink>}
          {state === 'admin' && <NavLink to="pedidos" className={({ isActive }) => (isActive ? 'active' : '')}><ClipboardList size={15}/> Pedidos</NavLink>}
          {state === 'admin' && <NavLink to="ajustes" className={({ isActive }) => (isActive ? 'active' : '')}><Settings size={15}/> Ajustes</NavLink>}
        </nav>
        <span>
          <a className="link" href="/" target="_blank" rel="noopener noreferrer">Ver tienda</a>
          {' · '}
          <button className="link" onClick={() => void signOut()}>Salir</button>
        </span>
      </div>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
