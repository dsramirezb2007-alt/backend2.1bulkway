function Footer() {
  return (
    <footer className="bulk-footer">
      <div className="container py-5">
        <div className="row g-4">

          <div className="col-md-5">
            <div className="bulk-brand footer-brand">
              <span>BULK</span>
              <b>WAY</b>
            </div>

            <p>
              Plataforma para gestionar y optimizar la operación
              empresarial desde un solo lugar.
            </p>
          </div>

          <div className="col-md-3">
            <h6>CONTACTO</h6>

            <p>
              contacto@bulkway.com
              <br />
              +57 300 000 0000
            </p>
          </div>

          <div className="col-md-4">
            <h6>PLATAFORMA</h6>

            <p>
              Gestión de clientes, productos, pedidos e inventario.
              <br />
              Rutas, distribución y seguimiento de operaciones.
            </p>
          </div>

        </div>

        <hr />

        <small>
          © 2026 BulkWay · Plataforma de gestión empresarial y logística
        </small>
      </div>
    </footer>
  )
}

export default Footer