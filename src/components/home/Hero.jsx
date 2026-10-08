function Hero() {
  return (
    <header id="inicio" className="new-hero">
      <div className="container">
        <div className="hero-grid-new">

          <div className="hero-copy-new">

            <div className="hero-kicker">
              <span>01</span>
              <span>GESTIÓN · LOGÍSTICA · OPERACIÓN</span>
            </div>

            <h1>
              La operación de tu empresa.
              <br />
              <em>Más conectada. Más clara.</em>
            </h1>

            <p>
              BulkWay es una plataforma para gestionar y optimizar la operación
              logística de tu empresa: clientes, productos, pedidos, inventario,
              conductores, rutas, entregas y facturación desde un mismo lugar.
            </p>

            <div className="hero-actions">

              <a
                href="/login"
                className="btn btn-purple"
              >
                Entrar a BulkWay
              </a>

              <a
                href="#catalogo"
                className="hero-text-link"
              >
                Ver catálogo
                <i className="bi bi-arrow-down-right"></i>
              </a>

            </div>

          </div>

          <div className="hero-art-wrap">

            <div className="hero-art">
              <div className="hero-dashboard-preview">

                <div className="preview-top">
                  <div>
                    <span className="preview-label">
                      CENTRO DE OPERACIONES
                    </span>

                    <strong>BulkWay</strong>
                  </div>

                  <span className="preview-status">
                    <i className="bi bi-circle-fill"></i>
                    Operación activa
                  </span>
                </div>

                <div className="preview-stats">

                  <div>
                    <i className="bi bi-box-seam"></i>

                    <span>Pedidos</span>

                    <strong>128</strong>
                  </div>

                  <div>
                    <i className="bi bi-truck"></i>

                    <span>En ruta</span>

                    <strong>24</strong>
                  </div>

                  <div>
                    <i className="bi bi-boxes"></i>

                    <span>Inventario</span>

                    <strong>86%</strong>
                  </div>

                </div>

                <div className="preview-route">

                  <div className="route-line">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <div className="route-info">
                    <div>
                      <small>RUTA EN OPERACIÓN</small>

                      <strong>Distribución urbana</strong>
                    </div>

                    <i className="bi bi-arrow-up-right"></i>
                  </div>

                </div>

                <div className="preview-orders">

                  <div>
                    <span className="preview-dot"></span>

                    <div>
                      <strong>Pedido #BW-2048</strong>

                      <small>
                        En ruta · Bogotá
                      </small>
                    </div>
                  </div>

                  <div>
                    <span className="preview-dot"></span>

                    <div>
                      <strong>Pedido #BW-2049</strong>

                      <small>
                        Preparando despacho
                      </small>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            <div className="floating-note note-one">

              <strong>
                <i className="bi bi-diagram-3"></i>
                Operación conectada
              </strong>

              <span>
                Todos tus procesos en un solo lugar
              </span>

            </div>

            <div className="floating-note note-two">

              <strong>
                <i className="bi bi-geo-alt"></i>
                Rutas y entregas
              </strong>

              <span>
                Seguimiento de la distribución
              </span>

            </div>

          </div>

        </div>
      </div>

      <div className="hero-bottom">

        <div>
          CLIENTES · PRODUCTOS
        </div>

        <div>
          PEDIDOS · INVENTARIO · FACTURACIÓN
        </div>

        <div>
          RUTAS · CONDUCTORES · ENTREGAS
        </div>

      </div>

    </header>
  )
}

export default Hero