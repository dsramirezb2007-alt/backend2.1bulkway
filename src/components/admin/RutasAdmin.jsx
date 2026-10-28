import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../services/api'
import Modal from '../shared/Modal'
import ConfirmModal from '../shared/ConfirmModal'

const empty = {
  nombre: '',
  zona: '',
  conductor: '',
  pedidos: [],
  estado: 'Pendiente',
}

function RutasAdmin() {
  const [rutas, setRutas] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [conductores, setConductores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [rutaPorEliminar, setRutaPorEliminar] = useState(null)

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setMensaje('')

      const resultados = await Promise.allSettled([
        apiRequest('/rutas', { api: 'express' }),
        apiRequest('/pedidos', { api: 'express' }),
        apiRequest('/conductores', { api: 'express' }),
      ])

      const rutasData =
        resultados[0].status === 'fulfilled' && Array.isArray(resultados[0].value)
          ? resultados[0].value
          : []

      const pedidosData =
        resultados[1].status === 'fulfilled' && Array.isArray(resultados[1].value)
          ? resultados[1].value
          : []

      const conductoresData =
        resultados[2].status === 'fulfilled' &&
        Array.isArray(resultados[2].value)
          ? resultados[2].value
          : []

      setRutas(rutasData)
      setPedidos(pedidosData)

      const nombresConductores = conductoresData
      .map(conductor => {
        if (typeof conductor === 'string') {
          return conductor
        }

        return (
          conductor.nombre ||
          conductor.nombreCompleto ||
          conductor.fullName ||
          conductor.name ||
          ''
        )
      })
      .filter(Boolean)

    setConductores([...new Set(nombresConductores)])
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible cargar la información de rutas.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const pedidosDisponibles = useMemo(() => {
    return pedidos.filter(pedido => {
      if (!pedido.conductor || pedido.conductor === 'Sin asignar') {
        return true
      }

      if (!editing) {
        return pedido.ruta === 'Sin asignar' || !pedido.ruta
      }

      return pedido.ruta === 'Sin asignar' || pedido.ruta === form.nombre
    })
  }, [pedidos, editing, form.nombre])

  const abrirNuevo = () => {
    setEditing(null)
    setForm(empty)
    setMensaje('')
    setOpen(true)
  }

  const editar = ruta => {
    setEditing(ruta.id)
    setForm({
      nombre: ruta.nombre || '',
      zona: ruta.zona || '',
      conductor: ruta.conductor || '',
      pedidos: Array.isArray(ruta.pedidos) ? ruta.pedidos.map(String) : [],
      estado: ruta.estado || 'Pendiente',
    })
    setMensaje('')
    setOpen(true)
  }

  const cerrarModal = () => {
    if (guardando) return

    setOpen(false)
    setEditing(null)
    setForm(empty)
    setMensaje('')
  }

  const cambiarPedido = pedidoId => {
    const id = String(pedidoId)

    setForm(prev => ({
      ...prev,
      pedidos: prev.pedidos.includes(id)
        ? prev.pedidos.filter(item => item !== id)
        : [...prev.pedidos, id],
    }))
  }

  const seleccionarTodos = () => {
    const ids = pedidosDisponibles.map(pedido => String(pedido.id))

    setForm(prev => ({
      ...prev,
      pedidos: [...new Set([...prev.pedidos, ...ids])],
    }))
  }

  const limpiarPedidos = () => {
    setForm(prev => ({
      ...prev,
      pedidos: [],
    }))
  }

  const abrirRuta = ruta => {
    const pedidosRuta = pedidos.filter(pedido =>
      Array.isArray(ruta.pedidos)
        ? ruta.pedidos.map(String).includes(String(pedido.id))
        : pedido.ruta === ruta.nombre
    )

    if (pedidosRuta.length === 0) {
      window.open(
        'https://www.google.com/maps/dir/?api=1&origin=Bogota&destination=Bogota',
        '_blank',
        'noopener,noreferrer'
      )
      return
    }

    const origen = 'Bogota'
    const destino = pedidosRuta[pedidosRuta.length - 1]?.direccion || 'Bogota'
    const waypoints = pedidosRuta
      .slice(0, -1)
      .map(pedido => pedido.direccion)
      .filter(Boolean)
      .join('|')

    const url = new URL('https://www.google.com/maps/dir/')
    url.searchParams.set('api', '1')
    url.searchParams.set('origin', origen)
    url.searchParams.set('destination', destino)

    if (waypoints) {
      url.searchParams.set('waypoints', waypoints)
    }

    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  const guardar = async e => {
    e.preventDefault()
    setMensaje('')

    if (!form.nombre.trim()) {
      setMensaje('Escribe el nombre de la ruta.')
      return
    }

    if (!form.zona.trim()) {
      setMensaje('Escribe la zona de la ruta.')
      return
    }

    if (!form.conductor) {
      setMensaje('Selecciona un conductor.')
      return
    }

    if (form.pedidos.length === 0) {
      setMensaje('Selecciona al menos un pedido para la ruta.')
      return
    }

    const pedidosSeleccionados = pedidos.filter(pedido =>
      form.pedidos.map(String).includes(String(pedido.id))
    )

    const ruta = {
      nombre: form.nombre.trim(),
      zona: form.zona.trim(),
      conductor: form.conductor,
      pedidos: form.pedidos,
      cantidadPedidos: form.pedidos.length,
      estado: form.estado,
      fechaActualizacion: new Date().toISOString(),
    }

    try {
      setGuardando(true)

      await cargarDatos()

      let rutaGuardada

      if (editing) {
        rutaGuardada = await apiRequest(`/rutas/${editing}`, {
          method: 'PATCH',
          body: JSON.stringify(ruta),
          api: 'express',
        })
      } else {
        rutaGuardada = await apiRequest('/rutas', {
          method: 'POST',
          body: JSON.stringify({
            ...ruta,
            fechaCreacion: new Date().toISOString(),
          }),
          api: 'express',
        })
      }


      await cargarDatos()
      cerrarModal()

      setMensaje(
        editing
          ? `Ruta ${rutaGuardada?.nombre || form.nombre} actualizada correctamente.`
          : `Ruta ${rutaGuardada?.nombre || form.nombre} creada correctamente.`
      )
      } catch (error) {
        console.error(error)
        setMensaje(error.message || 'No fue posible guardar la ruta.')
      } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (ruta, estado) => {
    try {
      setMensaje('')

      await apiRequest(`/rutas/${ruta.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          estado,
          fechaActualizacion: new Date().toISOString(),
        }),
      })

      const pedidosRuta = pedidos.filter(pedido =>
        Array.isArray(ruta.pedidos)
          ? ruta.pedidos.map(String).includes(String(pedido.id))
          : pedido.ruta === ruta.nombre
      )

      const estadoPedido =
        estado === 'Entregada'
          ? 'Entregado'
          : estado === 'En ruta'
            ? 'En ruta'
            : estado === 'Cancelada'
              ? 'Cancelado'
              : 'Pendiente'

      for (const pedido of pedidosRuta) {
        await apiRequest(`/pedidos/${pedido.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            estado: estadoPedido,
          }),
        })
      }

      await cargarDatos()
      setMensaje(`La ruta "${ruta.nombre}" ahora está ${estado.toLowerCase()}.`)
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible actualizar el estado de la ruta.')
    }
  }

    const eliminar = (ruta) => {
    setMensaje('')
    setRutaPorEliminar(ruta)
  }

  const confirmarEliminacionRuta = async () => {
    if (!rutaPorEliminar) return

    try {
      setMensaje('')

      await apiRequest(`/rutas/${rutaPorEliminar.id}`, {
        method: 'DELETE',
        api: 'express',
      })

      setRutaPorEliminar(null)
      await cargarDatos()
      setMensaje('Ruta eliminada correctamente.')
    } catch (error) {
      console.error(error)
      setRutaPorEliminar(null)
      setMensaje(
        error.message || 'No fue posible eliminar la ruta.'
      )
    }
  }

  const obtenerClaseEstado = estado => {
    if (estado === 'Entregada') return 'status success'
    if (estado === 'Cancelada') return 'status danger'
    if (estado === 'En ruta') return 'status warning'
    return 'status'
  }

  const obtenerPedidosRuta = ruta => {
    return pedidos.filter(pedido =>
      Array.isArray(ruta.pedidos)
        ? ruta.pedidos.map(String).includes(String(pedido.id))
        : pedido.ruta === ruta.nombre
    )
  }

  return (
    <>
      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">GESTIÓN LOGÍSTICA</p>
            <h2>Rutas de entrega</h2>
          </div>

          <button
            type="button"
            className="btn btn-purple"
            onClick={abrirNuevo}
          >
            <i className="bi bi-plus-lg" />
            Nueva ruta
          </button>
        </div>

        {mensaje && (
          <div className="auth-message">
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="auth-loading">
            Cargando rutas...
          </div>
        ) : rutas.length === 0 ? (
          <div className="dashboard-empty">
            <i className="bi bi-map" />
            <h3>No hay rutas registradas</h3>
            <p>
              Crea una ruta para comenzar a organizar los pedidos y
              conductores.
            </p>

            <button
              type="button"
              className="btn btn-purple"
              onClick={abrirNuevo}
            >
              <i className="bi bi-plus-lg" />
              Crear primera ruta
            </button>
          </div>
        ) : (
          <div className="route-list">
            {rutas.map(ruta => {
              const pedidosRuta = obtenerPedidosRuta(ruta)

              return (
                <article
                  className="route-card"
                  key={ruta.id}
                >
                  <div className="route-map-icon">
                    <i className="bi bi-map" />
                  </div>

                  <div className="route-card-content">
                    <div className="route-card-head">
                      <div>
                        <span className="order-id">
                          Ruta #{ruta.id}
                        </span>

                        <h3>{ruta.nombre}</h3>
                      </div>

                      <span className={obtenerClaseEstado(ruta.estado)}>
                        {ruta.estado || 'Pendiente'}
                      </span>
                    </div>

                    <div className="order-details">
                      <span>
                        <i className="bi bi-geo-alt" />
                        {ruta.zona}
                      </span>

                      <span>
                        <i className="bi bi-person" />
                        {ruta.conductor || 'Sin asignar'}
                      </span>

                      <span>
                        <i className="bi bi-box-seam" />
                        {pedidosRuta.length} pedido
                        {pedidosRuta.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {pedidosRuta.length > 0 && (
                      <div className="route-orders">
                        {pedidosRuta.map(pedido => (
                          <div
                            className="route-order-item"
                            key={pedido.id}
                          >
                            <span>
                              <strong>#{pedido.id}</strong>
                              {' · '}
                              {pedido.cliente}
                            </span>

                            <span>
                              {pedido.estado || 'Pendiente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="route-actions">
                      <button
                        type="button"
                        className="btn btn-outline-purple"
                        onClick={() => editar(ruta)}
                        title="Editar ruta"
                      >
                        <i className="bi bi-pencil-square" />
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn btn-purple"
                        onClick={() => abrirRuta(ruta)}
                        title="Abrir ruta en Google Maps"
                      >
                        <i className="bi bi-map" />
                        Ver mapa
                      </button>

                      {ruta.estado === 'Pendiente' && (
                        <button
                          type="button"
                          className="btn btn-outline-purple"
                          onClick={() =>
                            cambiarEstado(ruta, 'En ruta')
                          }
                        >
                          <i className="bi bi-truck" />
                          Iniciar
                        </button>
                      )}

                      {ruta.estado === 'En ruta' && (
                        <button
                          type="button"
                          className="btn btn-outline-purple"
                          onClick={() =>
                            cambiarEstado(ruta, 'Entregada')
                          }
                        >
                          <i className="bi bi-check2-circle" />
                          Entregada
                        </button>
                      )}

                      {ruta.estado !== 'Entregada' &&
                        ruta.estado !== 'Cancelada' && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() =>
                              cambiarEstado(ruta, 'Cancelada')
                            }
                          >
                            <i className="bi bi-x-circle" />
                            Cancelar
                          </button>
                        )}

                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => eliminar(ruta)}
                        title="Eliminar ruta"
                      >
                        <i className="bi bi-trash3" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <Modal
        open={open}
        title={editing ? 'Editar ruta' : 'Nueva ruta'}
        onClose={cerrarModal}
      >
        <form
          className="modal-form"
          onSubmit={guardar}
        >
          <label>
            Nombre de la ruta
          </label>

          <input
            type="text"
            placeholder="Ej. Bogotá Norte"
            value={form.nombre}
            onChange={e =>
              setForm({
                ...form,
                nombre: e.target.value,
              })
            }
            required
          />

          <label>
            Zona
          </label>

          <input
            type="text"
            placeholder="Ej. Chapinero y Teusaquillo"
            value={form.zona}
            onChange={e =>
              setForm({
                ...form,
                zona: e.target.value,
              })
            }
            required
          />

          <label>
            Conductor
          </label>

          <select
            value={form.conductor}
            onChange={e =>
              setForm({
                ...form,
                conductor: e.target.value,
              })
            }
            required
          >
            <option value="">
              Selecciona un conductor
            </option>

            {conductores.map(conductor => (
              <option
                key={conductor}
                value={conductor}
              >
                {conductor}
              </option>
            ))}
          </select>

          {conductores.length === 0 && (
            <div className="auth-message error">
              No hay conductores disponibles. Primero registra un conductor.
            </div>
          )}

          <label>
            Estado de la ruta
          </label>

          <select
            value={form.estado}
            onChange={e =>
              setForm({
                ...form,
                estado: e.target.value,
              })
            }
          >
            <option value="Pendiente">
              Pendiente
            </option>
            <option value="En ruta">
              En ruta
            </option>
            <option value="Entregada">
              Entregada
            </option>
            <option value="Cancelada">
              Cancelada
            </option>
          </select>

          <div className="route-order-selector">
            <div className="route-selector-head">
              <label>
                Pedidos de esta ruta
              </label>

              <div>
                <button
                  type="button"
                  className="btn btn-outline-purple"
                  onClick={seleccionarTodos}
                >
                  Seleccionar todos
                </button>

                <button
                  type="button"
                  className="btn btn-outline-purple"
                  onClick={limpiarPedidos}
                >
                  Limpiar
                </button>
              </div>
            </div>

            {pedidosDisponibles.length === 0 ? (
              <div className="dashboard-empty">
                <i className="bi bi-box-seam" />
                <p>
                  No hay pedidos disponibles para asignar a esta ruta.
                </p>
              </div>
            ) : (
              <div className="route-order-options">
                {pedidosDisponibles.map(pedido => {
                  const seleccionado = form.pedidos.includes(
                    String(pedido.id)
                  )

                  return (
                    <label
                      className={`route-order-option ${
                        seleccionado ? 'selected' : ''
                      }`}
                      key={pedido.id}
                    >
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() => cambiarPedido(pedido.id)}
                      />

                      <span>
                        <strong>
                          #{pedido.id} · {pedido.cliente}
                        </strong>

                        <small>
                          <i className="bi bi-geo-alt" />
                          {pedido.direccion}
                        </small>

                        <small>
                          <i className="bi bi-box" />
                          {pedido.producto ||
                            'Productos del pedido'}
                          {' × '}
                          {pedido.cantidad ||
                            (Number(pedido.cantRopa || 0) +
                              Number(pedido.cantLoza || 0))}
                        </small>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {mensaje && (
            <div className="auth-message error">
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-purple btn-full"
            disabled={guardando || conductores.length === 0}
          >
            <i className="bi bi-check2-circle" />

            {guardando
              ? 'Guardando...'
              : editing
                ? 'Guardar cambios'
                : 'Crear ruta'}
          </button>
          </form>
      </Modal>

      <ConfirmModal
        open={Boolean(rutaPorEliminar)}
        title="Eliminar ruta"
        message={
          rutaPorEliminar
            ? `¿Estás seguro de que deseas eliminar la ruta "${rutaPorEliminar.nombre}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Sí, eliminar ruta"
        cancelText="Cancelar"
        onConfirm={confirmarEliminacionRuta}
        onClose={() => setRutaPorEliminar(null)}
        danger
      />
    </>
  )
}

export default RutasAdmin