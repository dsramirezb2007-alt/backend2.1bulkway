const servicios = [
  [
    'bi-people',
    'Gestión de clientes',
    'Centraliza la información de los clientes y mantén organizada la relación comercial de tu empresa.',
  ],
  [
    'bi-box-seam',
    'Gestión de pedidos',
    'Crea, consulta y administra pedidos desde un mismo espacio de trabajo.',
  ],
  [
    'bi-truck',
    'Rutas y distribución',
    'Organiza recorridos, asigna responsables y realiza seguimiento de las entregas.',
  ],
  [
    'bi-boxes',
    'Inventario y recursos',
    'Controla existencias, movimientos y recursos para mantener la operación actualizada.',
  ],
]

function Servicios() {
  return (
    <section id="servicios" className="section-pad service-section">
      <div className="container">
        <div className="section-heading text-center">
          <p className="eyebrow">FUNCIONES DE BULKWAY</p>

          <h2>
            Todo lo que necesitas para gestionar tu operación.
          </h2>

          <p className="body-copy">
            Una plataforma que conecta las principales áreas de trabajo
            de tu empresa para que la información esté organizada y
            disponible cuando la necesites.
          </p>
        </div>

        <div className="row g-4 mt-3">
          {servicios.map(([icon, title, text]) => (
            <div
              className="col-md-6 col-lg-3"
              key={title}
            >
              <article className="service-card">
                <div className="service-icon">
                  <i className={`bi ${icon}`} />
                </div>

                <h3>{title}</h3>

                <p>{text}</p>

                <span className="service-arrow">
                  <i className="bi bi-arrow-up-right" />
                </span>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Servicios