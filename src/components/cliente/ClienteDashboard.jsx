import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '../shared/DashboardShell'
import StatCard from '../shared/StatCard'
import ProductoCard from '../home/ProductoCard'
import { apiRequest } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const menu = [
  {
    id: 'inicio',
    label: 'Resumen',
    icon: 'bi-grid-1x2',
  },
  {
    id: 'catalogo',
    label: 'Catálogo',
    icon: 'bi-basket3',
  },
  {
    id: 'solicitudes',
    label: 'Mis solicitudes',
    icon: 'bi-clipboard-check',
  },
  {
    id: 'pedidos',
    label: 'Mis pedidos',
    icon: 'bi-box-seam',
  },
  {
    id: 'facturas',
    label: 'Mis facturas',
    icon: 'bi-receipt',
  },
  {
    id: 'seguimiento',
    label: 'Seguimiento',
    icon: 'bi-truck',
  },
  {
    id: 'perfil',
    label: 'Mi perfil',
    icon: 'bi-person',
  },
]

function ClienteDashboard() {
  const { usuario } = useAuth()

  const [active, setActive] = useState('inicio')
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [carrito, setCarrito] = useState([])
  const [direccion, setDireccion] = useState('')
  const [cargando, setCargando] = useState(true)
  const [creandoSolicitud, setCreandoSolicitud] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('warning')

  const nombreUsuario =
    usuario?.user_metadata?.nombre ||
    usuario?.user_metadata?.nombreCompleto ||
    usuario?.user_metadata?.full_name ||
    usuario?.user_metadata?.name ||
    'Cliente'

  const correoUsuario =
    usuario?.email ||
    usuario?.user_metadata?.email ||
    ''

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setMensaje('')

      const resultados = await Promise.allSettled([
        apiRequest('/productos'),
        apiRequest('/pedidos'),
        apiRequest('/solicitudes'),
      ])

      const productosData =
        resultados[0].status === 'fulfilled'
          ? resultados[0].value
          : []

      const pedidosData =
        resultados[1].status === 'fulfilled'
          ? resultados[1].value
          : []

      const solicitudesData =
        resultados[2].status === 'fulfilled'
          ? resultados[2].value
          : []

      setProductos(
        Array.isArray(productosData)
          ? productosData
          : []
      )

      setPedidos(
        Array.isArray(pedidosData)
          ? pedidosData
          : []
      )

      setSolicitudes(
        Array.isArray(solicitudesData)
          ? solicitudesData
          : []
      )
    } catch (error) {
      console.error(error)

      setTipoMensaje('warning')
      setMensaje(
        'No fue posible cargar la información de la cuenta.'
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const misPedidos = useMemo(() => {
    if (!correoUsuario) {
      return []
    }

    return pedidos.filter(pedido => {
      const emailPedido = String(
        pedido?.clienteEmail || ''
      )
        .trim()
        .toLowerCase()

      return (
        emailPedido &&
        emailPedido ===
          correoUsuario.trim().toLowerCase()
      )
    })
  }, [pedidos, correoUsuario])

  const misSolicitudes = useMemo(() => {
    if (!correoUsuario) {
      return []
    }

    return solicitudes
      .filter(solicitud => {
        const emailSolicitud = String(
          solicitud?.clienteEmail || ''
        )
          .trim()
          .toLowerCase()

        return (
          emailSolicitud &&
          emailSolicitud ===
            correoUsuario.trim().toLowerCase()
        )
      })
      .sort(
        (a, b) =>
          new Date(b.fecha || 0) -
          new Date(a.fecha || 0)
      )
  }, [solicitudes, correoUsuario])

  const solicitudesPendientes =
    misSolicitudes.filter(
      solicitud =>
        String(
          solicitud.estado || ''
        ).toLowerCase() === 'pendiente'
    ).length

  const pedidosEnRuta = misPedidos.filter(
    pedido => {
      const estado = String(
        pedido?.estado || ''
      ).toLowerCase()

      return (
        estado === 'en ruta' ||
        estado === 'en camino' ||
        estado === 'despachado'
      )
    }
  ).length

  const pedidosEntregados =
    misPedidos.filter(pedido => {
      return (
        String(
          pedido?.estado || ''
        ).toLowerCase() === 'entregado'
      )
    }).length

  const totalCarrito = useMemo(() => {
    return carrito.reduce(
      (total, item) =>
        total +
        Number(item.precio || 0) *
          Number(item.cantidad || 0),
      0
    )
  }, [carrito])

  const cantidadCarrito = useMemo(() => {
    return carrito.reduce(
      (total, item) =>
        total + Number(item.cantidad || 0),
      0
    )
  }, [carrito])

  const agregarAlCarrito = producto => {
    setMensaje('')

    const stock = Number(producto.stock || 0)

    if (stock <= 0) {
      setTipoMensaje('warning')
      setMensaje(
        `${producto.nombre} no tiene stock disponible.`
      )
      return
    }

    setCarrito(prev => {
      const existente = prev.find(
        item => item.id === producto.id
      )

      if (existente) {
        const cantidadActual = Number(
          existente.cantidad || 0
        )

        if (cantidadActual >= stock) {
          setTipoMensaje('warning')
          setMensaje(
            `Solo hay ${stock} unidades disponibles de ${producto.nombre}.`
          )

          return prev
        }

        return prev.map(item =>
          item.id === producto.id
            ? {
                ...item,
                cantidad: cantidadActual + 1,
              }
            : item
        )
      }

      return [
        ...prev,
        {
          ...producto,
          cantidad: 1,
        },
      ]
    })

    setTipoMensaje('success')
    setMensaje(
      `${producto.nombre} fue agregado al pedido.`
    )
  }

  const cambiarCantidad = (
    productoId,
    cantidad
  ) => {
    const nuevaCantidad = Number(cantidad)

    const producto = productos.find(
      item => item.id === productoId
    )

    if (!producto) {
      return
    }

    if (nuevaCantidad <= 0) {
      setCarrito(prev =>
        prev.filter(
          item => item.id !== productoId
        )
      )
      return
    }

    const stockDisponible = Number(
      producto.stock || 0
    )

    if (nuevaCantidad > stockDisponible) {
      setTipoMensaje('warning')
      setMensaje(
        `Solo hay ${stockDisponible} unidades disponibles de ${producto.nombre}.`
      )
      return
    }

    setCarrito(prev =>
      prev.map(item =>
        item.id === productoId
          ? {
              ...item,
              cantidad: nuevaCantidad,
            }
          : item
      )
    )
  }

  const eliminarDelCarrito = productoId => {
    setCarrito(prev =>
      prev.filter(
        item => item.id !== productoId
      )
    )
  }

  const enviarSolicitud = async () => {
    if (!carrito.length) {
      setTipoMensaje('warning')
      setMensaje(
        'Agrega al menos un producto a tu solicitud.'
      )
      return
    }

    if (!correoUsuario) {
      setTipoMensaje('warning')
      setMensaje(
        'No se pudo identificar el correo de la cuenta.'
      )
      return
    }

    if (!direccion.trim()) {
      setTipoMensaje('warning')
      setMensaje(
        'Ingresa la dirección donde deseas recibir tu pedido.'
      )
      return
    }

    try {
      setCreandoSolicitud(true)
      setMensaje('')

      const items = carrito.map(item => {
        const cantidad = Number(
          item.cantidad || 0
        )

        const precioUnitario = Number(
          item.precio || 0
        )

        return {
          productoId: item.id,
          producto: item.nombre,
          cantidad,
          precioUnitario,
          subtotal:
            cantidad * precioUnitario,
        }
      })

      const solicitud = {
        id: `SOL-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`,

        fecha: new Date().toISOString(),

        cliente: nombreUsuario,
        clienteEmail: correoUsuario,

        direccion: direccion.trim(),

        items,

        cantidadTotal: cantidadCarrito,
        total: totalCarrito,

        estado: 'Pendiente',

        observacion:
          'Solicitud enviada por el cliente.',

        pedidoId: null,
      }

      await apiRequest('/solicitudes', {
        method: 'POST',
        body: JSON.stringify(solicitud),
      })

      setCarrito([])
      setDireccion('')

      setTipoMensaje('success')
      setMensaje(
        'Solicitud enviada correctamente. Administración debe revisarla antes de convertirla en pedido.'
      )

      await cargarDatos()
      setActive('solicitudes')
    } catch (error) {
      console.error(error)

      setTipoMensaje('warning')
      setMensaje(
        'No fue posible enviar la solicitud de pedido.'
      )
    } finally {
      setCreandoSolicitud(false)
    }
  }

  const pedidoEnSeguimiento = useMemo(() => {
    return (
      misPedidos.find(pedido => {
        const estado = String(
          pedido?.estado || ''
        ).toLowerCase()

        return (
          estado === 'en ruta' ||
          estado === 'en camino' ||
          estado === 'despachado'
        )
      }) ||
      misPedidos[0] ||
      null
    )
  }, [misPedidos])

  const estadoPedido =
    pedidoEnSeguimiento
      ? String(
          pedidoEnSeguimiento.estado || ''
        ).toLowerCase()
      : ''

  const preparado =
    estadoPedido === 'en preparación' ||
    estadoPedido === 'en preparacion' ||
    estadoPedido === 'despachado' ||
    estadoPedido === 'en ruta' ||
    estadoPedido === 'en camino' ||
    estadoPedido === 'entregado'

  const despachado =
    estadoPedido === 'despachado' ||
    estadoPedido === 'en ruta' ||
    estadoPedido === 'en camino' ||
    estadoPedido === 'entregado'

  const enRuta =
    estadoPedido === 'en ruta' ||
    estadoPedido === 'en camino'

  const entregado =
    estadoPedido === 'entregado'

  return (
    <DashboardShell
      role="cliente"
      menu={menu}
      active={active}
      setActive={setActive}
      title="Mi cuenta"
    >
      {mensaje && (
        <div
          className={`alert ${
            tipoMensaje === 'success'
              ? 'alert-success'
              : 'alert-warning'
          }`}
          role="alert"
        >
          {mensaje}
        </div>
      )}

      {cargando ? (
        <section className="dashboard-panel">
          <p>
            Cargando información de tu cuenta...
          </p>
        </section>
      ) : (
        <>
          {active === 'inicio' && (
            <>
              <div className="stats-grid">
                <StatCard
                  icon="bi-box-seam"
                  label="Pedidos"
                  value={misPedidos.length}
                />

                <StatCard
                  icon="bi-clipboard-check"
                  label="Solicitudes"
                  value={solicitudesPendientes}
                />

                <StatCard
                  icon="bi-truck"
                  label="En entrega"
                  value={pedidosEnRuta}
                />

                <StatCard
                  icon="bi-cart3"
                  label="Carrito"
                  value={cantidadCarrito}
                />
              </div>

              <section className="dashboard-panel welcome-panel">
                <p className="eyebrow">
                  MI CUENTA
                </p>

                <h2>
                  Bienvenido, {nombreUsuario}.
                </h2>

                <p>
                  Consulta el catálogo, prepara tu
                  solicitud y revisa el estado de tus
                  pedidos.
                </p>

                <div className="dashboard-actions">
                  <button
                    className="btn btn-purple"
                    onClick={() =>
                      setActive('catalogo')
                    }
                  >
                    <i className="bi bi-basket3" />{' '}
                    Ver catálogo
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={() =>
                      setActive('solicitudes')
                    }
                  >
                    <i className="bi bi-clipboard-check" />{' '}
                    Mis solicitudes
                  </button>
                </div>
              </section>
            </>
          )}

          {active === 'catalogo' && (
            <section className="dashboard-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">
                    CATÁLOGO
                  </p>

                  <h2>
                    Productos disponibles
                  </h2>
                </div>

                <span className="status">
                  {productos.length}{' '}
                  productos
                </span>
              </div>

              {productos.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-box-seam" />

                  <h3>
                    No hay productos disponibles
                  </h3>

                  <p>
                    Administración todavía no ha
                    registrado productos.
                  </p>
                </div>
              ) : (
                <>
                  <div className="row g-4">
                    {productos.map(producto => (
                      <div
                        className="col-lg-6"
                        key={producto.id}
                      >
                        <ProductoCard
                          {...producto}
                          icono={
                            producto.icono ||
                            'bi-box-seam'
                          }
                        />

                        <button
                          className="btn btn-purple mt-3"
                          disabled={
                            Number(
                              producto.stock || 0
                            ) <= 0
                          }
                          onClick={() =>
                            agregarAlCarrito(
                              producto
                            )
                          }
                        >
                          <i className="bi bi-cart-plus" />{' '}
                          {Number(
                            producto.stock || 0
                          ) <= 0
                            ? 'Sin stock'
                            : 'Agregar al pedido'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {carrito.length > 0 && (
                    <div
                      className="dashboard-panel"
                      style={{
                        marginTop: '24px',
                      }}
                    >
                      <div className="panel-head">
                        <div>
                          <p className="eyebrow">
                            CARRITO
                          </p>

                          <h2>
                            Tu solicitud
                          </h2>
                        </div>

                        <span className="status">
                          {cantidadCarrito}{' '}
                          unidades
                        </span>
                      </div>

                      <div className="order-list">
                        {carrito.map(item => (
                          <article
                            className="order-card"
                            key={item.id}
                          >
                            <div className="order-title">
                              <div>
                                <span className="order-id">
                                  {item.id}
                                </span>

                                <h3>
                                  {item.nombre}
                                </h3>
                              </div>

                              <strong>
                                $
                                {(
                                  Number(
                                    item.precio || 0
                                  ) *
                                  Number(
                                    item.cantidad || 0
                                  )
                                ).toLocaleString(
                                  'es-CO'
                                )}
                              </strong>
                            </div>

                            <div className="order-details">
                              <span>
                                Precio unitario: $
                                {Number(
                                  item.precio || 0
                                ).toLocaleString(
                                  'es-CO'
                                )}
                              </span>

                              <label>
                                Cantidad:
                                <input
                                  type="number"
                                  min="1"
                                  max={Number(
                                    item.stock || 1
                                  )}
                                  value={
                                    item.cantidad
                                  }
                                  onChange={e =>
                                    cambiarCantidad(
                                      item.id,
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    width: '80px',
                                    marginLeft:
                                      '8px',
                                  }}
                                />
                              </label>
                            </div>

                            <div className="dashboard-actions">
                              <button
                                className="btn btn-outline"
                                onClick={() =>
                                  eliminarDelCarrito(
                                    item.id
                                  )
                                }
                              >
                                <i className="bi bi-trash" />{' '}
                                Quitar
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>

                      <div
                        className="dashboard-panel"
                        style={{
                          marginTop: '20px',
                        }}
                      >
                        <p className="eyebrow">
                          ENTREGA
                        </p>

                        <h3>
                          Dirección de entrega
                        </h3>

                        <div className="auth-field">
                          <label>
                            Dirección
                          </label>

                          <div className="auth-input-wrap">
                            <i className="bi bi-geo-alt" />

                            <input
                              type="text"
                              value={direccion}
                              onChange={e =>
                                setDireccion(
                                  e.target.value
                                )
                              }
                              placeholder="Ej. Calle 80 # 20-15, Bogotá"
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        className="panel-head"
                        style={{
                          marginTop: '20px',
                        }}
                      >
                        <strong>
                          Total de la solicitud
                        </strong>

                        <h3>
                          $
                          {totalCarrito.toLocaleString(
                            'es-CO'
                          )}
                        </h3>
                      </div>

                      <button
                        className="btn btn-purple"
                        disabled={
                          creandoSolicitud
                        }
                        onClick={
                          enviarSolicitud
                        }
                      >
                        <i className="bi bi-send" />{' '}
                        {creandoSolicitud
                          ? 'Enviando solicitud...'
                          : 'Enviar solicitud de pedido'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {active === 'solicitudes' && (
            <section className="dashboard-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">
                    SOLICITUDES
                  </p>

                  <h2>
                    Mis solicitudes de pedido
                  </h2>
                </div>

                <span className="status">
                  {misSolicitudes.length}{' '}
                  solicitudes
                </span>
              </div>

              {misSolicitudes.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-clipboard-check" />

                  <h3>
                    No tienes solicitudes
                  </h3>

                  <p>
                    Cuando envíes una solicitud
                    desde el catálogo, aparecerá
                    aquí.
                  </p>

                  <button
                    className="btn btn-purple"
                    onClick={() =>
                      setActive('catalogo')
                    }
                  >
                    <i className="bi bi-basket3" />{' '}
                    Ir al catálogo
                  </button>
                </div>
              ) : (
                <div className="order-list">
                  {misSolicitudes.map(
                    solicitud => (
                      <article
                        className="order-card"
                        key={solicitud.id}
                      >
                        <div className="order-title">
                          <div>
                            <span className="order-id">
                              #{solicitud.id}
                            </span>

                            <h3>
                              Solicitud de pedido
                            </h3>
                          </div>

                          <span className="status">
                            {solicitud.estado ||
                              'Pendiente'}
                          </span>
                        </div>

                        <div className="order-details">
                          <span>
                            <i className="bi bi-calendar3" />{' '}
                            {solicitud.fecha
                              ? new Date(
                                  solicitud.fecha
                                ).toLocaleDateString(
                                  'es-CO'
                                )
                              : 'Fecha no disponible'}
                          </span>

                          <span>
                            <i className="bi bi-box-seam" />{' '}
                            {solicitud.cantidadTotal ||
                              0}{' '}
                            unidades
                          </span>

                          <span>
                            <i className="bi bi-geo-alt" />{' '}
                            {solicitud.direccion ||
                              'Dirección pendiente'}
                          </span>

                          <span>
                            <i className="bi bi-currency-dollar" />{' '}
                            $
                            {Number(
                              solicitud.total ||
                                0
                            ).toLocaleString(
                              'es-CO'
                            )}
                          </span>
                        </div>

                        {Array.isArray(
                          solicitud.items
                        ) && (
                          <div
                            style={{
                              marginTop: '16px',
                            }}
                          >
                            {solicitud.items.map(
                              item => (
                                <div
                                  key={
                                    item.productoId
                                  }
                                  style={{
                                    display:
                                      'flex',
                                    justifyContent:
                                      'space-between',
                                    padding:
                                      '8px 0',
                                  }}
                                >
                                  <span>
                                    {item.producto}{' '}
                                    ×{' '}
                                    {
                                      item.cantidad
                                    }
                                  </span>

                                  <strong>
                                    $
                                    {Number(
                                      item.subtotal ||
                                        0
                                    ).toLocaleString(
                                      'es-CO'
                                    )}
                                  </strong>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        <div
                          className="dashboard-actions"
                          style={{
                            marginTop: '16px',
                          }}
                        >
                          {String(
                            solicitud.estado ||
                              ''
                          ).toLowerCase() ===
                            'pendiente' && (
                            <span>
                              <i className="bi bi-hourglass-split" />{' '}
                              Pendiente de revisión
                              por administración
                            </span>
                          )}

                          {String(
                            solicitud.estado ||
                              ''
                          ).toLowerCase() ===
                            'aceptada' && (
                            <span>
                              <i className="bi bi-check-circle" />{' '}
                              Solicitud aceptada
                            </span>
                          )}

                          {String(
                            solicitud.estado ||
                              ''
                          ).toLowerCase() ===
                            'rechazada' && (
                            <span>
                              <i className="bi bi-x-circle" />{' '}
                              Solicitud rechazada
                            </span>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          )}

          {active === 'pedidos' && (
            <section className="dashboard-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">
                    HISTORIAL
                  </p>

                  <h2>
                    Mis pedidos
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
                    Todavía no tienes pedidos
                  </h3>

                  <p>
                    Los pedidos aparecerán aquí
                    cuando administración apruebe
                    una solicitud.
                  </p>

                  <button
                    className="btn btn-purple"
                    onClick={() =>
                      setActive('catalogo')
                    }
                  >
                    <i className="bi bi-basket3" />{' '}
                    Ir al catálogo
                  </button>
                </div>
              ) : (
                <div className="order-list">
                  {misPedidos.map(pedido => (
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
                            {pedido.producto ||
                              'Pedido'}
                          </h3>
                        </div>

                        <span className="status">
                          {pedido.estado ||
                            'Pendiente'}
                        </span>
                      </div>

                      <div className="order-details">
                        <span>
                          <i className="bi bi-calendar3" />{' '}
                          {pedido.fecha ||
                            'Fecha no disponible'}
                        </span>

                        <span>
                          <i className="bi bi-box" />{' '}
                          Cantidad:{' '}
                          {pedido.cantidad || 0}
                        </span>

                        <span>
                          <i className="bi bi-geo-alt" />{' '}
                          {pedido.direccion ||
                            'Dirección pendiente'}
                        </span>

                        <span>
                          <i className="bi bi-truck" />{' '}
                          Conductor:{' '}
                          {pedido.conductor ||
                            'Sin asignar'}
                        </span>

                        <span>
                          <i className="bi bi-map" />{' '}
                          Ruta:{' '}
                          {pedido.ruta ||
                            'Sin asignar'}
                        </span>
                      </div>

                      <div className="dashboard-actions">
                        <strong>
                          $
                          {Number(
                            pedido.total || 0
                          ).toLocaleString(
                            'es-CO'
                          )}
                        </strong>

                        <button
                          className="btn btn-outline"
                          onClick={() =>
                            setActive(
                              'seguimiento'
                            )
                          }
                        >
                          <i className="bi bi-truck" />{' '}
                          Ver seguimiento
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {active === 'facturas' && (
            <section className="dashboard-panel">
              <p className="eyebrow">
                FACTURACIÓN
              </p>

              <h2>
                Mis facturas
              </h2>

              {misPedidos.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-receipt" />

                  <h3>
                    No tienes facturas disponibles
                  </h3>

                  <p>
                    Las facturas asociadas a tus
                    pedidos aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="order-list">
                  {misPedidos.map(
                    (pedido, index) => (
                      <article
                        className="invoice-card"
                        key={pedido.id}
                      >
                        <div>
                          <span className="order-id">
                            FAC-
                            {String(
                              index + 1
                            ).padStart(3, '0')}
                          </span>

                          <h3>
                            Pedido #{pedido.id}
                          </h3>

                          <p>
                            {pedido.producto ||
                              'Pedido'}{' '}
                            ·{' '}
                            {pedido.fecha ||
                              'Fecha no disponible'}
                          </p>
                        </div>

                        <strong>
                          $
                          {Number(
                            pedido.total || 0
                          ).toLocaleString(
                            'es-CO'
                          )}
                        </strong>

                        <span className="status success">
                          Registrada
                        </span>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          )}

          {active === 'seguimiento' && (
            <section className="dashboard-panel">
              <p className="eyebrow">
                SEGUIMIENTO
              </p>

              <h2>
                Seguimiento de entrega
              </h2>

              {!pedidoEnSeguimiento ? (
                <div className="empty-state">
                  <i className="bi bi-truck" />

                  <h3>
                    No hay pedidos para seguir
                  </h3>

                  <p>
                    Cuando administración apruebe
                    una solicitud, podrás consultar
                    aquí el avance de tu pedido.
                  </p>
                </div>
              ) : (
                <>
                  <div className="order-card">
                    <div className="order-title">
                      <div>
                        <span className="order-id">
                          #{pedidoEnSeguimiento.id}
                        </span>

                        <h3>
                          {pedidoEnSeguimiento.producto ||
                            'Pedido'}
                        </h3>
                      </div>

                      <span className="status">
                        {pedidoEnSeguimiento.estado ||
                          'Pendiente'}
                      </span>
                    </div>

                    <div className="order-details">
                      <span>
                        <i className="bi bi-geo-alt" />{' '}
                        {pedidoEnSeguimiento.direccion ||
                          'Dirección pendiente'}
                      </span>

                      <span>
                        <i className="bi bi-map" />{' '}
                        Ruta:{' '}
                        {pedidoEnSeguimiento.ruta ||
                          'Sin asignar'}
                      </span>

                      <span>
                        <i className="bi bi-truck" />{' '}
                        Conductor:{' '}
                        {pedidoEnSeguimiento.conductor ||
                          'Sin asignar'}
                      </span>
                    </div>
                  </div>

                  <div className="tracking">
                    <div
                      className={`tracking-step ${
                        preparado
                          ? 'done'
                          : ''
                      }`}
                    >
                      <span>
                        {preparado
                          ? '✓'
                          : '1'}
                      </span>

                      <div>
                        <strong>
                          Pedido preparado
                        </strong>

                        <small>
                          El pedido está siendo
                          gestionado.
                        </small>
                      </div>
                    </div>

                    <div
                      className={`tracking-step ${
                        despachado
                          ? 'done'
                          : ''
                      }`}
                    >
                      <span>
                        {despachado
                          ? '✓'
                          : '2'}
                      </span>

                      <div>
                        <strong>
                          Despachado
                        </strong>

                        <small>
                          El pedido salió para
                          entrega.
                        </small>
                      </div>
                    </div>

                    <div
                      className={`tracking-step ${
                        enRuta
                          ? 'current'
                          : entregado
                            ? 'done'
                            : ''
                      }`}
                    >
                      <span>
                        {entregado
                          ? '✓'
                          : '3'}
                      </span>

                      <div>
                        <strong>
                          En ruta
                        </strong>

                        <small>
                          {enRuta
                            ? 'El conductor está realizando la entrega.'
                            : 'Se activará cuando el pedido salga a ruta.'}
                        </small>
                      </div>
                    </div>

                    <div
                      className={`tracking-step ${
                        entregado
                          ? 'done'
                          : ''
                      }`}
                    >
                      <span>
                        {entregado
                          ? '✓'
                          : '4'}
                      </span>

                      <div>
                        <strong>
                          Entregado
                        </strong>

                        <small>
                          {entregado
                            ? 'Entrega completada correctamente.'
                            : 'Pendiente de entrega.'}
                        </small>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {active === 'perfil' && (
            <section className="dashboard-panel">
              <p className="eyebrow">
                MI CUENTA
              </p>

              <h2>
                Mi perfil
              </h2>

              <div className="profile-card">
                <div className="employee-avatar">
                  <i className="bi bi-person" />
                </div>

                <h3>
                  {nombreUsuario}
                </h3>

                <p>
                  {correoUsuario ||
                    'Correo no disponible'}
                </p>

                <span className="status">
                  Cliente
                </span>
              </div>
            </section>
          )}
        </>
      )}
    </DashboardShell>
  )
}

export default ClienteDashboard