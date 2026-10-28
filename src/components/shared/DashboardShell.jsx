import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function DashboardShell({ role, menu, active, setActive, title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const salir = async () => { await cerrarSesion(); navigate('/login') }
  const roleLabel = role === 'administrador' ? 'ADMIN' : role === 'conductor' ? 'DISTRIBUCIÓN' : 'CLIENTE'

  return (
    <div className={`new-app-shell role-${role}`}>
      <header className="workspace-header">
        <div className="workspace-brand"><span>BULK<b>WAY</b></span><small>{roleLabel}</small></div>
        <button className="workspace-mobile" onClick={() => setMobileOpen(!mobileOpen)}><i className="bi bi-list" /></button>
        <nav className={`workspace-nav ${mobileOpen ? 'open' : ''}`}>
          {menu.map(item => <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => { setActive(item.id); setMobileOpen(false) }}><i className={`bi ${item.icon}`} /><span>{item.label}</span></button>)}
        </nav>
        <div className="workspace-user"><div><strong>{usuario?.user_metadata?.nombre || usuario?.email || 'Usuario'}</strong><small>{roleLabel}</small></div><button onClick={salir} title="Cerrar sesión"><i className="bi bi-box-arrow-right" /></button></div>
      </header>

      <main className="workspace-main">
        <div className="workspace-heading">
          <div><span className="workspace-index">{role === 'administrador' ? '01' : role === 'conductor' ? 'RUTA' : 'CUENTA'}</span><h1>{title}</h1></div>
          <span className="workspace-date">CENTRO DE OPERACIONES</span>
        </div>
        <div className="workspace-body">{children}</div>
      </main>
    </div>
  )
}
export default DashboardShell
