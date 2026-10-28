import { useState } from 'react'

import { Link } from 'react-router-dom'

import { supabase } from '../../services/supabase'

function RecuperarPassword() {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()

    setMensaje('')
    setEnviado(false)

    if (!supabase) {
      setMensaje('Configura Supabase en .env.')
      return
    }

    setCargando(true)

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/actualizar-password`,
      }
    )

    setCargando(false)

    if (error) {
      setMensaje(error.message)
      return
    }

    setEnviado(true)
    setMensaje(
      'Revisa tu correo para continuar con la recuperación.'
    )
  }

  return (
    <div className="auth-page recovery-page">

      <div className="auth-background-glow auth-glow-one"></div>
      <div className="auth-background-glow auth-glow-two"></div>

      <div className="auth-shell recovery-shell">

        {/* PANEL VISUAL */}

        <section className="auth-visual recovery-visual">

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
              RECUPERACIÓN SEGURA
            </p>

            <h1>
              Vuelve a tener el
              <br />
              <em>control.</em>
            </h1>

            <p className="auth-visual-copy">
              Recupera el acceso a tu cuenta de BulkWay de forma
              sencilla. Te enviaremos un enlace seguro al correo
              asociado a tu cuenta.
            </p>

            <div className="recovery-security-card">

              <div className="recovery-security-icon">
                <i className="bi bi-shield-lock"></i>
              </div>

              <div className="recovery-security-content">

                <span>
                  PROCESO PROTEGIDO
                </span>

                <strong>
                  Tu cuenta permanece segura
                </strong>

                <p>
                  El enlace de recuperación será enviado
                  directamente a tu correo electrónico.
                </p>

              </div>

            </div>

            <div className="recovery-steps">

              <div className="recovery-step active">

                <span className="recovery-step-number">
                  01
                </span>

                <div>
                  <strong>
                    Confirma tu correo
                  </strong>

                  <p>
                    Indica el correo asociado a tu cuenta.
                  </p>
                </div>

              </div>

              <div className="recovery-step">

                <span className="recovery-step-number">
                  02
                </span>

                <div>
                  <strong>
                    Revisa tu bandeja
                  </strong>

                  <p>
                    Recibirás un enlace para continuar.
                  </p>
                </div>

              </div>

              <div className="recovery-step">

                <span className="recovery-step-number">
                  03
                </span>

                <div>
                  <strong>
                    Define una contraseña
                  </strong>

                  <p>
                    Recupera nuevamente tu acceso.
                  </p>
                </div>

              </div>

            </div>

          </div>

          <div className="auth-visual-footer">

            <span>
              <i className="bi bi-shield-check"></i>
              Acceso protegido
            </span>

            <span>
              <i className="bi bi-envelope-check"></i>
              Recuperación por correo
            </span>

          </div>

        </section>

        {/* PANEL DE RECUPERACIÓN */}

        <main className="auth-login-panel recovery-panel">

          <div className="auth-login-inner">

            <Link
              to="/login"
              className="auth-back"
            >
              <i className="bi bi-arrow-left"></i>
              Volver al acceso
            </Link>

            <div className="login-heading recovery-heading">

              <div className="login-icon recovery-icon">
                <i className="bi bi-key"></i>
              </div>

              <p className="auth-eyebrow">
                RECUPERAR ACCESO
              </p>

              <h2>
                ¿Olvidaste tu contraseña?
              </h2>

              <p className="auth-copy">
                No te preocupes. Introduce el correo electrónico
                asociado a tu cuenta y te enviaremos un enlace
                para recuperar el acceso.
              </p>

            </div>

            {!enviado ? (
              <form
                className="auth-form recovery-form"
                onSubmit={enviar}
              >

                <div className="auth-field">

                  <label htmlFor="recovery-email">
                    Correo electrónico
                  </label>

                  <div className="auth-input-wrap">

                    <i className="bi bi-envelope"></i>

                    <input
                      id="recovery-email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                      required
                    />

                  </div>

                </div>

                <div className="recovery-form-note">

                  <i className="bi bi-info-circle"></i>

                  <span>
                    Utiliza el mismo correo con el que
                    registraste tu cuenta.
                  </span>

                </div>

                <button
                  className="btn btn-purple btn-full auth-submit"
                  disabled={cargando}
                  type="submit"
                >
                  {cargando ? (
                    <>
                      <span className="auth-spinner"></span>
                      Enviando enlace...
                    </>
                  ) : (
                    <>
                      Enviar enlace de recuperación
                      <i className="bi bi-arrow-right"></i>
                    </>
                  )}
                </button>

              </form>
            ) : (
              <div className="recovery-success">

                <div className="recovery-success-icon">
                  <i className="bi bi-envelope-check"></i>
                </div>

                <p className="auth-eyebrow">
                  ENLACE ENVIADO
                </p>

                <h3>
                  Revisa tu correo.
                </h3>

                <p>
                  Hemos enviado las instrucciones de recuperación
                  a la dirección que proporcionaste.
                </p>

                <div className="recovery-success-email">
                  <i className="bi bi-envelope"></i>
                  <strong>{email}</strong>
                </div>

                <div className="recovery-success-note">
                  <i className="bi bi-clock-history"></i>
                  <span>
                    Si no encuentras el mensaje, revisa también
                    tu carpeta de spam o correo no deseado.
                  </span>
                </div>

                <button
                  type="button"
                  className="recovery-retry"
                  onClick={() => {
                    setEnviado(false)
                    setMensaje('')
                  }}
                >
                  <i className="bi bi-arrow-repeat"></i>
                  Intentar con otro correo
                </button>

              </div>
            )}

            {mensaje && !enviado && (
              <div className="auth-message recovery-error">
                <i className="bi bi-exclamation-circle"></i>
                <span>{mensaje}</span>
              </div>
            )}

            <div className="auth-divider">
              <span>SEGURIDAD BULKWAY</span>
            </div>

            <div className="auth-info-card">

              <div className="auth-info-icon">
                <i className="bi bi-shield-check"></i>
              </div>

              <div>
                <strong>
                  Recuperación protegida
                </strong>

                <p>
                  BulkWay utiliza un enlace de recuperación
                  enviado directamente a tu correo para proteger
                  el acceso a tu cuenta.
                </p>
              </div>

            </div>

            <p className="auth-link">
              ¿Recordaste tu contraseña?
              {' '}
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

export default RecuperarPassword