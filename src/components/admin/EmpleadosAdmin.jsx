import { useEffect, useState } from 'react'

import { apiRequest } from '../../services/api'
import { supabase } from '../../services/supabase'

import Modal from '../shared/Modal'

const formularioInicial = {
  nombre: '',
  cedula: '',
  telefono: '',
  correo: '',
  zona: '',
}

function EmpleadosAdmin() {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [open, setOpen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [form, setForm] = useState(formularioInicial)

  const cargarEmpleados = async () => {
    try {
      setCargando(true)
      setMensaje('')

      const data = await apiRequest('/conductores')

      setEmpleados(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible cargar los conductores.')
      setEmpleados([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarEmpleados()
  }, [])

  const abrirNuevo = () => {
    setForm(formularioInicial)
    setMensaje('')
    setOpen(true)
  }

  const cerrarModal = () => {
    if (guardando) return

    setOpen(false)
    setForm(formularioInicial)
    setMensaje('')
  }

  const cambiarCampo = (campo, valor) => {
    setForm(prev => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const guardar = async e => {
    e.preventDefault()

    setMensaje('')

    if (!form.nombre.trim()) {
      setMensaje('Escribe el nombre del conductor.')
      return
    }

    if (!form.cedula.trim()) {
      setMensaje('Escribe la cédula del conductor.')
      return
    }

    if (!form.telefono.trim()) {
      setMensaje('Escribe el teléfono del conductor.')
      return
    }

    if (!form.correo.trim()) {
      setMensaje('Escribe el correo del conductor.')
      return
    }

    if (!form.zona.trim()) {
      setMensaje('Escribe la zona del conductor.')
      return
    }

    if (!supabase) {
      setMensaje('No fue posible conectar con Supabase.')
      return
    }

    try {
      setGuardando(true)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      console.log('SESION ACTUAL:', session)
      console.log('ERROR SESION:', sessionError)

      if (!session?.access_token) {
        setMensaje('La sesión del administrador no está disponible.')
        return
      }

      const { data, error } = await supabase.functions.invoke(
        'crear-conductor',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            nombre: form.nombre.trim(),
            email: form.correo.trim(),
          },
        }
      )

      if (error) {
        console.error('Error de Edge Function:', error)

        let mensajeError = error.message || 'No fue posible crear el conductor.'

        if (error.context) {
          try {
            const respuesta = await error.context.json()

            if (respuesta?.error) {
              mensajeError = respuesta.error
            }
          } catch {}
        }

        setMensaje(mensajeError)
        return
      }

      if (!data?.ok || !data?.conductor?.id) {
        setMensaje(
          data?.error ||
            'Supabase no devolvió la información del conductor.'
        )
        return
      }

      const nuevoConductor = {
        id: data.conductor.id,
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        zona: form.zona.trim(),
        estado: 'Activo',
      }

      await apiRequest('/conductores', {
        method: 'POST',
        body: JSON.stringify(nuevoConductor),
      })

      await cargarEmpleados()

      setForm(formularioInicial)
      setOpen(false)

      setMensaje(
        `El conductor ${nuevoConductor.nombre} fue registrado correctamente. Se envió una invitación a ${nuevoConductor.correo}.`
      )
    } catch (error) {
      console.error(error)

      setMensaje(
        error?.message ||
          'No fue posible registrar el conductor.'
      )
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async empleado => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar a ${empleado.nombre}?`
    )

    if (!confirmar) return

    try {
      setMensaje('')

      await apiRequest(`/conductores/${empleado.id}`, {
        method: 'DELETE',
      })

      await cargarEmpleados()

      setMensaje('Conductor eliminado correctamente.')
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible eliminar el conductor.')
    }
  }

  return (
    <>
      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">RECURSOS HUMANOS</p>
            <h2>Empleados y conductores</h2>
          </div>

          <button
            type="button"
            className="btn btn-purple"
            onClick={abrirNuevo}
          >
            <i className="bi bi-person-plus" />
            Agregar conductor
          </button>
        </div>

        {mensaje && (
          <div className="auth-message">
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="auth-loading">
            Cargando conductores...
          </div>
        ) : empleados.length === 0 ? (
          <div className="dashboard-empty">
            <i className="bi bi-people" />

            <h3>No hay conductores registrados</h3>

            <p>
              Registra los conductores de la empresa para poder asignarlos
              posteriormente a las rutas.
            </p>

            <button
              type="button"
              className="btn btn-purple"
              onClick={abrirNuevo}
            >
              <i className="bi bi-person-plus" />
              Registrar primer conductor
            </button>
          </div>
        ) : (
          <div className="employee-grid">
            {empleados.map(empleado => (
              <article
                className="employee-card"
                key={empleado.id}
              >
                <div className="employee-avatar">
                  <i className="bi bi-person" />
                </div>

                <h3>{empleado.nombre}</h3>

                <p>
                  Conductor · {empleado.zona}
                </p>

                <p>
                  <i className="bi bi-credit-card" />{' '}
                  {empleado.cedula}
                </p>

                <p>
                  <i className="bi bi-telephone" />{' '}
                  {empleado.telefono}
                </p>

                <p>
                  <i className="bi bi-envelope" />{' '}
                  {empleado.correo}
                </p>

                <span className="status success">
                  {empleado.estado || 'Activo'}
                </span>

                <div className="route-actions">
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => eliminar(empleado)}
                  >
                    <i className="bi bi-trash3" />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={open}
        title="Nuevo conductor"
        onClose={cerrarModal}
      >
        <form
          className="modal-form"
          onSubmit={guardar}
        >
          <label>Nombre completo</label>

          <input
            type="text"
            placeholder="Ej. Juan Pérez"
            value={form.nombre}
            onChange={e =>
              cambiarCampo('nombre', e.target.value)
            }
            required
          />

          <label>Cédula</label>

          <input
            type="text"
            placeholder="Ej. 1020304050"
            value={form.cedula}
            onChange={e =>
              cambiarCampo('cedula', e.target.value)
            }
            required
          />

          <label>Teléfono</label>

          <input
            type="text"
            placeholder="Ej. 3001234567"
            value={form.telefono}
            onChange={e =>
              cambiarCampo('telefono', e.target.value)
            }
            required
          />

          <label>Correo electrónico</label>

          <input
            type="email"
            placeholder="Ej. juan@empresa.com"
            value={form.correo}
            onChange={e =>
              cambiarCampo('correo', e.target.value)
            }
            required
          />

          <label>Zona</label>

          <input
            type="text"
            placeholder="Ej. Bogotá Norte"
            value={form.zona}
            onChange={e =>
              cambiarCampo('zona', e.target.value)
            }
            required
          />

          {mensaje && (
            <div className="auth-message error">
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-purple btn-full"
            disabled={guardando}
          >
            <i className="bi bi-check2-circle" />

            {guardando
              ? 'Creando conductor...'
              : 'Guardar conductor'}
          </button>
        </form>
      </Modal>
    </>
  )
}

export default EmpleadosAdmin