import { useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'
import Modal from '../shared/Modal'
import ConfirmModal from '../shared/ConfirmModal'

function ProductosAdmin() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [open, setOpen] = useState(false)
  const [productoPorEliminar, setProductoPorEliminar] = useState(null)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    nombre: '',
    categoria: '',
    presentacion: '',
    stock: '',
    precio: '',
  })

  const cargarProductos = async () => {
    try {
      setCargando(true)
      setMensaje('')

      const data = await apiRequest('/productos', {
        api: 'express',
      })
      setProductos(data)
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible cargar los productos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const abrirNuevo = () => {
    setEditing(null)

    setForm({
      nombre: '',
      categoria: '',
      presentacion: '',
      stock: '',
      precio: '',
    })

    setOpen(true)
  }

  const abrirEditar = (producto) => {
    setEditing(producto.id)

    setForm({
      nombre: producto.nombre || '',
      categoria: producto.categoria || '',
      presentacion: producto.presentacion || '',
      stock: producto.stock ?? '',
      precio: producto.precio ?? '',
    })

    setOpen(true)
  }

  const cerrarModal = () => {
    setOpen(false)
    setEditing(null)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setMensaje('')

    const producto = {
      nombre: form.nombre.trim(),
      categoria: form.categoria.trim(),
      presentacion: form.presentacion.trim(),
      stock: Number(form.stock),
      precio: Number(form.precio),
    }

    if (!producto.nombre) {
      setMensaje('Escribe el nombre del producto.')
      return
    }

    if (producto.stock < 0 || producto.precio < 0) {
      setMensaje('El stock y el precio no pueden ser negativos.')
      return
    }

    try {
      if (editing) {
        await apiRequest(`/productos/${editing}`, {
          method: 'PATCH',
          body: JSON.stringify(producto),
          api: 'express',
        })
      } else {
        await apiRequest('/productos', {
          method: 'POST',
          body: JSON.stringify(producto),
          api: 'express',
        })
      }

      await cargarProductos()
      cerrarModal()
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible guardar el producto.')
    }
  }

  const eliminar = (producto) => {
  setMensaje('')
  setProductoPorEliminar(producto)
}

const confirmarEliminacionProducto = async () => {
  if (!productoPorEliminar) return

  try {
    setMensaje('')

    await apiRequest(`/productos/${productoPorEliminar.id}`, {
      method: 'DELETE',
      api: 'express',
    })

    setProductoPorEliminar(null)
    await cargarProductos()
    setMensaje('Producto eliminado correctamente.')
  } catch (error) {
    console.error(error)
    setProductoPorEliminar(null)
    setMensaje('No fue posible eliminar el producto.')
  }
}

  return (
    <>
      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">GESTIÓN COMERCIAL</p>
            <h2>Productos</h2>
          </div>

          <button
            className="btn btn-purple"
            onClick={abrirNuevo}
          >
            <i className="bi bi-plus-lg" />
            Agregar producto
          </button>
        </div>

        {mensaje && (
          <div className="auth-message error">
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="auth-loading">
            Cargando productos...
          </div>
        ) : productos.length === 0 ? (
          <div className="dashboard-empty">
            <i className="bi bi-box-seam" />
            <h3>No hay productos registrados</h3>
            <p>Agrega el primer producto para comenzar a gestionar tu catálogo.</p>

            <button
              className="btn btn-purple"
              onClick={abrirNuevo}
            >
              <i className="bi bi-plus-lg" />
              Crear producto
            </button>
          </div>
        ) : (
          <div className="product-admin-grid">
            {productos.map((producto) => (
              <article
                className="admin-product-card"
                key={producto.id}
              >
                <div className="product-icon">
                  <i className="bi bi-box-seam" />
                </div>

                <div className="product-card-content">
                  <span className="status success">
                    Producto activo
                  </span>

                  <h3>{producto.nombre}</h3>

                  {producto.categoria && (
                    <p>
                      <i className="bi bi-tag" />{' '}
                      {producto.categoria}
                    </p>
                  )}

                  {producto.presentacion && (
                    <p>
                      <i className="bi bi-box" />{' '}
                      {producto.presentacion}
                    </p>
                  )}

                  <p>
                    <i className="bi bi-box-seam" /> Stock:{' '}
                    <strong>{producto.stock}</strong>
                  </p>

                  <p>
                    <i className="bi bi-currency-dollar" /> Precio:{' '}
                    <strong>
                      ${Number(producto.precio || 0).toLocaleString('es-CO')}
                    </strong>
                  </p>
                </div>

                <div className="product-card-actions">
                  <button
                    type="button"
                    className="btn btn-outline-purple"
                    onClick={() => abrirEditar(producto)}
                    title="Editar producto"
                  >
                    <i className="bi bi-pencil-square" />
                    Editar
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => eliminar(producto)}
                    title="Eliminar producto"
                  >
                    <i className="bi bi-trash3" />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={open}
        title={editing ? 'Modificar producto' : 'Nuevo producto'}
        onClose={cerrarModal}
      >
        <form
          className="modal-form"
          onSubmit={guardar}
        >
          <label>Nombre del producto</label>

          <input
            value={form.nombre}
            onChange={(e) =>
              setForm({
                ...form,
                nombre: e.target.value,
              })
            }
            placeholder="Ej. Detergente líquido"
            required
          />

          <label>Categoría</label>

          <input
            value={form.categoria}
            onChange={(e) =>
              setForm({
                ...form,
                categoria: e.target.value,
              })
            }
            placeholder="Ej. Limpieza"
            required
          />

          <label>Presentación</label>

          <input
            value={form.presentacion}
            onChange={(e) =>
              setForm({
                ...form,
                presentacion: e.target.value,
              })
            }
            placeholder="Ej. 1 L"
            required
          />

          <label>Stock inicial</label>

          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) =>
              setForm({
                ...form,
                stock: e.target.value,
              })
            }
            placeholder="0"
            required
          />

          <label>Precio</label>

          <input
            type="number"
            min="0"
            value={form.precio}
            onChange={(e) =>
              setForm({
                ...form,
                precio: e.target.value,
              })
            }
            placeholder="0"
            required
          />

          <button
            type="submit"
            className="btn btn-purple btn-full"
          >
            <i className="bi bi-check2-circle" />
            {editing ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </form>
        </Modal>

      <ConfirmModal
        open={Boolean(productoPorEliminar)}
        title="Eliminar producto"
        message={
          productoPorEliminar
            ? `¿Estás seguro de que deseas eliminar el producto "${productoPorEliminar.nombre}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Sí, eliminar producto"
        cancelText="Cancelar"
        onConfirm={confirmarEliminacionProducto}
        onClose={() => setProductoPorEliminar(null)}
        danger
      />
    </>
  )
}

export default ProductosAdmin