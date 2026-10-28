import { useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../shared/Modal'
import ConfirmModal from '../shared/ConfirmModal'

const empty = {
  clienteId: '',
  cliente: '',
  direccion: '',
  fecha: '',
  productoId: '',
  cantidad: 1,
}

function PedidosAdmin() {
  const { usuario } = useAuth()

  const [pedidos, setPedidos] = useState([])
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [pedidoPorEliminar, setPedidoPorEliminar] = useState(null)

  const cargarDatos = async () => {
    try {
      setCargando(true)

      const [pedidosData, productosData] = await Promise.all([
        apiRequest('/pedidos'),
        apiRequest('/productos'),
      ])

      setPedidos(pedidosData)
      setProductos(productosData)

      try {
        const clientesData = await apiRequest('/clientes')
        setClientes(clientesData)
      } catch {
        setClientes([])
      }
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible cargar los datos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const abrirNuevo = () => {
    setEditing(null)
    setForm({
      ...empty,
      fecha: new Date().toISOString().slice(0, 10),
    })
    setMensaje('')
    setOpen(true)
  }

  const cerrarModal = () => {
    if (guardando) return
    setOpen(false)
    setEditing(null)
    setForm(empty)
  }

  const obtenerProducto = () => {
    return productos.find((producto) => producto.id === form.productoId)
  }

  const obtenerCliente = () => {
    return clientes.find((cliente) => cliente.id === form.clienteId)
  }

  const calcularTotal = () => {
    const producto = obtenerProducto()
    const cantidad = Number(form.cantidad || 0)

    if (!producto || cantidad <= 0) return 0

    return Number(producto.precio || 0) * cantidad
  }

  const seleccionarCliente = (clienteId) => {
    const cliente = clientes.find((item) => item.id === clienteId)

    setForm((actual) => ({
      ...actual,
      clienteId,
      cliente: cliente?.nombre || '',
      direccion: cliente?.direccion || '',
    }))
  }

  const guardar = async (event) => {
    event.preventDefault()
    setMensaje('')

    const producto = obtenerProducto()
    const cliente = obtenerCliente()
    const cantidad = Number(form.cantidad)

    if (!cliente) {
      setMensaje('Selecciona un cliente.')
      return
    }

    if (!form.direccion.trim()) {
      setMensaje('Ingresa la dirección de entrega.')
      return
    }

    if (!producto) {
      setMensaje('Selecciona un producto.')
      return
    }

    if (!cantidad || cantidad <= 0) {
      setMensaje('La cantidad debe ser mayor a cero.')
      return
    }

    if (!editing && cantidad > Number(producto.stock || 0)) {
      setMensaje(`Stock insuficiente. Disponible: ${producto.stock}.`)
      return
    }

    try {
      setGuardando(true)

      const subtotal = Number(producto.precio || 0) * cantidad
      const total = subtotal

      if (editing) {
        const pedidoActual = pedidos.find((pedido) => pedido.id === editing)

        const datosActualizados = {
          clienteId: cliente.id,
          cliente: cliente.nombre,
          direccion: form.direccion.trim(),
          fecha: form.fecha,
          productoId: producto.id,
          producto: producto.nombre,
          cantidad,
          precioUnitario: Number(producto.precio || 0),
          subtotal,
          total,
          estado: pedidoActual?.estado || 'Pendiente',
          conductor: pedidoActual?.conductor || 'Sin asignar',
          ruta: pedidoActual?.ruta || 'Sin asignar',
        }

        if (pedidoActual?.facturado) {
          datosActualizados.facturado = pedidoActual.facturado
          datosActualizados.facturaId = pedidoActual.facturaId
        }

        await apiRequest(`/pedidos/${editing}`, {
          method: 'PATCH',
          body: JSON.stringify(datosActualizados),
        })

        setMensaje(`Pedido ${editing} actualizado correctamente.`)
      } else {
        const nuevoPedido = {
          clienteId: cliente.id,
          cliente: cliente.nombre,
          direccion: form.direccion.trim(),
          fecha: form.fecha,
          productoId: producto.id,
          producto: producto.nombre,
          cantidad,
          precioUnitario: Number(producto.precio || 0),
          subtotal,
          total,
          estado: 'Pendiente',
          conductor: 'Sin asignar',
          ruta: 'Sin asignar',
        }

        const pedidoCreado = await apiRequest('/pedidos', {
          method: 'POST',
          body: JSON.stringify(nuevoPedido),
        })

        const stockAnterior = Number(producto.stock || 0)
        const stockNuevo = stockAnterior - cantidad

        await apiRequest(`/productos/${producto.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            stock: stockNuevo,
          }),
        })

        await apiRequest('/inventario', {
          method: 'POST',
          body: JSON.stringify({
            productoId: producto.id,
            producto: producto.nombre,
            tipo: 'salida',
            cantidad,
            stockAnterior,
            stockNuevo,
            motivo: `Pedido ${pedidoCreado.id}`,
            fecha: new Date().toISOString(),
          }),
        })

        setMensaje(`Pedido ${pedidoCreado.id} creado correctamente.`)
      }

      await cargarDatos()
      setOpen(false)
      setEditing(null)
      setForm(empty)
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible guardar el pedido.')
    } finally {
      setGuardando(false)
    }
  }

  const editar = (pedido) => {
    setEditing(pedido.id)

    setForm({
      clienteId: pedido.clienteId || '',
      cliente: pedido.cliente || '',
      direccion: pedido.direccion || '',
      fecha: pedido.fecha || '',
      productoId: pedido.productoId || '',
      cantidad: pedido.cantidad || 1,
    })

    setMensaje('')
    setOpen(true)
  }

  const publicar = async (pedido) => {
    try {
      setMensaje('')

      await apiRequest(`/pedidos/${pedido.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          estado: 'Publicado',
        }),
      })

      await cargarDatos()
      setMensaje(`Pedido ${pedido.id} publicado correctamente.`)
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible publicar el pedido.')
    }
  }

    const eliminar = (pedido) => {
    setMensaje('')
    setPedidoPorEliminar(pedido)
  }

  const confirmarEliminacionPedido = async () => {
    if (!pedidoPorEliminar) return

    try {
      setMensaje('')

      await apiRequest(`/pedidos/${pedidoPorEliminar.id}`, {
        method: 'DELETE',
      })

      const pedidoEliminado = pedidoPorEliminar.id
      setPedidoPorEliminar(null)

      await cargarDatos()
      setMensaje(`Pedido ${pedidoEliminado} eliminado correctamente.`)
    } catch (error) {
      console.error(error)
      setPedidoPorEliminar(null)
      setMensaje('No fue posible eliminar el pedido.')
    }
  }

  const obtenerFacturasGuardadas = () => {
    const claveFacturas = `bulkwayFacturas_${usuario?.id || 'sin-usuario'}`
    const guardadas = localStorage.getItem(claveFacturas)

    if (!guardadas) return []

    try {
      return JSON.parse(guardadas)
    } catch {
      return []
    }
  }

  const generarFactura = async (pedido) => {
    const claveFacturas = `bulkwayFacturas_${usuario?.id || 'sin-usuario'}`
    const facturasActuales = obtenerFacturasGuardadas()

    const facturaExistente = facturasActuales.find(
      (factura) => factura.pedido === pedido.id
    )

    if (facturaExistente) {
      setMensaje(
        `El pedido ${pedido.id} ya tiene la factura ${facturaExistente.id}.`
      )
      return
    }

    const fechaActual = new Date()
    const fechaVencimiento = new Date(
      fechaActual.getTime() + 15 * 24 * 60 * 60 * 1000
    )

    const nuevaFactura = {
      id: `FAC-${Date.now()}`,
      pedido: pedido.id,
      clienteId: pedido.clienteId || '',
      cliente: pedido.cliente || 'Cliente sin nombre',
      direccion: pedido.direccion || '',
      total: Number(pedido.total || 0),
      subtotal: Number(pedido.subtotal || pedido.total || 0),
      estado: 'Pendiente',
      metodo: 'Pendiente de definir',
      fecha: fechaActual.toISOString().slice(0, 10),
      vencimiento: fechaVencimiento.toISOString().slice(0, 10),
      productoId: pedido.productoId || '',
      producto: pedido.producto || '',
      cantidad: Number(pedido.cantidad || 0),
      precioUnitario: Number(pedido.precioUnitario || 0),
    }

    try {
      setMensaje('')

      const nuevasFacturas = [...facturasActuales, nuevaFactura]

      localStorage.setItem(
        claveFacturas,
        JSON.stringify(nuevasFacturas)
      )

      await apiRequest(`/pedidos/${pedido.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          facturaId: nuevaFactura.id,
          facturado: true,
        }),
      })

      await cargarDatos()

      setMensaje(
        `Factura ${nuevaFactura.id} generada correctamente para el pedido ${pedido.id}.`
      )
    } catch (error) {
      console.error(error)

      localStorage.setItem(
        claveFacturas,
        JSON.stringify(facturasActuales)
      )

      setMensaje('No fue posible generar la factura.')
    }
  }

  const totalSeleccionado = calcularTotal()

  return (
    <section className="admin-module">
      <div className="module-header">
        <div>
          <p className="eyebrow">OPERACIÓN</p>
          <h1>Pedidos</h1>
          <p>Administra pedidos, clientes, productos y facturación.</p>
        </div>

        <button
          type="button"
          className="btn btn-purple"
          onClick={abrirNuevo}
        >
          <i className="bi bi-plus-lg" />
          Nuevo pedido
        </button>
      </div>

      {mensaje && (
        <div className="form-message">
          {mensaje}
        </div>
      )}

      {cargando ? (
        <div className="empty-state">
          <i className="bi bi-arrow-repeat" />
          <p>Cargando pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-receipt" />
          <h3>No hay pedidos registrados</h3>
          <p>Crea el primer pedido para comenzar.</p>
        </div>
      ) : (
        <div className="orders-list">
          {pedidos.map((pedido) => (
            <article className="order-card" key={pedido.id}>
              <div className="order-main">
                <div className="order-icon">
                  <i className="bi bi-box-seam" />
                </div>

                <div className="order-info">
                  <div className="order-title">
                    <div>
                      <p className="eyebrow">{pedido.id}</p>
                      <h3>{pedido.cliente || 'Cliente sin nombre'}</h3>
                    </div>

                    <span
                      className={`status-badge status-${String(
                        pedido.estado || 'Pendiente'
                      )
                        .toLowerCase()
                        .replace(/\s+/g, '-')}`}
                    >
                      {pedido.estado || 'Pendiente'}
                    </span>
                  </div>

                  <div className="order-details">
                    <span>
                      <i className="bi bi-calendar3" />
                      {pedido.fecha || 'Sin fecha'}
                    </span>

                    <span>
                      <i className="bi bi-geo-alt" />
                      {pedido.direccion || 'Sin dirección'}
                    </span>

                    <span>
                      <i className="bi bi-box" />
                      {pedido.producto || 'Sin producto'} ×{' '}
                      {pedido.cantidad || 0}
                    </span>

                    <span>
                      <i className="bi bi-truck" />
                      {pedido.conductor || 'Sin asignar'}
                    </span>

                    <span>
                      <i className="bi bi-sign-turn-right" />
                      {pedido.ruta || 'Sin asignar'}
                    </span>
                  </div>
                </div>

                <div className="order-right">
                  <strong>
                    ${Number(pedido.total || 0).toLocaleString('es-CO')}
                  </strong>

                  <div className="order-actions">
                    <button
                      type="button"
                      className="btn btn-outline-purple"
                      onClick={() => editar(pedido)}
                    >
                      <i className="bi bi-pencil" />
                      Editar
                    </button>

                    {pedido.estado !== 'Publicado' &&
                      pedido.estado !== 'Cancelado' && (
                        <button
                          type="button"
                          className="btn btn-outline-purple"
                          onClick={() => publicar(pedido)}
                        >
                          <i className="bi bi-send" />
                          Publicar
                        </button>
                      )}

                    {pedido.estado !== 'Cancelado' &&
                      !pedido.facturado && (
                        <button
                          type="button"
                          className="btn btn-outline-purple"
                          onClick={() => generarFactura(pedido)}
                          title="Generar factura"
                        >
                          <i className="bi bi-receipt" />
                          Facturar
                        </button>
                      )}

                    {pedido.facturado && (
                      <span className="order-invoiced">
                        <i className="bi bi-check-circle" />
                        {pedido.facturaId || 'Facturado'}
                      </span>
                    )}

                    <button
                      type="button"
                      className="btn btn-danger-outline"
                      onClick={() => eliminar(pedido)}
                    >
                      <i className="bi bi-trash" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? 'Editar pedido' : 'Nuevo pedido'}
        onClose={cerrarModal}
      >
        <form onSubmit={guardar} className="admin-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Cliente</label>
              <select
                value={form.clienteId}
                onChange={(e) => seleccionarCliente(e.target.value)}
                required
              >
                <option value="">Selecciona un cliente</option>

                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fecha de entrega</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) =>
                  setForm((actual) => ({
                    ...actual,
                    fecha: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="form-group form-group-full">
              <label>Dirección de entrega</label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) =>
                  setForm((actual) => ({
                    ...actual,
                    direccion: e.target.value,
                  }))
                }
                placeholder="Dirección completa"
                required
              />
            </div>

            <div className="form-group">
              <label>Producto</label>
              <select
                value={form.productoId}
                onChange={(e) =>
                  setForm((actual) => ({
                    ...actual,
                    productoId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Selecciona un producto</option>

                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} · Stock: {producto.stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="number"
                min="1"
                value={form.cantidad}
                onChange={(e) =>
                  setForm((actual) => ({
                    ...actual,
                    cantidad: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          {obtenerCliente() && (
            <div className="order-summary">
              <div>
                <span>Cliente</span>
                <strong>{obtenerCliente().nombre}</strong>
              </div>

              <div>
                <span>Dirección</span>
                <strong>
                  {form.direccion || 'Sin dirección'}
                </strong>
              </div>
            </div>
          )}

          {obtenerProducto() && (
            <div className="order-summary">
              <div>
                <span>Precio unitario</span>
                <strong>
                  $
                  {Number(obtenerProducto().precio || 0).toLocaleString(
                    'es-CO'
                  )}
                </strong>
              </div>

              <div>
                <span>Total</span>
                <strong>
                  ${Number(totalSeleccionado).toLocaleString('es-CO')}
                </strong>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-purple"
              onClick={cerrarModal}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-purple"
              disabled={guardando}
            >
              {guardando ? (
                'Guardando...'
              ) : (
                <>
                  <i className="bi bi-check-lg" />
                  {editing ? 'Guardar cambios' : 'Crear pedido'}
                </>
              )}
            </button>
          </div>
        </form>
        </Modal>

      <ConfirmModal
        open={Boolean(pedidoPorEliminar)}
        title="Eliminar pedido"
        message={
          pedidoPorEliminar
            ? `¿Estás seguro de que deseas eliminar el pedido ${pedidoPorEliminar.id}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Sí, eliminar pedido"
        cancelText="Cancelar"
        onConfirm={confirmarEliminacionPedido}
        onClose={() => setPedidoPorEliminar(null)}
        danger
      />
    </section>
  )
}

export default PedidosAdmin