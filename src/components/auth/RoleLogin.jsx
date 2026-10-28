import { Link } from 'react-router-dom'

const roles = [
  {
    id: 'cliente',
    icon: 'bi-person',
    title: 'Cliente',
    text: 'Consulta productos, crea pedidos y revisa tus entregas.',
    path: '/login/cliente',
  },
  {
    id: 'conductor',
    icon: 'bi-truck',
    title: 'Conductor',
    text: 'Consulta tus entregas, rutas y despachos asignados.',
    path: '/login/conductor',
  },
]

function RoleLogin() {
  return (
    <div className="auth-page">
      <div className="auth-layout role-selector">
        <aside className="auth-brand-panel">
          <div>
            <div className="brand-orb">BW</div>
            <p className="eyebrow-light" style={{marginTop:28}}>PORTAL DE OPERACIONES</p>
            <h2>Todo el movimiento de tus productos, en un solo lugar.</h2>
            <p>Una plataforma para organizar catálogo, pedidos, inventario y distribución de productos de aseo.</p>
          </div>
          <div className="auth-features">
            <div className="auth-feature"><i className="bi bi-box-seam"/> Inventario y pedidos</div>
            <div className="auth-feature"><i className="bi bi-truck"/> Despachos y distribución</div>
            <div className="auth-feature"><i className="bi bi-receipt"/> Facturación y seguimiento</div>
          </div>
        </aside>
        <main className="auth-panel">
          <Link to="/" className="auth-back">← Volver al inicio</Link>
          <p className="auth-eyebrow">BULKWAY</p>
          <h1>Elige tu acceso</h1>
          <p className="auth-copy">Selecciona el espacio que corresponde a tu actividad dentro de la operación.</p>
          <div className="role-grid">
            {roles.map(role => (
              <Link className="role-option" to={role.path} key={role.id}>
                <span className="role-icon"><i className={`bi ${role.icon}`} /></span>
                <span><strong>{role.title}</strong><small>{role.text}</small></span>
                <i className="bi bi-arrow-up-right role-arrow" />
              </Link>
            ))}
          </div>
            <div className="register-options" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '12px'
              }} >
              <Link
                to="/registro?rol=cliente"
                className="register-option"
              >
                <i className="bi bi-person" />
                <span>Crear cuenta como cliente</span>
              </Link>

              <Link
                to="/registro?rol=conductor"
                className="register-option"
              >
                <i className="bi bi-truck" />
                <span>Crear cuenta como conductor</span>
              </Link>
            </div>    
        </main>
      </div>
    </div>
  )
}

export default RoleLogin
