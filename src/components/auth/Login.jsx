import { useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { supabase } from '../../services/supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const navigate = useNavigate()

  const iniciarSesion = async (e) => {
    e.preventDefault()

    setMensaje('')
    setCargando(true)

    if (!supabase) {
      setMensaje('Configura las variables de Supabase en el archivo .env.')
      setCargando(false)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      setMensaje('Correo o contraseña incorrectos.')
      setCargando(false)
      return
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (perfilError || !perfil) {
      await supabase.auth.signOut()
      setMensaje('No se encontró el perfil de esta cuenta.')
      setCargando(false)
      return
    }

    const rol = perfil.role?.toLowerCase()

    console.log('Usuario autenticado:', data.user.email)
    console.log('Perfil encontrado:', perfil)
    console.log('Rol normalizado:', rol)

    if (!rol) {
      await supabase.auth.signOut()
      setMensaje('Esta cuenta no tiene un rol configurado.')
      setCargando(false)
      return
    }

    if (rol === 'administrador') {
      navigate('/admin', { replace: true })
      return
    }

    if (rol === 'conductor') {
      navigate('/conductor', { replace: true })
      return
    }

    if (rol === 'cliente') {
      navigate('/cliente', { replace: true })
      return
    }

    await supabase.auth.signOut()
    setMensaje('El rol de esta cuenta no es válido.')
    setCargando(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-background-glow auth-glow-one"></div>
      <div className="auth-background-glow auth-glow-two"></div>

      <div className="auth-shell">
        <section className="auth-visual">
          <Link to="/" className="auth-brand">
            <span className="auth-brand-main">
              BULK<b>WAY</b>
            </span>
            <span className="auth-brand-sub">
              GESTIÓN EMPRESARIAL
            </span>
          </Link>

          <div className="auth-visual-content">
            <p className="auth-eyebrow">
              CENTRO DE OPERACIONES
            </p>

            <h1>
              Tu operación,
              <br />
              <em>conectada.</em>
            </h1>

            <p className="auth-visual-copy">
              Centraliza pedidos, inventario, rutas y distribución
              en una plataforma diseñada para mantener tu empresa
              organizada.
            </p>

            <div className="operation-board">
              <div className="board-grid"></div>

              <div className="board-line board-line-one"></div>
              <div className="board-line board-line-two"></div>
              <div className="board-line board-line-three"></div>
              <div className="board-line board-line-four"></div>

              <div className="board-node board-node-top">
                <i className="bi bi-people"></i>
                <span>Clientes</span>
              </div>

              <div className="board-node board-node-left">
                <i className="bi bi-box-seam"></i>
                <span>Pedidos</span>
              </div>

              <div className="board-node board-node-right">
                <i className="bi bi-map"></i>
                <span>Rutas</span>
              </div>

              <div className="board-node board-node-bottom">
                <i className="bi bi-boxes"></i>
                <span>Inventario</span>
              </div>

              <div className="board-center">
                <div className="board-logo">BW</div>
                <strong>BulkWay</strong>
                <span>OPERACIÓN</span>
              </div>

              <div className="board-status">
                <span className="status-dot"></span>
                Operación activa
              </div>
            </div>
          </div>

          <div className="auth-visual-footer">
            <span>
              <i className="bi bi-shield-check"></i>
              Acceso protegido
            </span>

            <span>
              <i className="bi bi-diagram-3"></i>
              Información conectada
            </span>
          </div>
        </section>

        <main className="auth-login-panel">
          <div className="auth-login-inner">
            <Link
              to="/"
              className="auth-back"
            >
              <i className="bi bi-arrow-left"></i>
              Volver a BulkWay
            </Link>

            <div className="login-heading">
              <div className="login-icon">
                <i className="bi bi-box-arrow-in-right"></i>
              </div>

              <p className="auth-eyebrow">
                ACCESO AL SISTEMA
              </p>

              <h2>
                Bienvenido de nuevo.
              </h2>

              <p className="auth-copy">
                Ingresa con la cuenta proporcionada por tu empresa.
                BulkWay identificará automáticamente tu tipo de acceso.
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={iniciarSesion}
            >
              <div className="auth-field">
                <label htmlFor="email">
                  Correo electrónico
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-envelope"></i>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row login-password-label">
                  <label htmlFor="password">
                    Contraseña
                  </label>

                  <Link
                    to="/recuperar"
                    className="forgot-password-link"
                  >
                    <i className="bi bi-question-circle"></i>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                
                <div className="auth-input-wrap">
                  <i className="bi bi-lock"></i>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button
                className="btn btn-purple btn-full auth-submit"
                disabled={cargando}
                type="submit"
              >
                {cargando ? (
                  <>
                    <span className="auth-spinner"></span>
                    Ingresando...
                  </>
                ) : (
                  <>
                    Entrar a BulkWay
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            {mensaje && (
              <div className="auth-message error">
                <i className="bi bi-exclamation-circle"></i>
                <span>{mensaje}</span>
              </div>
            )}

            <div className="auth-divider">
              <span>ACCESO EMPRESARIAL</span>
            </div>

            <div className="auth-info-card">
              <div className="auth-info-icon">
                <i className="bi bi-shield-lock"></i>
              </div>

              <div>
                <strong>Acceso seguro</strong>
                <p>
                  Tu panel se determina automáticamente según
                  los permisos configurados para tu cuenta.
                </p>
              </div>
            </div>

            <p className="auth-link">
              ¿No tienes una cuenta?
              {' '}
              <Link to="/registro">
                Crear cuenta
              </Link>
            </p>

            <p className="auth-copyright">
              © 2026 BulkWay · Gestión empresarial
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Login