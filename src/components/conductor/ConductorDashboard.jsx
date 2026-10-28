import { useEffect, useMemo, useState } from 'react'

import DashboardShell from '../shared/DashboardShell'
import StatCard from '../shared/StatCard'
import { apiRequest } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const menu = [
  {
    id: 'inicio',
    label: 'Resumen',
    icon: 'bi-grid-1x2',
  },
  {
    id: 'pedidos',
    label: 'Mis pedidos',
    icon: 'bi-box-seam',
  },
  {
    id: 'rutas',
    label: 'Mis rutas',
    icon: 'bi-map',
  },
  {
    id: 'ayudante',
    label: 'Ayudante',
    icon: 'bi-person-plus',
  },
]

function ConductorDashboard() {
  const { usuario } = useAuth()

  const [active, setActive] = useState('inicio')
  const [pedidos, setPedidos] = useState([])
  const [rutas, setRutas] = useState([])
  const [conductores, setConductores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setMensaje('')

      const [pedidosData, rutasData, conductoresData] =
        await Promise.all([
          apiRequest('/pedidos'),
          apiRequest('/rutas'),
          apiRequest('/conductores'),
        ])

      setPedidos(Array.isArray(pedidosData) ? pedidosData : [])
      setRutas(Array.isArray(rutasData) ? rutasData : [])
      setConductores(
        Array.isArray(conductoresData) ? conductoresData : []
      )
    } catch (error) {
      console.error(error)
      setMensaje(
        'No fue posible cargar la información del conductor.'
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const nombreUsuario =
    usuario?.user_metadata?.nombre ||
    usuario?.user_metadata?.nombreCompleto ||
    usuario?.user_metadata?.full_name ||
    usuario?.user_metadata?.name ||
    ''

  const correoUsuario =
    usuario?.email ||
    usuario?.user_metadata?.email ||
    ''

  const conductorActual = useMemo(() => {
    if (!conductores.length) {
      return null
    }

    const porCorreo = conductores.find(
      conductor =>
        conductor?.correo &&
        correoUsuario &&
        conductor.correo.toLowerCase() ===
          correoUsuario.toLowerCase()
    )

    if (porCorreo) {
      return porCorreo
    }

    const porNombre = conductores.find(
      conductor => {
        const nombre = conductor?.nombre || ''

        return (
          nombreUsuario &&
          nombre.toLowerCase() ===
            nombreUsuario.toLowerCase()
        )
      }
    )

    return porNombre || null
  }, [conductores, correoUsuario, nombreUsuario])

  const nombreConductor =
    conductorActual?.nombre ||
    nombreUsuario ||
    'Conductor'

  const misPedidos = useMemo(() => {
    return pedidos.filter(pedido => {
      const conductor = String(
        pedido?.conductor || ''
      ).trim()

      if (
        !conductor ||
        conductor.toLowerCase() === 'sin asignar'
      ) {
        return false
      }

      return (
        conductor.toLowerCase() ===
        nombreConductor.toLowerCase()
      )
    })
  }, [pedidos, nombreConductor])

  const misRutas = useMemo(() => {
    return rutas.filter(ruta => {
      const conductor = String(
        ruta?.conductor || ''
      ).trim()

      if (
        !conductor ||
        conductor.toLowerCase() === 'sin asignar'
      ) {
        return false
      }

      return (
        conductor.toLowerCase() ===
        nombreConductor.toLowerCase()
      )
    })
  }, [rutas, nombreConductor])

  const pedidosCompletados = misPedidos.filter(
    pedido =>
      String(pedido.estado || '').toLowerCase() ===
      'entregado'
  ).length

  const rutasActivas = misRutas.filter(ruta => {
    const estado = String(
      ruta.estado || ''
    ).toLowerCase()

    return (
      estado === 'en ruta' ||
      estado === 'en curso'
    )
  }).length

  const zona =
    conductorActual?.zona ||
    misRutas[0]?.zona ||
    'Sin zona asignada'

  const cambiarEstadoPedido = async (
    pedido,
    nuevoEstado
  ) => {
    try {
      setMensaje('')

      await apiRequest(
        `/pedidos/${pedido.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            estado: nuevoEstado,
          }),
        }
      )

      await cargarDatos()
    } catch (error) {
      console.error(error)
      setMensaje(
        'No fue posible actualizar el pedido.'
      )
    }
  }

  const cambiarEstadoRuta = async (
    ruta,
    nuevoEstado
  ) => {
    try {
      setMensaje('')

      await apiRequest(
        `/rutas/${ruta.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            estado: nuevoEstado,
          }),
        }
      )

      const pedidosRuta = pedidos.filter(
        pedido =>
          Array.isArray(ruta.pedidos) &&
          ruta.pedidos
            .map(String)
            .includes(String(pedido.id))
      )

      let estadoPedidos = null

      if (nuevoEstado === 'En ruta') {
        estadoPedidos = 'En ruta'
      }

      if (nuevoEstado === 'Entregada') {
        estadoPedidos = 'Entregado'
      }

      if (estadoPedidos) {
        await Promise.all(
          pedidosRuta.map(pedido =>
            apiRequest(
              `/pedidos/${pedido.id}`,
              {
                method: 'PATCH',
                body: JSON.stringify({
                  estado: estadoPedidos,
                }),
              }
            )
          )
        )
      }

      await cargarDatos()
    } catch (error) {
      console.error(error)
      setMensaje(
        'No fue posible actualizar la ruta.'
      )
    }
  }

  const abrirMapa = ruta => {
    const destino = encodeURIComponent(
      ruta?.zona ||
        ruta?.nombre ||
        'Bogotá'
    )

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${destino}`

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const obtenerPedidosRuta = ruta => {
    if (!Array.isArray(ruta?.pedidos)) {
      return []
    }

    return pedidos.filter(pedido =>
      ruta.pedidos
        .map(String)
        .includes(String(pedido.id))
    )
  }

  return (
    <DashboardShell
      role="conductor"
      menu={menu}
      active={active}
      setActive={setActive}
      title="Panel del conductor"
    >
      {mensaje && (
        <div
          className="alert alert-warning"
          role="alert"
        >
          {mensaje}
        </div>
      )}

      {cargando ? (
        <section className="dashboard-panel">
          <p>
            Cargando información de operación...
          </p>
        </section>
      ) : (
        <>
          {active === 'inicio' && (
            <>
              <div className="stats-grid">
                <StatCard
                  icon="bi-box-seam"
                  label="Pedidos asignados"
                  value={misPedidos.length}
                />

                <StatCard
                  icon="bi-map"
                  label="Rutas activas"
                  value={rutasActivas}
                />

                <StatCard
                  icon="bi-check2-circle"
                  label="Entregas completadas"
                  value={pedidosCompletados}
                />

                <StatCard
                  icon="bi-geo-alt"
                  label="Zona"
                  value={zona}
                />
              </div>

              <section className="dashboard-panel welcome-panel">
                <p className="eyebrow">
                  OPERACIÓN DEL DÍA
                </p>

                <h2>
                  Bienvenido, {nombreConductor}.
                </h2>

                <p>
                  Consulta tus pedidos asignados,
                  revisa tus rutas y actualiza el
                  estado de tus entregas desde este
                  panel.
                </p>

                <div className="dashboard-actions">
                  <button
                    className="btn btn-purple"
                    onClick={() =>
                      setActive('pedidos')
                    }
                  >
                    <i className="bi bi-box-seam" /> Ver mis pedidos
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={() =>
                      setActive('rutas')
                    }
                  >
                    <i className="bi bi-map" /> Ver mis rutas
                  </button>
                </div>
              </section>
            </>
          )}

          {active === 'pedidos' && (
            <section className="dashboard-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">
                    ENTREGAS
                  </p>

                  <h2>
                    Mis pedidos asignados
                  </h2>
                </div>

                <span className="status">
                  {misPedidos.length} pedidos
                </span>
              </div>

              {misPedidos.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-inbox" />

                  <h3>
                    No tienes pedidos asignados
                  </h3>

                  <p>
                    Cuando administración te asigne
                    pedidos, aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="order-list">
                  {misPedidos.map(pedido => {
                    const estado = String(
                      pedido.estado || 'Pendiente'
                    ).toLowerCase()

                    const entregado =
                      estado === 'entregado'

                    const enRuta =
                      estado === 'en ruta' ||
                      estado === 'en curso'

                    return (
                      <article
                        className="order-card"
                        key={pedido.id}
                      >
                        <div className="order-title">
                          <div>
                            <span className="order-id">
                              #{pedido.id}
                            </span>

                            <h3>
                              {pedido.cliente ||
                                'Cliente sin nombre'}
                            </h3>
                          </div>

                          <span className="status">
                            {pedido.estado ||
                              'Pendiente'}
                          </span>
                        </div>

                        <div className="order-details">
                          <span>
                            <i className="bi bi-geo-alt" />{' '}
                            {pedido.direccion ||
                              'Dirección no disponible'}
                          </span>

                          <span>
                            <i className="bi bi-box" />{' '}
                            {pedido.producto ||
                              'Productos del pedido'}
                            {pedido.cantidad
                              ? ` x${pedido.cantidad}`
                              : ''}
                          </span>

                          {pedido.total && (
                            <span>
                              <i className="bi bi-cash-stack" /> $
                              {Number(
                                pedido.total
                              ).toLocaleString('es-CO')}
                            </span>
                          )}
                        </div>

                        <div className="dashboard-actions">
                          {!enRuta &&
                            !entregado && (
                              <button
                                className="btn btn-purple"
                                onClick={() =>
                                  cambiarEstadoPedido(
                                    pedido,
                                    'En ruta'
                                  )
                                }
                              >
                                <i className="bi bi-truck" /> Iniciar entrega
                              </button>
                            )}

                          {enRuta && (
                            <button
                              className="btn btn-purple"
                              onClick={() =>
                                cambiarEstadoPedido(
                                  pedido,
                                  'Entregado'
                                )
                              }
                            >
                              <i className="bi bi-check2-circle" /> Marcar entregado
                            </button>
                          )}

                          {entregado && (
                            <span className="status">
                              <i className="bi bi-check2-circle" /> Entrega completada
                            </span>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {active === 'rutas' && (
            <section className="dashboard-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">
                    LOGÍSTICA
                  </p>

                  <h2>
                    Mis rutas
                  </h2>
                </div>

                <span className="status">
                  {misRutas.length} rutas
                </span>
              </div>

              {misRutas.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-map" />

                  <h3>
                    No tienes rutas asignadas
                  </h3>

                  <p>
                    Las rutas creadas por
                    administración aparecerán aquí
                    cuando estén asignadas.
                  </p>
                </div>
              ) : (
                <div className="route-list">
                  {misRutas.map(ruta => {
                    const pedidosRuta =
                      obtenerPedidosRuta(ruta)

                    return (
                      <article
                        className="route-card"
                        key={ruta.id}
                      >
                        <div className="route-map-icon">
                          <i className="bi bi-truck" />
                        </div>

                        <div>
                          <span className="order-id">
                            #{ruta.id}
                          </span>

                          <h3>
                            {ruta.nombre ||
                              'Ruta sin nombre'}
                          </h3>

                          <p>
                            <i className="bi bi-geo-alt" />{' '}
                            {ruta.zona ||
                              'Zona no especificada'}
                          </p>

                          <p>
                            <i className="bi bi-box-seam" />{' '}
                            {pedidosRuta.length} pedidos
                          </p>

                          <span className="status">
                            {ruta.estado ||
                              'Pendiente'}
                          </span>
                        </div>

                        <div className="dashboard-actions">
                          {ruta.estado !== 'En ruta' &&
                            ruta.estado !== 'Entregada' &&
                            ruta.estado !== 'Cancelada' && (
                              <button
                                className="btn btn-purple"
                                onClick={() =>
                                  cambiarEstadoRuta(
                                    ruta,
                                    'En ruta'
                                  )
                                }
                              >
                                <i className="bi bi-play-fill" /> Iniciar ruta
                              </button>
                            )}

                          {ruta.estado === 'En ruta' && (
                            <button
                              className="btn btn-purple"
                              onClick={() =>
                                cambiarEstadoRuta(
                                  ruta,
                                  'Entregada'
                                )
                              }
                            >
                              <i className="bi bi-check2-circle" /> Finalizar ruta
                            </button>
                          )}

                          <button
                            className="btn btn-outline"
                            onClick={() =>
                              abrirMapa(ruta)
                            }
                          >
                            <i className="bi bi-map" /> Abrir mapa
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {active === 'ayudante' && (
            <section className="dashboard-panel">
              <p className="eyebrow">
                EQUIPO
              </p>

              <h2>
                Ayudante de entrega
              </h2>

              <div className="empty-state">
                <i className="bi bi-person-plus" />

                <h3>
                  Gestión de ayudantes
                </h3>

                <p>
                  Actualmente no tienes un
                  ayudante asignado desde el
                  sistema.
                </p>

                <small>
                  Esta sección quedará preparada
                  para conectar ayudantes
                  posteriormente.
                </small>
              </div>
            </section>
          )}
        </>
      )}
    </DashboardShell>
  )
}

export default ConductorDashboard