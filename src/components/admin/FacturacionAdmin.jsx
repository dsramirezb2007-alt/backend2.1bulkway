import { useMemo, useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import Modal from '../shared/Modal'

const iniciales = [
  {
    id: 'FAC-001',
    pedido: 'BK-201',
    cliente: 'Supermercado El Ahorro',
    total: 615500,
    estado: 'Pagada',
    metodo: 'Transferencia bancaria',
    fecha: '2026-09-21',
    vencimiento: '2026-10-05',
  },
  {
    id: 'FAC-002',
    pedido: 'BK-202',
    cliente: 'Distribuciones La Economía',
    total: 433000,
    estado: 'Pendiente',
    metodo: 'Nequi',
    fecha: '2026-09-21',
    vencimiento: '2026-10-05',
  },
]

function FacturacionAdmin() {
  const { usuario } = useAuth()

  const esAdministradorPrincipal =
    usuario?.email?.toLowerCase() === 'admin@bulkway.com'

  const claveFacturas = `bulkwayFacturas_${usuario?.id || 'sin-usuario'}`

  const [facturas, setFacturas] = useState(() => {
    const guardadas = localStorage.getItem(claveFacturas)

    if (guardadas) {
      try {
        return JSON.parse(guardadas)
      } catch {
        return esAdministradorPrincipal ? iniciales : []
      }
    }

    return esAdministradorPrincipal ? iniciales : []
  })

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todas')
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  const guardarFacturas = (nuevasFacturas) => {
    setFacturas(nuevasFacturas)
    localStorage.setItem(
      claveFacturas,
      JSON.stringify(nuevasFacturas)
    )
  }

  const cambiarEstado = (id, estado) => {
    const nuevasFacturas = facturas.map((factura) =>
      factura.id === id
        ? {
            ...factura,
            estado,
          }
        : factura
    )

    guardarFacturas(nuevasFacturas)

    if (facturaSeleccionada?.id === id) {
      setFacturaSeleccionada((actual) => ({
        ...actual,
        estado,
      }))
    }
  }

  const abrirDetalle = (factura) => {
    setFacturaSeleccionada(factura)
    setModalAbierto(true)
  }

  const cerrarDetalle = () => {
    setModalAbierto(false)
    setFacturaSeleccionada(null)
  }

  const facturasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return facturas.filter((factura) => {
      const coincideEstado =
        filtroEstado === 'Todas' ||
        factura.estado === filtroEstado

      const contenido = `
        ${factura.id || ''}
        ${factura.pedido || ''}
        ${factura.cliente || ''}
        ${factura.metodo || ''}
      `.toLowerCase()

      const coincideBusqueda =
        !texto || contenido.includes(texto)

      return coincideEstado && coincideBusqueda
    })
  }, [facturas, busqueda, filtroEstado])

  const resumen = useMemo(() => {
    const totalFacturado = facturas.reduce(
      (total, factura) => total + Number(factura.total || 0),
      0
    )

    const totalPagado = facturas
      .filter((factura) => factura.estado === 'Pagada')
      .reduce(
        (total, factura) => total + Number(factura.total || 0),
        0
      )

    const totalPendiente = facturas
      .filter((factura) => factura.estado === 'Pendiente')
      .reduce(
        (total, factura) => total + Number(factura.total || 0),
        0
      )

    const totalMora = facturas
      .filter((factura) => factura.estado === 'En Mora')
      .reduce(
        (total, factura) => total + Number(factura.total || 0),
        0
      )

    return {
      totalFacturado,
      totalPagado,
      totalPendiente,
      totalMora,
    }
  }, [facturas])

  const formatoMoneda = (valor) =>
    `$${Number(valor || 0).toLocaleString('es-CO')}`

  const claseEstado = (estado) => {
    if (estado === 'Pagada') return 'success'
    if (estado === 'En Mora') return 'danger'
    return 'warning'
  }

  return (
    <section className="dashboard-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">GESTIÓN FINANCIERA</p>

          <h2>Facturación</h2>

          <p>
            Controla las facturas, pagos pendientes y cartera
            de la operación.
          </p>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="billing-stats">
        <article className="billing-stat-card">
          <div className="billing-stat-icon">
            <i className="bi bi-receipt" />
          </div>

          <div>
            <span>Total facturado</span>
            <strong>
              {formatoMoneda(resumen.totalFacturado)}
            </strong>
          </div>
        </article>

        <article className="billing-stat-card">
          <div className="billing-stat-icon pending">
            <i className="bi bi-hourglass-split" />
          </div>

          <div>
            <span>Pendiente de pago</span>
            <strong>
              {formatoMoneda(resumen.totalPendiente)}
            </strong>
          </div>
        </article>

        <article className="billing-stat-card">
          <div className="billing-stat-icon paid">
            <i className="bi bi-check-circle" />
          </div>

          <div>
            <span>Total pagado</span>
            <strong>
              {formatoMoneda(resumen.totalPagado)}
            </strong>
          </div>
        </article>

        <article className="billing-stat-card">
          <div className="billing-stat-icon danger">
            <i className="bi bi-exclamation-circle" />
          </div>

          <div>
            <span>En mora</span>
            <strong>
              {formatoMoneda(resumen.totalMora)}
            </strong>
          </div>
        </article>
      </div>

      {/* HERRAMIENTAS */}
      <div className="billing-toolbar">
        <div className="billing-search">
          <i className="bi bi-search" />

          <input
            type="search"
            placeholder="Buscar factura, cliente o pedido..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
          />
        </div>

        <div className="billing-filters">
          {['Todas', 'Pendiente', 'Pagada', 'En Mora'].map(
            (estado) => (
              <button
                key={estado}
                type="button"
                className={
                  filtroEstado === estado
                    ? 'billing-filter active'
                    : 'billing-filter'
                }
                onClick={() => setFiltroEstado(estado)}
              >
                {estado}
              </button>
            )
          )}
        </div>
      </div>

      {/* ENCABEZADO DE LISTA */}
      <div className="billing-list-head">
        <div>
          <p className="eyebrow">DOCUMENTOS</p>

          <h3>Facturas registradas</h3>
        </div>

        <span>
          {facturasFiltradas.length}{' '}
          {facturasFiltradas.length === 1
            ? 'factura'
            : 'facturas'}
        </span>
      </div>

      {/* FACTURAS */}
      {facturasFiltradas.length === 0 ? (
        <div className="billing-empty">
          <div className="billing-empty-icon">
            <i className="bi bi-receipt-cutoff" />
          </div>

          <h3>No encontramos facturas</h3>

          <p>
            Prueba cambiando el filtro o realizando otra
            búsqueda.
          </p>
        </div>
      ) : (
        <div className="invoice-list">
          {facturasFiltradas.map((factura) => (
            <article
              className="invoice-card"
              key={factura.id}
            >
              <div className="invoice-main">
                <div className="invoice-icon">
                  <i className="bi bi-file-earmark-text" />
                </div>

                <div className="invoice-info">
                  <div className="invoice-topline">
                    <span className="order-id">
                      {factura.id}
                    </span>

                    <span
                      className={`invoice-status ${claseEstado(
                        factura.estado
                      )}`}
                    >
                      {factura.estado}
                    </span>
                  </div>

                  <h3>{factura.cliente}</h3>

                  <p>
                    <span>
                      <i className="bi bi-box-seam" />
                      Pedido {factura.pedido}
                    </span>

                    <span>
                      <i className="bi bi-credit-card" />
                      {factura.metodo}
                    </span>
                  </p>

                  <div className="invoice-dates">
                    <span>
                      <small>Emitida</small>
                      {factura.fecha || 'Sin fecha'}
                    </span>

                    <span>
                      <small>Vencimiento</small>
                      {factura.vencimiento || 'Sin fecha'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="invoice-right">
                <strong>
                  {formatoMoneda(factura.total)}
                </strong>

                <select
                  value={factura.estado}
                  onChange={(event) =>
                    cambiarEstado(
                      factura.id,
                      event.target.value
                    )
                  }
                  aria-label={`Estado de ${factura.id}`}
                >
                  <option value="Pendiente">
                    Pendiente
                  </option>

                  <option value="Pagada">
                    Pagada
                  </option>

                  <option value="En Mora">
                    En Mora
                  </option>
                </select>

                <button
                  type="button"
                  className="btn btn-light invoice-detail-button"
                  onClick={() => abrirDetalle(factura)}
                >
                  <i className="bi bi-eye" />
                  Ver detalle
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MODAL DETALLE */}
      <Modal
        open={modalAbierto}
        title={
          facturaSeleccionada
            ? `Factura ${facturaSeleccionada.id}`
            : 'Detalle de factura'
        }
        onClose={cerrarDetalle}
      >
        {facturaSeleccionada && (
          <div className="invoice-detail">
            <div className="invoice-detail-header">
              <div className="invoice-detail-icon">
                <i className="bi bi-receipt" />
              </div>

              <div>
                <p className="eyebrow">DOCUMENTO DE COBRO</p>

                <h3>{facturaSeleccionada.id}</h3>
              </div>

              <span
                className={`invoice-status ${claseEstado(
                  facturaSeleccionada.estado
                )}`}
              >
                {facturaSeleccionada.estado}
              </span>
            </div>

            <div className="invoice-detail-client">
              <p className="eyebrow">CLIENTE</p>

              <h4>{facturaSeleccionada.cliente}</h4>

              <p>
                Pedido asociado:{' '}
                <strong>
                  {facturaSeleccionada.pedido}
                </strong>
              </p>
            </div>

            <div className="invoice-detail-grid">
              <div>
                <span>Fecha de emisión</span>
                <strong>
                  {facturaSeleccionada.fecha ||
                    'Sin fecha'}
                </strong>
              </div>

              <div>
                <span>Fecha de vencimiento</span>
                <strong>
                  {facturaSeleccionada.vencimiento ||
                    'Sin fecha'}
                </strong>
              </div>

              <div>
                <span>Método de pago</span>
                <strong>
                  {facturaSeleccionada.metodo ||
                    'Sin especificar'}
                </strong>
              </div>

              <div>
                <span>Estado</span>
                <strong>
                  {facturaSeleccionada.estado}
                </strong>
              </div>
            </div>

            <div className="invoice-total-box">
              <span>Total de la factura</span>

              <strong>
                {formatoMoneda(
                  facturaSeleccionada.total
                )}
              </strong>
            </div>

            <div className="invoice-detail-actions">
              {facturaSeleccionada.estado !== 'Pagada' && (
                <button
                  type="button"
                  className="btn btn-purple"
                  onClick={() => {
                    cambiarEstado(
                      facturaSeleccionada.id,
                      'Pagada'
                    )
                  }}
                >
                  <i className="bi bi-check2-circle" />
                  Marcar como pagada
                </button>
              )}

              <button
                type="button"
                className="btn btn-light"
                onClick={cerrarDetalle}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default FacturacionAdmin