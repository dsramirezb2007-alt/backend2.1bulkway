import { useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'

function InventarioAdmin() {
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [form, setForm] = useState({
    productoId: '',
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
  })

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setMensaje('')

      const [productosData, movimientosData] = await Promise.all([
        apiRequest('/productos', { api: 'express' }),
        apiRequest('/inventario', { api: 'express' }),
      ])

      setProductos(productosData)
      setMovimientos(movimientosData)
    } catch (error) {
      console.error(error)
      setMensaje(
        'No fue posible cargar el inventario. Verifica que exista el recurso /inventario en JSON Server.'
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const registrarMovimiento = async (e) => {
    e.preventDefault()
    setMensaje('')

    const cantidad = Number(form.cantidad)

    if (!form.productoId) {
      setMensaje('Selecciona un producto.')
      return
    }

    if (!cantidad || cantidad <= 0) {
      setMensaje('La cantidad debe ser mayor que cero.')
      return
    }

    if (!form.motivo.trim()) {
      setMensaje('Escribe el motivo del movimiento.')
      return
    }

    const producto = productos.find(
      (item) => String(item.id) === String(form.productoId)
    )

    if (!producto) {
      setMensaje('No se encontrÃ³ el producto seleccionado.')
      return
    }

    const stockAnterior = Number(producto.stock) || 0

    const stockNuevo =
      form.tipo === 'entrada'
        ? stockAnterior + cantidad
        : stockAnterior - cantidad

    if (stockNuevo < 0) {
      setMensaje(
        `No hay suficiente stock. Stock disponible: ${stockAnterior}.`
      )
      return
    }

    try {
      setGuardando(true)

      const fecha = new Date().toISOString()

      const movimiento = {
        productoId: producto.id,
        producto: producto.nombre,
        tipo: form.tipo,
        cantidad,
        stockAnterior,
        stockNuevo,
        motivo: form.motivo.trim(),
        fecha,
      }

      await apiRequest('/inventario', {
        method: 'POST',
        body: JSON.stringify(movimiento),
        api: 'express',
      })

      setForm({
        productoId: '',
        tipo: 'entrada',
        cantidad: '',
        motivo: '',
      })

      await cargarDatos()

      setMensaje('Movimiento registrado correctamente.')
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible registrar el movimiento.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="dashboard-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">CONTROL DE EXISTENCIAS</p>
          <h2>Inventario</h2>
        </div>
      </div>

      {mensaje && (
        <div className="auth-message">
          {mensaje}
        </div>
      )}

      {cargando ? (
        <div className="auth-loading">
          Cargando inventario...
        </div>
      ) : (
        <>
          <div className="inventory-layout">
            <div className="inventory-form-card">
              <div className="inventory-card-header">
                <div className="inventory-icon">
                  <i className="bi bi-boxes" />
                </div>

                <div>
                  <p className="eyebrow">MOVIMIENTO</p>
                  <h3>Registrar movimiento</h3>
                </div>
              </div>

              <form
                className="modal-form"
                onSubmit={registrarMovimiento}
              >
                <label>Producto</label>

                <select
                  value={form.productoId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      productoId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Selecciona un producto
                  </option>

                  {productos.map((producto) => (
                    <option
                      key={producto.id}
                      value={producto.id}
                    >
                      {producto.nombre} â€” Stock: {producto.stock}
                    </option>
                  ))}
                </select>

                <label>Tipo de movimiento</label>

                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipo: e.target.value,
                    })
                  }
                >
                  <option value="entrada">
                    Entrada de mercancÃ­a
                  </option>

                  <option value="salida">
                    Salida de mercancÃ­a
                  </option>
                </select>

                <label>Cantidad</label>

                <input
                  type="number"
                  min="1"
                  value={form.cantidad}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cantidad: e.target.value,
                    })
                  }
                  placeholder="Ej. 20"
                  required
                />

                <label>Motivo</label>

                <input
                  type="text"
                  value={form.motivo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      motivo: e.target.value,
                    })
                  }
                  placeholder="Ej. Compra de mercancÃ­a"
                  required
                />

                <button
                  type="submit"
                  className="btn btn-purple btn-full"
                  disabled={guardando}
                >
                  <i className="bi bi-arrow-left-right" />

                  {guardando
                    ? 'Registrando...'
                    : 'Registrar movimiento'}
                </button>
              </form>
            </div>

            <div className="inventory-stock-card">
              <div className="inventory-card-header">
                <div className="inventory-icon">
                  <i className="bi bi-bar-chart" />
                </div>

                <div>
                  <p className="eyebrow">ESTADO ACTUAL</p>
                  <h3>Stock de productos</h3>
                </div>
              </div>

              <div className="inventory-product-list">
                {productos.length === 0 ? (
                  <p>No hay productos registrados.</p>
                ) : (
                  productos.map((producto) => (
                    <div
                      className="inventory-product-row"
                      key={producto.id}
                    >
                      <div>
                        <strong>{producto.nombre}</strong>

                        <span>
                          {producto.categoria || 'Sin categorÃ­a'}
                        </span>
                      </div>

                      <div className="inventory-stock-value">
                        <strong>{producto.stock}</strong>
                        <span>unidades</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="inventory-history">
            <div className="panel-head">
              <div>
                <p className="eyebrow">HISTORIAL</p>
                <h3>Movimientos recientes</h3>
              </div>
            </div>

            {movimientos.length === 0 ? (
              <div className="dashboard-empty">
                <i className="bi bi-clock-history" />

                <h3>No hay movimientos todavÃ­a</h3>

                <p>
                  Los movimientos de entrada y salida aparecerÃ¡n
                  aquÃ­.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Stock anterior</th>
                      <th>Stock nuevo</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...movimientos]
                      .reverse()
                      .map((movimiento) => (
                        <tr key={movimiento.id}>
                          <td>
                            {new Date(
                              movimiento.fecha
                            ).toLocaleString('es-CO')}
                          </td>

                          <td>
                            <strong>
                              {movimiento.producto}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={
                                movimiento.tipo === 'entrada'
                                  ? 'status success'
                                  : 'status warning'
                              }
                            >
                              {movimiento.tipo === 'entrada'
                                ? 'Entrada'
                                : 'Salida'}
                            </span>
                          </td>

                          <td>
                            {movimiento.cantidad}
                          </td>

                          <td>
                            {movimiento.stockAnterior}
                          </td>

                          <td>
                            <strong>
                              {movimiento.stockNuevo}
                            </strong>
                          </td>

                          <td>
                            {movimiento.motivo}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default InventarioAdmin
