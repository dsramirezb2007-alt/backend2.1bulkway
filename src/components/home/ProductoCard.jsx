function ProductoCard({ nombre, precio, stock, icono, categoria, presentacion }) {
  
  return <article className="product-card">
            <div className="product-icon">
              <i className={`bi ${icono}`} />
            </div>

            <div><p className="eyebrow">{categoria || 'PRODUCTO'}
              </p><h3>{nombre}
                </h3><p>{presentacion} · 
                  Precio unitario: 

              <strong>${Number(precio).toLocaleString('es-CO')}</strong>

                </p><span className="stock-badge">
                  Stock disponible: {stock}
                </span>
            </div>
          </article>
}
export default ProductoCard
