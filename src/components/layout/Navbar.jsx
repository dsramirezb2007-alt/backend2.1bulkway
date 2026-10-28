import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="new-nav">
      <div className="container new-nav-inner">

        <Link className="new-brand" to="/">
          <span>BULK</span>
          <b>WAY</b>
          <small>GESTIÓN EMPRESARIAL</small>
        </Link>

        <div className="new-nav-links">
          <a href="#empresa">Plataforma</a>
          <a href="#servicios">Funciones</a>
          <a href="#operacion">Operación</a>

          <Link className="new-login" to="/login">
            <span>Portal</span>
            <i className="bi bi-arrow-up-right"></i>
          </Link>
        </div>

      </div>
    </nav>
  )
}

export default Navbar