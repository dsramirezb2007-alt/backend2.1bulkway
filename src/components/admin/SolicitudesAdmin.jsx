import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'
import ConfirmModal from '../shared/ConfirmModal'

function SolicitudesAdmin() {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null)

  const cargarSolicitudes = useCallback(async () => {
    try {
      setCargando(true)
      setError('')

      const datos = await apiRequest('/solicitudes', {
        api: 'express',
      })

      setSolicitudes(Array.isArray(datos) ? datos : [])
    } catch (err) {
      setError(err.message || 'No fue posible cargar las solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarSolicitudes()
  }, [cargarSolicitudes])

  function aprobarSolicitud(solicitud) {
    setError('')
    setMensaje('')
    setSolicitudSeleccionada(solicitud)
  }

  async function confirmarAprobacion() {
    if (!solicitudSeleccionada) return

    const solicitud = solicitudSeleccionada

    try {
      setProcesando(solicitud.id)
      setError('')
      setMensaje('')

      const resultado = await apiRequest(
        `/solicitudes/${encodeURIComponent(solicitud.id)}/aprobar`,
        {
          method: 'POST',
          api: 'express',
        }
      )

      setSolicitudSeleccionada(null)
      setMensaje(
        resultado.mensaje || 'Solicitud aprobada correctamente.'
      )

      await cargarSolicitudes()
    } catch (err) {
      setSolicitudSeleccionada(null)
      setError(err.message || 'No fue posible aprobar la solicitud.')
      await cargarSolicitudes()
    } finally {
      setProcesando('')
    }
  }

  return (
    <div className="admin-solicitudes">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">GESTIÓN COMERCIAL</p>
          <h2>Solicitudes de clientes</h2>
          <p>
            Revisa los productos solicitados y aprueba las solicitudes
            pendientes para generar los pedidos.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh"
          onClick={cargarSolicitudes}
          disabled={cargando || Boolean(procesando)}
        >
          <i className="bi bi-arrow-clockwise" />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-circle me-2" />
          {error}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success" role="status">
          <i className="bi bi-check-circle me-2" />
          {mensaje}
        </div>
      )}

      {!cargando && !error && solicitudes.length === 0 && (
        <section className="dashboard-panel text-center p-4">
          <i className="bi bi-inbox fs-1" />
          <h3 className="mt-3">No hay solicitudes registradas</h3>
          <p>
            Cuando un cliente envíe una solicitud, aparecerá en esta sección.
          </p>
        </section>
      )}

      {cargando && (
        <div className="dashboard-panel p-4" role="status">
          <i className="bi bi-arrow-repeat me-2" />
          Cargando solicitudes...
        </div>
      )}

      {!cargando && solicitudes.length > 0 && (
        <div className="d-flex flex-column gap-3">
          {solicitudes.map((solicitud) => {
            const pendiente = solicitud.estado === 'Pendiente'

            return (
              <section
                className="dashboard-panel p-3 p-md-4"
                key={solicitud.id}
              >
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                  <div>
                    <p className="eyebrow mb-2">
                      SOLICITUD {solicitud.id}
                    </p>

                    <h3 className="h5 mb-2">
                      {solicitud.cliente || 'Cliente sin nombre'}
                    </h3>

                    <p className="mb-1">
                      <i className="bi bi-envelope me-2" />
                      {solicitud.clienteEmail || 'Sin correo registrado'}
                    </p>

                    <p className="mb-1">
                      <i className="bi bi-geo-alt me-2" />
                      {solicitud.direccion || 'Sin dirección'}
                    </p>

                    <p className="text-muted mb-0">
                      <i className="bi bi-calendar3 me-2" />
                      {solicitud.fecha
                        ? new Date(solicitud.fecha).toLocaleString('es-CO')
                        : 'Fecha no disponible'}
                    </p>
                  </div>

                  <span
                    className={`badge ${
                      pendiente
                        ? 'text-bg-warning'
                        : solicitud.estado === 'Aprobada'
                          ? 'text-bg-success'
                          : 'text-bg-secondary'
                    }`}
                  >
                    {solicitud.estado || 'Sin estado'}
                  </span>
                </div>

                <hr />

                <h4 className="h6">Productos solicitados</h4>

                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-end">Cantidad</th>
                        <th className="text-end">Precio unitario</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(solicitud.items || []).map((item, indice) => (
                        <tr
                          key={`${solicitud.id}-${item.productoId}-${indice}`}
                        >
                          <td>{item.producto || item.productoId}</td>
                          <td className="text-end">{item.cantidad}</td>
                          <td className="text-end">
                            ${Number(item.precioUnitario || 0).toLocaleString('es-CO')}
                          </td>
                          <td className="text-end">
                            ${Number(item.subtotal || 0).toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div>
                    <div className="text-muted small">
                      Cantidad total: {solicitud.cantidadTotal || 0} unidades
                    </div>

                    <strong className="fs-5">
                      Total: ${Number(solicitud.total || 0).toLocaleString('es-CO')}
                    </strong>

                    {solicitud.pedidoIds?.length > 0 && (
                      <p className="small text-muted mb-0 mt-1">
                        Pedidos generados: {solicitud.pedidoIds.join(', ')}
                      </p>
                    )}
                  </div>

                  {pendiente && (
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={Boolean(procesando)}
                      onClick={() => aprobarSolicitud(solicitud)}
                    >
                      {procesando === solicitud.id ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            aria-hidden="true"
                          />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2" />
                          Aprobar y crear pedidos
                        </>
                      )}
                    </button>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(solicitudSeleccionada)}
        title="Confirmar aprobación"
        message={
          solicitudSeleccionada
            ? `¿Deseas aprobar la solicitud de ${solicitudSeleccionada.cliente || 'Cliente'} por $${Number(
                solicitudSeleccionada.total || 0
              ).toLocaleString('es-CO')}? Se verificarán las existencias antes de crear los pedidos.`
            : ''
        }
        confirmText="Sí, aprobar solicitud"
        cancelText="Volver"
        onConfirm={confirmarAprobacion}
        onClose={() => setSolicitudSeleccionada(null)}
        loading={Boolean(procesando)}
      />
    </div>
  )
}

export default SolicitudesAdmin