import { useEffect, useState } from 'react'

import DashboardShell from '../shared/DashboardShell'
import StatCard from '../shared/StatCard'

import PedidosAdmin from './PedidosAdmin'
import ClientesAdmin from './ClientesAdmin'
import ProductosAdmin from './ProductosAdmin'
import FacturacionAdmin from './FacturacionAdmin'
import EmpleadosAdmin from './EmpleadosAdmin'
import RutasAdmin from './RutasAdmin'
import InventarioAdmin from './InventarioAdmin'
import SolicitudesAdmin from './SolicitudesAdmin'

import { apiRequest } from '../../services/api'

const menu = [
  { id: 'inicio', label: 'Resumen', icon: 'bi-grid-1x2' },
  { id: 'pedidos', label: 'Pedidos', icon: 'bi-box-seam' },
  { id: 'solicitudes', label: 'Solicitudes', icon: 'bi-clipboard-check' },
  { id: 'clientes', label: 'Clientes', icon: 'bi-people' },
  { id: 'productos', label: 'Productos', icon: 'bi-basket3' },
  { id: 'inventario', label: 'Inventario', icon: 'bi-boxes' },
  { id: 'rutas', label: 'Rutas', icon: 'bi-map' },
  { id: 'empleados', label: 'Conductores', icon: 'bi-people' },
  { id: 'facturacion', label: 'Facturación', icon: 'bi-receipt' },
]

