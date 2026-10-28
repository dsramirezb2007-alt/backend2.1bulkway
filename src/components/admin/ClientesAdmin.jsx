import { useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'
import Modal from '../shared/Modal'
import ConfirmModal from '../shared/ConfirmModal'

const clienteInicial = {
  nombre: '',
  empresa: '',
  documento: '',
  telefono: '',
  correo: '',
  direccion: '',
  ciudad: 'Bogotá',
  estado: 'Activo',
}

function ClientesAdmin() {
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [clientePorEliminar, setClientePorEliminar] = useState(null)
  const [formulario, setFormulario] = useState(clienteInicial)
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState('')

  const cargarDatos = async () => {
    try {
      setCargando(true)

      const [clientesData, pedidosData] = await Promise.all([
        apiRequest('/clientes', { api: 'express' }),
        apiRequest('/pedidos', { api: 'express' }),
      ])

      setClientes(clientesData || [])
      setPedidos(pedidosData || [])
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible cargar los clientes.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const abrirNuevo = () => {
    setClienteSeleccionado(null)
    setFormulario(clienteInicial)
    setMensaje('')
    setModalAbierto(true)
  }

  const abrirEditar = (cliente) => {
    setClienteSeleccionado(cliente)
    setFormulario({
      nombre: cliente.nombre || '',
      empresa: cliente.empresa || '',
      documento: cliente.documento || '',
      telefono: cliente.telefono || '',
      correo: cliente.correo || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || 'Bogotá',
      estado: cliente.estado || 'Activo',
    })
    setMensaje('')
    setModalAbierto(true)
  }

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }))
  }

  const guardarCliente = async (event) => {
    event.preventDefault()

    if (!formulario.nombre.trim()) {
      setMensaje('El nombre del cliente es obligatorio.')
      return
    }

    try {
      setMensaje('')

      if (clienteSeleccionado) {
        await apiRequest(`/clientes/${clienteSeleccionado.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formulario),
          api: 'express',
        })
      } else {
        const nuevoCliente = {
          id: `CLI-${Date.now()}`,
          ...formulario,
          fechaRegistro: new Date().toISOString().split('T')[0],
        }

        await apiRequest('/clientes', {
          method: 'POST',
          body: JSON.stringify(nuevoCliente),
          api: 'express',
        })
      }

      setModalAbierto(false)
      await cargarDatos()
    } catch (error) {
      console.error(error)
      setMensaje('No fue posible guardar el cliente.')
    }
  }

  const eliminarCliente = async (cliente) => {
    const tienePedidos = pedidos.some(
      (pedido) =>
        pedido.clienteId === cliente.id ||
        pedido.cliente === cliente.nombre
    )

    if (tienePedidos) {
      setMensaje(
        'No puedes eliminar este cliente porque tiene pedidos asociados.'
      )
      return
    }

    setMensaje('')
    setClientePorEliminar(cliente)
  }

  const confirmarEliminacionCliente = async () => {
    if (!clientePorEliminar) return

    try {
      await apiRequest(`/clientes/${clientePorEliminar.id}`, {
        method: 'DELETE',
        api: 'express',
      })

      setClientePorEliminar(null)
      setMensaje('')
      await cargarDatos()
    } catch (error) {
      console.error(error)
      setClientePorEliminar(null)
      setMensaje('No fue posible eliminar el cliente.')
    }
  }

  const pedidosCliente = (cliente) => {
    return pedidos.filter(
      (pedido) =>
        pedido.clienteId === cliente.id ||
        pedido.cliente === cliente.nombre
    )
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = `
      ${cliente.nombre || ''}
      ${cliente.empresa || ''}
      ${cliente.documento || ''}
      ${cliente.correo || ''}
    `.toLowerCase()

    return texto.includes(busqueda.toLowerCase())
  })

  if (cargando) {
    return (
      <section className="module-section">
        <div className="module-empty">
          Cargando clientes...
        </div>
      </section>
    )
  }

  return (
    <section className="module-section">
      <div className="module-header">
        <div>
          <p className="eyebrow">GESTIÓN COMERCIAL</p>
          <h2>Clientes</h2>
          <p>
            Administra las empresas y personas que realizan pedidos
            dentro de la operación.
          </p>
        </div>

        <button className="btn btn-purple" onClick={abrirNuevo}>
          <i className="bi bi-person-plus" />
          Nuevo cliente
        </button>
      </div>

      <div className="module-toolbar">
        <div className="search-box">
          <i className="bi bi-search" />
          <input
            type="search"
            placeholder="Buscar cliente, empresa o correo..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>

        <div className="module-counter">
          {clientes.length} clientes registrados
        </div>
      </div>

      {mensaje && (
        <div className="module-message">
          {mensaje}
        </div>
      )}

      {clientesFiltrados.length === 0 ? (
        <div className="module-empty">
          <i className="bi bi-people" />
          <h3>No hay clientes registrados</h3>
          <p>
            Crea el primer cliente para comenzar a relacionar
            pedidos con clientes reales.
          </p>
        </div>
      ) : (
        <div className="clients-grid">
          {clientesFiltrados.map((cliente) => {
            const cantidadPedidos = pedidosCliente(cliente).length

            return (
              <article className="client-card" key={cliente.id}>
                <div className="client-card-top">
                  <div className="client-avatar">
                    <i className="bi bi-building" />
                  </div>

                  <span
                    className={
                      cliente.estado === 'Activo'
                        ? 'status-badge success'
                        : 'status-badge'
                    }
                  >
                    {cliente.estado}
                  </span>
                </div>

                <div className="client-card-body">
                  <p className="eyebrow">
                    {cliente.documento || 'CLIENTE'}
                  </p>

                  <h3>{cliente.nombre}</h3>

                  {cliente.empresa && (
                    <p className="client-company">
                      <i className="bi bi-buildings" />
                      {cliente.empresa}
                    </p>
                  )}

                  <div className="client-data">
                    {cliente.telefono && (
                      <span>
                        <i className="bi bi-telephone" />
                        {cliente.telefono}
                      </span>
                    )}

                    {cliente.correo && (
                      <span>
                        <i className="bi bi-envelope" />
                        {cliente.correo}
                      </span>
                    )}

                    {cliente.ciudad && (
                      <span>
                        <i className="bi bi-geo-alt" />
                        {cliente.ciudad}
                      </span>
                    )}
                  </div>
                </div>

                <div className="client-card-footer">
                  <div>
                    <strong>{cantidadPedidos}</strong>
                    <small>pedidos</small>
                  </div>

                  <div className="client-actions">
                    <button
                      className="icon-button"
                      title="Editar cliente"
                      onClick={() => abrirEditar(cliente)}
                    >
                      <i className="bi bi-pencil" />
                    </button>

                    <button
                      className="icon-button danger"
                      title="Eliminar cliente"
                      onClick={() => eliminarCliente(cliente)}
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={modalAbierto}
        title={
          clienteSeleccionado
            ? 'Editar cliente'
            : 'Nuevo cliente'
        }
        onClose={() => setModalAbierto(false)}
      >
        <form className="modal-form" onSubmit={guardarCliente}>
          <div className="form-grid">
            <label>
              Nombre
              <input
                value={formulario.nombre}
                onChange={(event) =>
                  cambiarCampo('nombre', event.target.value)
                }
                placeholder="Nombre del cliente"
              />
            </label>

            <label>
              Empresa
              <input
                value={formulario.empresa}
                onChange={(event) =>
                  cambiarCampo('empresa', event.target.value)
                }
                placeholder="Empresa o negocio"
              />
            </label>

            <label>
              Documento / NIT
              <input
                value={formulario.documento}
                onChange={(event) =>
                  cambiarCampo('documento', event.target.value)
                }
                placeholder="Documento o NIT"
              />
            </label>

            <label>
              Teléfono
              <input
                value={formulario.telefono}
                onChange={(event) =>
                  cambiarCampo('telefono', event.target.value)
                }
                placeholder="300 000 0000"
              />
            </label>

            <label>
              Correo
              <input
                type="email"
                value={formulario.correo}
                onChange={(event) =>
                  cambiarCampo('correo', event.target.value)
                }
                placeholder="cliente@empresa.com"
              />
            </label>

            <label>
              Ciudad
              <input
                value={formulario.ciudad}
                onChange={(event) =>
                  cambiarCampo('ciudad', event.target.value)
                }
                placeholder="Bogotá"
              />
            </label>

            <label className="form-span-2">
              Dirección
              <input
                value={formulario.direccion}
                onChange={(event) =>
                  cambiarCampo('direccion', event.target.value)
                }
                placeholder="Dirección principal"
              />
            </label>

            <label>
              Estado
              <select
                value={formulario.estado}
                onChange={(event) =>
                  cambiarCampo('estado', event.target.value)
                }
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </label>
          </div>

          {mensaje && (
            <div className="auth-message error">
              {mensaje}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </button>

            <button type="submit" className="btn btn-purple">
              <i className="bi bi-check2" />
              {clienteSeleccionado
                ? 'Guardar cambios'
                : 'Crear cliente'}
            </button>
          </div>
        </form>
        </Modal>

      <ConfirmModal
        open={Boolean(clientePorEliminar)}
        title="Eliminar cliente"
        message={
          clientePorEliminar
            ? `¿Estás seguro de que deseas eliminar a ${clientePorEliminar.nombre}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Sí, eliminar cliente"
        cancelText="Cancelar"
        onConfirm={confirmarEliminacionCliente}
        onClose={() => setClientePorEliminar(null)}
        danger
      />
    </section>
  )
}

export default ClientesAdmin