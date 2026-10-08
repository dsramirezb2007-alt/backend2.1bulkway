import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../services/api'
import Navbar from '../layout/Navbar'
import Hero from './Hero'
import Servicios from './Servicios'
import ProductoCard from './ProductoCard'
import Footer from '../layout/Footer'

function Inicio() {
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [errorProductos, setErrorProductos] = useState('')

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargandoProductos(true)
        setErrorProductos('')

        const data = await apiRequest('/productos')

        setProductos(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error(error)
        setErrorProductos(
          'No fue posible cargar el catálogo en este momento.'
        )
      } finally {
        setCargandoProductos(false)
      }
    }

    cargarProductos()
  }, [])

  const irALogin = () => {
    navigate('/login')
  }

  return (
    <>
      <Navbar />

      <Hero />

      <section id="catalogo" className="public-catalog-section">
        <div className="container">
          <div className="public-catalog-header">
            <div>
              <p className="eyebrow">CATÁLOGO</p>

              <h2>Conoce nuestros productos</h2>

              <p className="body-copy">
                Consulta los productos disponibles, sus presentaciones,
                precios y disponibilidad.
              </p>
            </div>

            <div className="public-catalog-badge">
              <i className="bi bi-box-seam" />

              <span>
                {productos.length}{' '}
                {productos.length === 1
                  ? 'producto disponible'
                  : 'productos disponibles'}
              </span>
            </div>
          </div>

          {cargandoProductos ? (
            <div className="public-catalog-loading">
              <i className="bi bi-arrow-repeat" />

              <p>Cargando catálogo...</p>
            </div>
          ) : errorProductos ? (
            <div className="public-catalog-empty">
              <i className="bi bi-exclamation-circle" />

              <h3>No fue posible cargar el catálogo</h3>

              <p>{errorProductos}</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="public-catalog-empty">
              <i className="bi bi-box-seam" />

              <h3>Catálogo próximamente</h3>

              <p>
                Actualmente no hay productos disponibles.
              </p>
            </div>
          ) : (
            <div className="public-product-grid">
              {productos.map((producto) => (
                <div
                  className="public-product-item"
                  key={producto.id}
                >
                  <ProductoCard
                    nombre={producto.nombre}
                    precio={producto.precio}
                    stock={producto.stock}
                    icono="bi-box-seam"
                    categoria={producto.categoria}
                    presentacion={producto.presentacion}
                  />

                  <button
                    type="button"
                    className="btn btn-purple public-product-button"
                    onClick={irALogin}
                  >
                    <i className="bi bi-cart-plus" />
                    Agregar al carrito
                  </button>
                </div>
              ))}
            </div>
          )}

          {!cargandoProductos &&
            !errorProductos &&
            productos.length > 0 && (
              <div className="public-catalog-footer">
                <div className="public-catalog-footer-info">
                  <i className="bi bi-person-check" />

                  <div>
                    <strong>
                      ¿Quieres realizar un pedido?
                    </strong>

                    <span>
                      Inicia sesión para agregar productos a tu carrito.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-purple"
                  onClick={irALogin}
                >
                  Iniciar sesión

                  <i className="bi bi-arrow-right" />
                </button>
              </div>
            )}
        </div>
      </section>

      <section id="empresa" className="intro-strip platform-intro">
        <div className="container">
          <div className="platform-intro-top">
            <div className="section-marker">
              <span className="section-marker-number">02</span>

              <div className="section-marker-label">
                <span className="section-marker-line"></span>

                <p>PLATAFORMA EMPRESARIAL</p>
              </div>
            </div>
          </div>

          <div className="platform-intro-main">
            <div className="platform-intro-title">
              <h2>
                Una sola plataforma para
                <em> controlar toda la operación.</em>
              </h2>
            </div>

            <div className="platform-intro-description">
              <p>
                BulkWay conecta las áreas que intervienen en el funcionamiento
                diario de una empresa, centralizando información, procesos y
                equipos en un mismo espacio.
              </p>

              <div className="platform-intro-link">
                <span>GESTIÓN CONECTADA</span>

                <i className="bi bi-arrow-down-right"></i>
              </div>
            </div>
          </div>

          <div className="platform-intro-services">
            <div className="intro-service-item">
              <i className="bi bi-people"></i>

              <span>Clientes</span>
            </div>

            <div className="intro-service-item">
              <i className="bi bi-receipt"></i>

              <span>Pedidos</span>
            </div>

            <div className="intro-service-item">
              <i className="bi bi-boxes"></i>

              <span>Inventario</span>
            </div>

            <div className="intro-service-item">
              <i className="bi bi-truck"></i>

              <span>Distribución</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad company-section modern-company">
        <div className="container">
          <div className="platform-overview">
            <div className="platform-copy">
              <p className="eyebrow">
                03 · GESTIÓN CENTRALIZADA
              </p>

              <h2>
                Toda la información de tu operación en un mismo espacio.
              </h2>

              <p className="body-copy">
                BulkWay conecta las diferentes áreas de trabajo de tu empresa
                para que puedas consultar, organizar y controlar la información
                que necesitas desde una misma plataforma.
              </p>

              <div className="platform-highlight">
                <i className="bi bi-stars"></i>

                <div>
                  <strong>Una operación conectada</strong>

                  <span>
                    Información organizada para tomar el control de cada proceso.
                  </span>
                </div>
              </div>
            </div>

            <div className="platform-visual">
              <div className="connection-board">
                <div className="connection-line line-top"></div>

                <div className="connection-line line-left"></div>

                <div className="connection-line line-right"></div>

                <div className="connection-line line-bottom"></div>

                <div className="connection-center">
                  <div className="connection-logo">
                    BW
                  </div>

                  <strong>BulkWay</strong>

                  <span>PLATAFORMA</span>
                </div>

                <div className="connection-node connection-top">
                  <i className="bi bi-people"></i>

                  <div>
                    <strong>Clientes</strong>

                    <span>Información</span>
                  </div>
                </div>

                <div className="connection-node connection-left">
                  <i className="bi bi-receipt"></i>

                  <div>
                    <strong>Pedidos</strong>

                    <span>Seguimiento</span>
                  </div>
                </div>

                <div className="connection-node connection-right">
                  <i className="bi bi-boxes"></i>

                  <div>
                    <strong>Inventario</strong>

                    <span>Control</span>
                  </div>
                </div>

                <div className="connection-node connection-bottom">
                  <i className="bi bi-truck"></i>

                  <div>
                    <strong>Distribución</strong>

                    <span>Rutas y entregas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Servicios />

      <section
        id="operacion"
        className="section-pad logistics-showcase modern-logistics"
      >
        <div className="container">
          <div className="logistics-grid">
            <div className="logistics-copy">
              <p className="eyebrow">
                04 · OPERACIÓN
              </p>

              <h2>
                Conecta personas, procesos y recursos.
              </h2>

              <p className="body-copy">
                Desde la creación de un pedido hasta su entrega, BulkWay
                permite mantener conectada la información que interviene
                en la operación diaria de tu empresa.
              </p>

              <div className="process-line">
                <span>Cliente</span>

                <i className="bi bi-arrow-right"></i>

                <span>Pedido</span>

                <i className="bi bi-arrow-right"></i>

                <span>Inventario</span>

                <i className="bi bi-arrow-right"></i>

                <span>Ruta</span>

                <i className="bi bi-arrow-right"></i>

                <span>Entrega</span>
              </div>
            </div>

            <div className="logistics-visual">
              <div className="network-visual">
                <div className="network-center">
                  <span>BW</span>

                  <strong>BulkWay</strong>

                  <small>GESTIÓN EMPRESARIAL</small>
                </div>

                <div className="network-node node-top">
                  <i className="bi bi-people"></i>

                  <span>Clientes</span>
                </div>

                <div className="network-node node-left">
                  <i className="bi bi-box-seam"></i>

                  <span>Pedidos</span>
                </div>

                <div className="network-node node-right">
                  <i className="bi bi-truck"></i>

                  <span>Rutas</span>
                </div>

                <div className="network-node node-bottom">
                  <i className="bi bi-check2-circle"></i>

                  <span>Entregas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad universal-section">
        <div className="container">
          <div className="universal-heading">
            <p className="eyebrow">
              05 · ADAPTABLE
            </p>

            <h2>
              Diseñado para diferentes tipos de empresas.
            </h2>

            <p className="body-copy">
              BulkWay no está limitado a un producto, industria o tipo de
              mercancía. La plataforma está pensada para adaptarse a la
              operación que cada empresa necesita gestionar.
            </p>
          </div>

          <div className="universal-grid">
            <div className="universal-card">
              <i className="bi bi-shop"></i>

              <h3>Comercio</h3>

              <p>
                Gestiona pedidos, clientes e inventario.
              </p>
            </div>

            <div className="universal-card">
              <i className="bi bi-building"></i>

              <h3>Empresas</h3>

              <p>
                Centraliza procesos y recursos operativos.
              </p>
            </div>

            <div className="universal-card">
              <i className="bi bi-box-seam"></i>

              <h3>Distribución</h3>

              <p>
                Organiza mercancías, rutas y entregas.
              </p>
            </div>

            <div className="universal-card">
              <i className="bi bi-diagram-3"></i>

              <h3>Operaciones</h3>

              <p>
                Conecta información y equipos de trabajo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bulk-cta modern-cta">
        <div className="container">
          <div className="cta-inner">
            <div>
              <p className="eyebrow-light">
                06 · BULKWAY
              </p>

              <h2>
                Una plataforma para entender y gestionar tu operación.
              </h2>

              <p>
                Centraliza tus procesos y dale a tu empresa un espacio
                único para administrar su operación.
              </p>
            </div>

            <a
              className="btn btn-purple"
              href="/login"
            >
              Entrar a BulkWay
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

export default Inicio