function AdminDashboard() {
  const [active, setActive] = useState('inicio')

  const [resumen, setResumen] = useState({
    pedidos: 0,
    productos: 0,
    conductores: 0,
    rutas: 0,
    inventario: 0,
  })

  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarResumen()
  }, [])

  async function cargarResumen() {
    try {
      setCargando(true)

      const [
        pedidos,
        productos,
        conductores,
        rutas,
        inventario,
      ] = await Promise.all([
        apiRequest('/pedidos', { api: 'express' }),
        apiRequest('/productos', { api: 'express' }),
        apiRequest('/conductores', { api: 'express' }),
        apiRequest('/rutas', { api: 'express' }),
        apiRequest('/inventario', { api: 'express' }),
      ])

      setResumen({
        pedidos: pedidos.length,
        productos: productos.length,
        conductores: conductores.length,
        rutas: rutas.length,
        inventario: inventario.length,
      })
    } catch (error) {
      console.error('Error cargando resumen:', error)
    } finally {
      setCargando(false)
    }
  }

  const content = {
    inicio: (
      <>
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">01 · RESUMEN</p>

            <h2>
              Controla toda tu operación desde un solo lugar.
            </h2>

            <p>
              Consulta el estado general de pedidos, productos,
              inventario, conductores y rutas de tu empresa.
            </p>
          </div>

          <button
            className="dashboard-refresh"
            onClick={cargarResumen}
            type="button"
          >
            <i className="bi bi-arrow-clockwise" />
            Actualizar
          </button>
        </div>

        <div className="stats-grid">
          <StatCard
            icon="bi-box-seam"
            label="Pedidos"
            value={cargando ? '—' : resumen.pedidos}
            hint="Pedidos registrados"
          />

          <StatCard
            icon="bi-basket3"
            label="Productos"
            value={cargando ? '—' : resumen.productos}
            hint="Referencias registradas"
          />

          <StatCard
            icon="bi-truck"
            label="Conductores"
            value={cargando ? '—' : resumen.conductores}
            hint="Conductores registrados"
          />

          <StatCard
            icon="bi-map"
            label="Rutas"
            value={cargando ? '—' : resumen.rutas}
            hint="Rutas creadas"
          />
        </div>

        <section className="dashboard-panel admin-overview-panel">
          <div className="admin-overview-header">
            <div>
              <p className="eyebrow">
                CENTRO DE OPERACIONES
              </p>

              <h2>Todo conectado.</h2>

              <p>
                BulkWay reúne la información principal de tu
                operación para que puedas consultar y administrar
                cada proceso desde este panel.
              </p>
            </div>

            <div className="admin-overview-icon">
              <i className="bi bi-diagram-3" />
            </div>
          </div>

          <div className="admin-module-grid">
            <button
              type="button"
              onClick={() => setActive('pedidos')}
              className="admin-module-card"
            >
              <span className="admin-module-icon">
                <i className="bi bi-box-seam" />
              </span>

              <span>
                <strong>Pedidos</strong>
                <small>Crear y consultar pedidos</small>
              </span>

              <i className="bi bi-arrow-up-right" />
            </button>

            <button
              type="button"
              onClick={() => setActive('clientes')}
              className="admin-module-card"
            >
              <span className="admin-module-icon">
                <i className="bi bi-people" />
              </span>

              <span>
                <strong>Clientes</strong>
                <small>Gestionar clientes y empresas</small>
              </span>

              <i className="bi bi-arrow-up-right" />
            </button>

            <button
              type="button"
              onClick={() => setActive('productos')}
              className="admin-module-card"
            >
              <span className="admin-module-icon">
                <i className="bi bi-basket3" />
              </span>

              <span>
                <strong>Productos</strong>
                <small>Gestionar catálogo</small>
              </span>

              <i className="bi bi-arrow-up-right" />
            </button>

            <button
              type="button"
              onClick={() => setActive('inventario')}
              className="admin-module-card"
            >
              <span className="admin-module-icon">
                <i className="bi bi-boxes" />
              </span>

              <span>
                <strong>Inventario</strong>
                <small>Controlar existencias</small>
              </span>

              <i className="bi bi-arrow-up-right" />
            </button>

            <button
              type="button"
              onClick={() => setActive('rutas')}
              className="admin-module-card"
            >
              <span className="admin-module-icon">
                <i className="bi bi-map" />
              </span>

              <span>
                <strong>Rutas</strong>
                <small>Organizar distribución</small>
              </span>

              <i className="bi bi-arrow-up-right" />
            </button>

            <button
              type="button"
              onClick={() => setActive('empleados')}
              className="admin-module-card"
            >
              <span className="admin-module-icon">
                <i className="bi bi-people" />
              </span>

              <span>
                <strong>Conductores</strong>
                <small>Gestionar conductores</small>
              </span>

              <i className="bi bi-arrow-up-right" />
            </button>

            <button
              type="button"
              onClick={() => setActive('facturacion')}
              className="admin-module-card"
            >
              <span className="admin-module-icon">
                <i className="bi bi-receipt" />
              </span>

              <span>
                <strong>Facturación</strong>
                <small>Consultar facturación</small>
              </span>

              <i className="bi bi-arrow-up-right" />
            </button>
          </div>
        </section>

        <section className="dashboard-panel admin-status-panel">
          <div>
            <p className="eyebrow">
              ESTADO DE LA OPERACIÓN
            </p>

            <h3>Recursos registrados</h3>
          </div>

          <div className="admin-status-item">
            <div>
              <i className="bi bi-boxes" />
              <span>Movimientos de inventario</span>
            </div>

            <strong>
              {cargando ? '—' : resumen.inventario}
            </strong>
          </div>

          <div className="admin-status-item">
            <div>
              <i className="bi bi-truck" />
              <span>Conductores disponibles</span>
            </div>

            <strong>
              {cargando ? '—' : resumen.conductores}
            </strong>
          </div>

          <div className="admin-status-item">
            <div>
              <i className="bi bi-map" />
              <span>Rutas registradas</span>
            </div>

            <strong>
              {cargando ? '—' : resumen.rutas}
            </strong>
          </div>
        </section>
      </>
    ),

    pedidos: <PedidosAdmin />,
    solicitudes: <SolicitudesAdmin />,
    clientes: <ClientesAdmin />,
    productos: <ProductosAdmin />,
    inventario: <InventarioAdmin />,
    rutas: <RutasAdmin />,
    empleados: <EmpleadosAdmin />,
    facturacion: <FacturacionAdmin />,
  }

  return (
    <DashboardShell
      role="administrador"
      menu={menu}
      active={active}
      setActive={setActive}
      title="Centro de operaciones"
    >
      {content[active]}
    </DashboardShell>
  )
}

export default AdminDashboard