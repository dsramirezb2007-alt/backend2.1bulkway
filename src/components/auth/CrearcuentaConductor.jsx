import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabaseActivacion } from '../../services/supabase'

function CrearcuentaConductor() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarInvitacion = async () => {
      if (!supabaseActivacion) {
        setError(
          'No fue posible conectar con Supabase.'
        )
        setCargando(false)
        return
      }

      try {
        const { data, error: sessionError } =
          await supabaseActivacion.auth.getSession()

        if (
          sessionError ||
          !data.session?.user
        ) {
          setError(
            'La invitación no es válida o ya expiró. Solicita una nueva invitación al administrador.'
          )
          setCargando(false)
          return
        }

        setUsuario(data.session.user)
        setCargando(false)
      } catch (error) {
        console.error(error)

        setError(
          'No fue posible verificar la invitación.'
        )

        setCargando(false)
      }
    }

    cargarInvitacion()
  }, [])

  const activarCuenta = async e => {
    e.preventDefault()

    setMensaje('')
    setError('')

    if (password.length < 6) {
      setError(
        'La contraseña debe tener mínimo 6 caracteres.'
      )
      return
    }

    if (password !== confirmarPassword) {
      setError(
        'Las contraseñas no coinciden.'
      )
      return
    }

    if (!supabaseActivacion) {
      setError(
        'No fue posible conectar con Supabase.'
      )
      return
    }

    try {
      setGuardando(true)

      const { error: updateError } =
        await supabaseActivacion.auth.updateUser({
          password,
        })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setMensaje(
        'Tu cuenta fue activada correctamente. Ya puedes ingresar a BulkWay.'
      )

      setTimeout(async () => {
        await supabaseActivacion.auth.signOut()

        navigate('/login', {
          replace: true,
        })
      }, 1800)
    } catch (error) {
      console.error(error)

      setError(
        error?.message ||
          'No fue posible activar la cuenta.'
      )
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="auth-page register-page">
        <div className="auth-background-glow auth-glow-one"></div>
        <div className="auth-background-glow auth-glow-two"></div>

        <div className="auth-shell register-shell">
          <section className="auth-visual register-visual">
            <Link
              to="/"
              className="auth-brand"
            >
              <span className="auth-brand-main">
                BULK<b>WAY</b>
              </span>

              <span className="auth-brand-sub">
                GESTIÓN EMPRESARIAL
              </span>
            </Link>

            <div className="auth-visual-content">
              <p className="auth-eyebrow">
                ALTA DE CONDUCTOR
              </p>

              <h1>
                Preparando tu
                <br />
                acceso <em>seguro.</em>
              </h1>

              <p className="auth-visual-copy">
                Estamos verificando la invitación enviada
                por el administrador de BulkWay.
              </p>
            </div>

            <div className="auth-visual-footer">
              <span>
                <i className="bi bi-lock"></i>
                Invitación segura
              </span>

              <span>
                <i className="bi bi-check2-circle"></i>
                Acceso empresarial
              </span>
            </div>
          </section>

          <main className="auth-login-panel register-panel">
            <div className="auth-login-inner">
              <div className="login-heading">
                <div className="login-icon">
                  <i className="bi bi-shield-check"></i>
                </div>

                <p className="auth-eyebrow">
                  VERIFICANDO INVITACIÓN
                </p>

                <h2>
                  Preparando tu cuenta.
                </h2>

                <p className="auth-copy">
                  Estamos comprobando que tu invitación
                  sea válida.
                </p>
              </div>

              <div className="auth-info-card">
                <div className="auth-info-icon">
                  <i className="bi bi-arrow-repeat"></i>
                </div>

                <div>
                  <strong>
                    Verificando acceso
                  </strong>

                  <p>
                    Este proceso puede tardar unos segundos.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const nombre =
    usuario?.user_metadata?.nombre ||
    usuario?.user_metadata?.full_name ||
    'Conductor'

  const email =
    usuario?.email || ''

  return (
    <div className="auth-page register-page">
      <div className="auth-background-glow auth-glow-one"></div>
      <div className="auth-background-glow auth-glow-two"></div>

      <div className="auth-shell register-shell">
        <section className="auth-visual register-visual">
          <Link
            to="/"
            className="auth-brand"
          >
            <span className="auth-brand-main">
              BULK<b>WAY</b>
            </span>

            <span className="auth-brand-sub">
              GESTIÓN EMPRESARIAL
            </span>
          </Link>

          <div className="auth-visual-content">
            <p className="auth-eyebrow">
              INCORPORACIÓN AL SISTEMA
            </p>

            <h1>
              Forma parte de una
              <br />
              operación <em>conectada.</em>
            </h1>

            <p className="auth-visual-copy">
              Tu cuenta de conductor ha sido creada por un
              administrador. Completa tu acceso para comenzar
              a gestionar rutas y entregas desde BulkWay.
            </p>

            <div className="register-role-preview">
              <div className="register-preview-icon">
                <i className="bi bi-truck"></i>
              </div>

              <div>
                <span>
                  ACCESO ASIGNADO
                </span>

                <strong>
                  Conductor
                </strong>

                <p>
                  Gestiona rutas, entregas y operaciones
                  de distribución.
                </p>
              </div>
            </div>

            <div className="register-feature-list">
              <div>
                <i className="bi bi-shield-check"></i>
                <span>
                  Acceso protegido
                </span>
              </div>

              <div>
                <i className="bi bi-geo-alt"></i>
                <span>
                  Gestión de rutas
                </span>
              </div>

              <div>
                <i className="bi bi-truck"></i>
                <span>
                  Distribución
                </span>
              </div>
            </div>
          </div>

          <div className="auth-visual-footer">
            <span>
              <i className="bi bi-lock"></i>
              Invitación segura
            </span>

            <span>
              <i className="bi bi-check2-circle"></i>
              Configuración empresarial
            </span>
          </div>
        </section>

        <main className="auth-login-panel register-panel">
          <div className="auth-login-inner">
            <Link
              to="/login"
              className="auth-back"
            >
              <i className="bi bi-arrow-left"></i>
              Volver al acceso
            </Link>

            <div className="login-heading">
              <div className="login-icon">
                <i className="bi bi-person-plus"></i>
              </div>

              <p className="auth-eyebrow">
                CREAR CUENTA
              </p>

              <h2>
                Completa tu cuenta.
              </h2>

              <p className="auth-copy">
                Tu acceso de conductor ya fue creado por el
                administrador. Solo necesitas establecer tu
                contraseña para activarlo.
              </p>
            </div>

            <div className="register-role-section">
              <label className="register-section-label">
                Tipo de cuenta
              </label>

              <div className="register-role-grid">
                <div className="register-role-card active">
                  <span className="register-role-icon">
                    <i className="bi bi-truck"></i>
                  </span>

                  <span className="register-role-content">
                    <strong>
                      Conductor
                    </strong>

                    <small>
                      Rutas, entregas y distribución.
                    </small>
                  </span>

                  <span className="register-role-check">
                    <i className="bi bi-check2"></i>
                  </span>
                </div>
              </div>
            </div>

            <div className="register-form">
              <div className="auth-field">
                <label>
                  Nombre completo
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-person"></i>

                  <input
                    type="text"
                    value={nombre}
                    readOnly
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>
                  Correo electrónico
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-envelope"></i>

                  <input
                    type="email"
                    value={email}
                    readOnly
                  />
                </div>
              </div>
            </div>

            <form
              className="auth-form register-form"
              onSubmit={activarCuenta}
            >
              <div className="auth-field">
                <label htmlFor="crear-password">
                  Crear contraseña
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-lock"></i>

                  <input
                    id="crear-password"
                    type="password"
                    value={password}
                    onChange={e =>
                      setPassword(e.target.value)
                    }
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={guardando}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirmar-password">
                  Confirmar contraseña
                </label>

                <div className="auth-input-wrap">
                  <i className="bi bi-lock-fill"></i>

                  <input
                    id="confirmar-password"
                    type="password"
                    value={confirmarPassword}
                    onChange={e =>
                      setConfirmarPassword(
                        e.target.value
                      )
                    }
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={guardando}
                  />
                </div>
              </div>

              <div className="register-selected-role">
                <i className="bi bi-info-circle"></i>

                <span>
                  Crearás acceso como{' '}
                  <strong>
                    conductor
                  </strong>.
                </span>
              </div>

              <button
                className="btn btn-purple btn-full auth-submit"
                disabled={guardando}
                type="submit"
              >
                {guardando ? (
                  <>
                    <span className="auth-spinner"></span>
                    Activando cuenta...
                  </>
                ) : (
                  <>
                    Activar mi cuenta
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="auth-message register-message error">
                <i className="bi bi-exclamation-circle"></i>

                <span>
                  {error}
                </span>
              </div>
            )}

            {mensaje && (
              <div className="auth-message register-message">
                <i className="bi bi-check-circle"></i>

                <span>
                  {mensaje}
                </span>
              </div>
            )}

            <div className="auth-divider">
              <span>
                ACCESO EMPRESARIAL
              </span>
            </div>

            <div className="auth-info-card">
              <div className="auth-info-icon">
                <i className="bi bi-shield-lock"></i>
              </div>

              <div>
                <strong>
                  Cuenta protegida
                </strong>

                <p>
                  Esta cuenta fue creada mediante una invitación
                  segura enviada por el administrador de BulkWay.
                </p>
              </div>
            </div>

            <p className="auth-link">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login">
                Iniciar sesión
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

export default CrearcuentaConductor