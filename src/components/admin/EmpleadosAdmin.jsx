import { useEffect, useState } from 'react'

import { apiRequest } from '../../services/api'
import { supabase } from '../../services/supabase'

import Modal from '../shared/Modal'
import ConfirmModal from '../shared/ConfirmModal'

const formularioInicial = {
  nombre: '',
  cedula: '',
  telefono: '',
  correo: '',
  zona: '',
  estado: 'Activo',
}

function EmpleadosAdmin() {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [open, setOpen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [empleadoPorEliminar, setEmpleadoPorEliminar] = useState(null)
  const [empleadoEditando, setEmpleadoEditando] = useState(null)
  const [form, setForm] = useState({ ...formularioInicial })

  const cargarEmpleados = async () => {
    try {
      setCargando(true)

      const data = await apiRequest('/conductores', {
        api: 'express',
      })

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
    setEmpleadoEditando(null)
    setForm({ ...formularioInicial })
    setMensaje('')
    setOpen(true)
  }

  const abrirEditar = (empleado) => {
    setEmpleadoEditando(empleado)

    setForm({
      nombre: empleado.nombre || '',
      cedula: empleado.cedula || '',
      telefono: empleado.telefono || '',
      correo: empleado.correo || '',
      zona: empleado.zona || '',
      estado: empleado.estado || 'Activo',
    })

    setMensaje('')
    setOpen(true)
  }

  const cerrarModal = () => {
    if (guardando) return

    setOpen(false)
    setForm({ ...formularioInicial })
    setEmpleadoEditando(null)
    setMensaje('')
  }

  const cambiarCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const guardar = async (e) => {
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

      if (empleadoEditando) {
        await apiRequest(`/conductores/${empleadoEditando.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            cedula: form.cedula.trim(),
            telefono: form.telefono.trim(),
            correo: form.correo.trim(),
            zona: form.zona.trim(),
            estado: form.estado.trim(),
          }),
          api: 'express',
        })

        setOpen(false)
        setForm({ ...formularioInicial })
        setEmpleadoEditando(null)
        setMensaje('Conductor actualizado correctamente.')

        await cargarEmpleados()
        return
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

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

        let mensajeError = 'No fue posible crear el conductor.'

        if (error.context) {
          try {
            const respuesta = await error.context.clone().json()

            mensajeError =
              respuesta?.error ||
              respuesta?.message ||
              mensajeError
          } catch {
            mensajeError = 'No fue posible crear el conductor.'
          }
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
        estado: form.estado.trim(),
      }

      await apiRequest('/conductores', {
        method: 'POST',
        body: JSON.stringify(nuevoConductor),
        api: 'express',
      })

      setOpen(false)
      setForm({ ...formularioInicial })
      setEmpleadoEditando(null)
      setMensaje(
        `El conductor ${nuevoConductor.nombre} fue registrado correctamente. Se envió una invitación a ${nuevoConductor.correo}.`
      )

      await cargarEmpleados()
    } catch (error) {
      console.error(error)
      setMensaje(
        error?.message || 'No fue posible guardar el conductor.'
      )
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = (empleado) => {
    setMensaje('')
    setEmpleadoPorEliminar(empleado)
  }

  const confirmarEliminacion = async () => {
    if (!empleadoPorEliminar) return

    try {
      setMensaje('')

      await apiRequest(`/conductores/${empleadoPorEliminar.id}`, {
        method: 'DELETE',
        api: 'express',
      })

      setEmpleadoPorEliminar(null)
      setMensaje('Conductor eliminado correctamente.')
      await cargarEmpleados()
    } catch (error) {
      console.error(error)
      setEmpleadoPorEliminar(null)
      setMensaje(
        error?.message || 'No fue posible eliminar el conductor.'
      )
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
          <div className="auth-message" role="status">
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
            {empleados.map((empleado) => (
              <article
                className="employee-card"
                key={empleado.id}
              >
                <div className="employee-avatar">
                  <i className="bi bi-person" />
                </div>

                <h3>{empleado.nombre}</h3>

                <p>Conductor · {empleado.zona}</p>

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

                <span
                  className={`status ${
                    (empleado.estado || 'Activo') === 'Activo'
                      ? 'success'
                      : 'warning'
                  }`}
                >
                  {empleado.estado || 'Activo'}
                </span>

                <div className="route-actions">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => abrirEditar(empleado)}
                  >
                    <i className="bi bi-pencil-square" />
                    Editar
                  </button>

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
        title={empleadoEditando ? 'Editar conductor' : 'Nuevo conductor'}
        onClose={cerrarModal}
      >
        <form className="modal-form" onSubmit={guardar}>
          <label htmlFor="conductor-nombre">Nombre completo</label>
          <input
            id="conductor-nombre"
            type="text"
            placeholder="Ej. Juan Pérez"
            value={form.nombre}
            onChange={(e) => cambiarCampo('nombre', e.target.value)}
            required
          />

          <label htmlFor="conductor-cedula">Cédula</label>
          <input
            id="conductor-cedula"
            type="text"
            placeholder="Ej. 1020304050"
            value={form.cedula}
            onChange={(e) => cambiarCampo('cedula', e.target.value)}
            required
          />

          <label htmlFor="conductor-telefono">Teléfono</label>
          <input
            id="conductor-telefono"
            type="text"
            placeholder="Ej. 3001234567"
            value={form.telefono}
            onChange={(e) => cambiarCampo('telefono', e.target.value)}
            required
          />

          <label htmlFor="conductor-correo">Correo electrónico</label>
          <input
            id="conductor-correo"
            type="email"
            placeholder="Ej. juan@empresa.com"
            value={form.correo}
            onChange={(e) => cambiarCampo('correo', e.target.value)}
            required
          />

          <label htmlFor="conductor-zona">Zona</label>
          <input
            id="conductor-zona"
            type="text"
            placeholder="Ej. Bogotá Norte"
            value={form.zona}
            onChange={(e) => cambiarCampo('zona', e.target.value)}
            required
          />

          <label htmlFor="conductor-estado">Estado</label>
          <select
            id="conductor-estado"
            value={form.estado}
            onChange={(e) => cambiarCampo('estado', e.target.value)}
            required
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          {mensaje && (
            <div className="auth-message error" role="alert">
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
              ? 'Guardando...'
              : empleadoEditando
                ? 'Guardar cambios'
                : 'Guardar conductor'}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(empleadoPorEliminar)}
        title="Eliminar conductor"
        message={
          empleadoPorEliminar
            ? `¿Estás seguro de que deseas eliminar a ${empleadoPorEliminar.nombre}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Sí, eliminar conductor"
        cancelText="Cancelar"
        onConfirm={confirmarEliminacion}
        onClose={() => setEmpleadoPorEliminar(null)}
        danger
      />
    </>
  )
}

export default EmpleadosAdmin