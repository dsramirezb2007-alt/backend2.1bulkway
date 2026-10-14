import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { fileURLToPath } from 'url'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const app = express()


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BulkWay API REST',
      version: '1.0.0',
      description:
        'Documentación de la API REST de BulkWay para operaciones, productos, pedidos, clientes, conductores, rutas e inventario.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token de acceso de Supabase',
        },
      },
    },
  },
  apis: [fileURLToPath(import.meta.url)],
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)


const supabaseAuth = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

if (
  !process.env.VITE_SUPABASE_URL ||
  !process.env.VITE_SUPABASE_PUBLISHABLE_KEY
) {
  throw new Error(
    'Faltan las variables de entorno de Supabase en el archivo .env'
  )
}

const PORT = 3000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'db.json')

const leerDB = () => {
  const contenido = fs.readFileSync(dbPath, 'utf-8')
  return JSON.parse(contenido)
}

const guardarDB = db => {
  fs.writeFileSync(
    dbPath,
    JSON.stringify(db, null, 2),
    'utf-8'
  )
}

app.use(cors())
app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const verificarToken = async (req, res, next) => {
  try {
    const encabezado = req.headers.authorization

    if (!encabezado || !encabezado.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Se requiere un token de acceso'
      })
    }

    const token = encabezado.slice(7).trim()

    if (!token) {
      return res.status(401).json({
        error: 'El token de acceso está vacío'
      })
    }

    const { data, error } = await supabaseAuth.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({
        error: 'El token es inválido o ha expirado'
      })
    }

    req.usuario = data.user

    next()
  } catch (error) {
    console.error('Error verificando el token:', error)

    return res.status(500).json({
      error: 'No fue posible verificar la autenticación'
    })
  }
}


const verificarRol = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      const encabezado = req.headers.authorization
      const token = encabezado.slice(7).trim()

      const supabaseUsuario = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const { data: perfil, error } = await supabaseUsuario
        .from('perfiles')
        .select('role')
        .eq('id', req.usuario.id)
        .maybeSingle()

      if (error) {
        console.error('Error consultando el rol:', error.message)

        return res.status(500).json({
          error: 'No fue posible verificar los permisos del usuario',
        })
      }

      if (!perfil?.role) {
        return res.status(403).json({
          error: 'El usuario no tiene un rol asignado',
        })
      }

      const rolUsuario = perfil.role.trim().toLowerCase()

      if (!rolesPermitidos.includes(rolUsuario)) {
        return res.status(403).json({
          error: 'No tienes permisos para realizar esta operación',
        })
      }

      req.usuario.rol = rolUsuario

      next()
    } catch (error) {
      console.error('Error verificando el rol:', error.message)

      return res.status(500).json({
        error: 'No fue posible verificar los permisos del usuario',
      })
    }
  }
}

/**
 * @openapi
 * /api/privado:
 *   get:
 *     summary: Verificar la autenticación del usuario
 *     description: Comprueba que el token de acceso de Supabase sea válido y devuelve los datos básicos del usuario autenticado.
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Autenticación correcta.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Autenticación correcta
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *       '401':
 *         description: Token ausente o inválido.
 *       '500':
 *         description: Error interno al verificar la autenticación.
 */

app.get('/api/privado', verificarToken, (req, res) => {
  res.status(200).json({
    mensaje: 'Autenticación correcta',
    usuario: {
      id: req.usuario.id,
      email: req.usuario.email
    }
  })
})

/**
 * @openapi
 * /api/privado/administrador:
 *   get:
 *     summary: Verificar el acceso de administrador
 *     description: Comprueba el token de autenticación y verifica que el usuario tenga el rol de administrador.
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Acceso de administrador autorizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Acceso de administrador autorizado
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     rol:
 *                       type: string
 *                       example: administrador
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '500':
 *         description: Error al verificar los permisos.
 */

app.get(
  '/api/privado/administrador',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    res.status(200).json({
      mensaje: 'Acceso de administrador autorizado',
      usuario: {
        id: req.usuario.id,
        email: req.usuario.email,
        rol: req.usuario.rol,
      },
    })
  }
)

/**
 * @openapi
 * /api:
 *   get:
 *     summary: Verificar el funcionamiento de la API
 *     description: Comprueba que el servidor REST de BulkWay está funcionando.
 *     tags:
 *       - Sistema
 *     responses:
 *       '200':
 *         description: La API está funcionando correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: API BulkWay funcionando
 */


app.get('/api', (req, res) => {
  res.json({
    mensaje: 'API BulkWay funcionando'
  })
})

/**
 * @openapi
 * /api/productos:
 *   get:
 *     summary: Listar productos
 *     description: Obtiene los productos registrados en la base de datos operativa de BulkWay.
 *     tags:
 *       - Productos
 *     responses:
 *       '200':
 *         description: Lista de productos obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       '500':
 *         description: Error al cargar los productos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No fue posible cargar los productos
 */


app.get('/api/productos', (req, res) => {
  try {
    const db = leerDB()

    res.json(db.productos || [])
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: 'No fue posible cargar los productos'
    })
  }
})

/**
 * @openapi
 * /api/pedidos:
 *   get:
 *     summary: Listar pedidos
 *     description: Obtiene los pedidos registrados en la base de datos operativa de BulkWay.
 *     tags:
 *       - Pedidos
 *     responses:
 *       '200':
 *         description: Lista de pedidos obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       '500':
 *         description: Error al cargar los pedidos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No fue posible cargar los pedidos
 */


app.get('/api/pedidos', (req, res) => {
  try {
    const db = leerDB()

    res.json(db.pedidos || [])
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: 'No fue posible cargar los pedidos'
    })
  }
})

/**
 * @openapi
 * /api/pedidos/{id}:
 *   get:
 *     summary: Consultar un pedido por ID
 *     description: Busca un pedido específico por su identificador.
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador del pedido.
 *         schema:
 *           type: string
 *         example: BK-201
 *     responses:
 *       '200':
 *         description: Pedido encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       '404':
 *         description: Pedido no encontrado.
 *       '500':
 *         description: Error al consultar el pedido.
 */


app.get('/api/pedidos/:id', (req, res) => {
  try {
    const db = leerDB()

    const pedido = (db.pedidos || []).find(
      item => item.id === req.params.id
    )

    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado'
      })
    }

    res.status(200).json(pedido)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: 'No fue posible consultar el pedido'
    })
  }
})

/**
 * @openapi
 * /api/pedidos:
 *   post:
 *     summary: Crear un pedido
 *     description: Registra un pedido nuevo. Requiere autenticación y permisos de administrador.
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cliente
 *               - direccion
 *               - productoId
 *               - cantidad
 *             properties:
 *               cliente:
 *                 type: string
 *                 example: Cliente API Prueba
 *               direccion:
 *                 type: string
 *                 example: Calle 10 # 20-30
 *               productoId:
 *                 type: string
 *                 example: PROD-001
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       '201':
 *         description: Pedido creado correctamente.
 *       '400':
 *         description: Datos incompletos o cantidad no válida.
 *       '401':
 *         description: Token de autenticación ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: Producto no encontrado.
 *       '500':
 *         description: Error interno al crear el pedido.
 */


app.post(
  '/api/pedidos',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const { cliente, clienteId, direccion, productoId, cantidad, fecha } = req.body

      if (
        typeof cliente !== 'string' ||
        !cliente.trim() ||
        typeof direccion !== 'string' ||
        !direccion.trim() ||
        productoId === undefined ||
        productoId === null ||
        String(productoId).trim() === '' ||
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0
      ) {
        return res.status(400).json({
          error: 'Cliente, dirección, producto y cantidad son obligatorios y deben ser válidos'
        })
      }

      const db = leerDB()

      db.productos = db.productos || []
      db.pedidos = db.pedidos || []
      db.inventario = db.inventario || []

      const producto = db.productos.find(
        item => String(item.id) === String(productoId)
      )

      if (!producto) {
        return res.status(404).json({
          error: 'El producto indicado no existe'
        })
      }

      const stockDisponible = Number(producto.stock)
      const precio = Number(producto.precio)

      if (!Number.isSafeInteger(stockDisponible) || stockDisponible < 0) {
        return res.status(500).json({
          error: 'El stock del producto no es válido'
        })
      }

      if (!Number.isFinite(precio) || precio < 0) {
        return res.status(500).json({
          error: 'El precio del producto no es válido'
        })
      }

      if (cantidad > stockDisponible) {
        return res.status(400).json({
          error: 'La cantidad solicitada supera el stock disponible',
          stockDisponible
        })
      }

      const stockNuevo = stockDisponible - cantidad
      const total = precio * cantidad
      const fechaActual = new Date().toISOString()

      if (!Number.isFinite(total)) {
        return res.status(400).json({
          error: 'No fue posible calcular el total del pedido'
        })
      }

      const nuevoPedido = {
        id: `PED-${Date.now()}`,
        fecha: fecha || fechaActual.slice(0, 10),
        ...(clienteId !== undefined ? { clienteId } : {}),
        cliente: cliente.trim(),
        direccion: direccion.trim(),
        productoId: producto.id,
        producto: producto.nombre,
        cantidad,
        precioUnitario: precio,
        subtotal: total,
        total,
        estado: 'Pendiente',
        conductor: 'Sin asignar',
        ruta: 'Sin asignar'
      }

      const movimiento = {
        id: `INV-${Date.now()}`,
        productoId: producto.id,
        producto: producto.nombre,
        tipo: 'salida',
        cantidad,
        stockAnterior: stockDisponible,
        stockNuevo,
        motivo: `Pedido ${nuevoPedido.id}`,
        fecha: fechaActual
      }

      producto.stock = stockNuevo
      db.pedidos.push(nuevoPedido)
      db.inventario.push(movimiento)

      guardarDB(db)

      return res.status(201).json(nuevoPedido)
    } catch (error) {
      console.error('Error creando pedido:', error)

      return res.status(500).json({
        error: 'No fue posible crear el pedido'
      })
    }
  }
)

/**
 * @openapi
 * /api/productos/{id}:
 *   get:
 *     summary: Consultar un producto por ID
 *     description: Busca un producto por su identificador.
 *     tags:
 *       - Productos
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador del producto.
 *         schema:
 *           type: string
 *         example: PROD-001
 *     responses:
 *       '200':
 *         description: Producto encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       '404':
 *         description: Producto no encontrado.
 *       '500':
 *         description: No fue posible consultar el producto.
 */

app.get('/api/productos/:id', (req, res) => {
  try {
    const db = leerDB()

    const producto = (db.productos || []).find(
      item => item.id === req.params.id
    )

    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      })
    }

    res.status(200).json(producto)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: 'No fue posible consultar el producto'
    })
  }
})

/**
 * @openapi
 * /api/inventario:
 *   get:
 *     summary: Consultar inventario
 *     description: Obtiene los movimientos y registros de inventario almacenados. Requiere permisos de administrador.
 *     tags:
 *       - Inventario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Inventario consultado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '500':
 *         description: Error al consultar el inventario.
 */

app.get(
  '/api/inventario',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();

      res.status(200).json(db.inventario || []);
    } catch (error) {
      console.error('Error consultando inventario:', error);

      res.status(500).json({
        error: 'No fue posible consultar el inventario',
      });
    }
  }
);

/**
 * @openapi
 * /api/inventario:
 *   post:
 *     summary: Registrar un movimiento de inventario
 *     description: Registra una entrada o salida de inventario. Requiere permisos de administrador.
 *     tags:
 *       - Inventario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productoId
 *               - tipo
 *               - cantidad
 *               - motivo
 *             properties:
 *               productoId:
 *                 type: string
 *                 example: PROD-001
 *               tipo:
 *                 type: string
 *                 enum:
 *                   - entrada
 *                   - salida
 *                 example: entrada
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *               motivo:
 *                 type: string
 *                 example: Reposición de existencias
 *     responses:
 *       '200':
 *         description: Movimiento registrado correctamente, si ese es el código devuelto por la implementación.
 *       '201':
 *         description: Movimiento creado, si ese es el código devuelto por la implementación.
 *       '400':
 *         description: Datos inválidos o incompletos.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: Producto no encontrado.
 *       '500':
 *         description: Error interno al registrar el movimiento.
 */


app.post(
  '/api/inventario',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const { productoId, tipo, cantidad, motivo } = req.body;

      if (
        productoId === undefined ||
        productoId === null ||
        !['entrada', 'salida'].includes(tipo) ||
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0 ||
        typeof motivo !== 'string' ||
        !motivo.trim()
      ) {
        return res.status(400).json({
          error: 'Verifica el producto, tipo, cantidad y motivo.',
        });
      }

      const db = leerDB();

      db.productos = db.productos || [];
      db.inventario = db.inventario || [];

      const producto = db.productos.find(
        (item) => String(item.id) === String(productoId)
      );

      if (!producto) {
        return res.status(404).json({
          error: 'El producto no existe.',
        });
      }

      const stockAnterior = Number(producto.stock);

      if (!Number.isSafeInteger(stockAnterior) || stockAnterior < 0) {
        return res.status(500).json({
          error: 'El stock actual del producto no es válido.',
        });
      }

      const stockNuevo =
        tipo === 'entrada'
          ? stockAnterior + cantidad
          : stockAnterior - cantidad;

      if (!Number.isSafeInteger(stockNuevo)) {
        return res.status(400).json({
          error: 'La cantidad supera el límite permitido.',
        });
      }

      if (stockNuevo < 0) {
        return res.status(400).json({
          error: `Stock insuficiente. Disponible: ${stockAnterior}.`,
        });
      }

      const movimiento = {
        id: `INV-${Date.now()}`,
        productoId: producto.id,
        producto: producto.nombre,
        tipo,
        cantidad,
        stockAnterior,
        stockNuevo,
        motivo: motivo.trim(),
        fecha: new Date().toISOString(),
      };

      producto.stock = stockNuevo;
      db.inventario.push(movimiento);

      guardarDB(db);

      return res.status(201).json({
        mensaje: 'Movimiento registrado correctamente.',
        movimiento,
        stockRestante: stockNuevo,
      });
    } catch (error) {
      console.error('Error registrando movimiento:', error);

      return res.status(500).json({
        error: 'No fue posible registrar el movimiento.',
      });
    }
  }
);

app.post(
  '/api/productos',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const { nombre, categoria, presentacion, stock, precio } = req.body;

      if (
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        !Number.isSafeInteger(stock) ||
        stock < 0 ||
        !Number.isFinite(precio) ||
        precio < 0
      ) {
        return res.status(400).json({
          error: 'Nombre, stock y precio deben ser válidos.',
        });
      }

      const db = leerDB();
      db.productos = db.productos || [];

      const nuevoProducto = {
        id: `PROD-${Date.now()}`,
        nombre: nombre.trim(),
        categoria: typeof categoria === 'string' ? categoria.trim() : '',
        presentacion:
          typeof presentacion === 'string' ? presentacion.trim() : '',
        stock,
        precio,
      };

      db.productos.push(nuevoProducto);
      guardarDB(db);

      return res.status(201).json(nuevoProducto);
    } catch (error) {
      console.error('Error creando producto:', error);

      return res.status(500).json({
        error: 'No fue posible crear el producto.',
      });
    }
  }
);

/**
 * @openapi
 * /api/productos/{id}:
 *   patch:
 *     summary: Actualizar un producto
 *     description: Modifica los datos de un producto. Si cambia el stock, registra el movimiento correspondiente en el inventario. Requiere permisos de administrador.
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador del producto.
 *         schema:
 *           type: string
 *         example: PROD-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Jabón líquido para ropa
 *               categoria:
 *                 type: string
 *                 example: Limpieza
 *               presentacion:
 *                 type: string
 *                 example: Galón
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 example: 120
 *               precio:
 *                 type: number
 *                 minimum: 0
 *                 example: 12900
 *     responses:
 *       '200':
 *         description: Producto actualizado correctamente.
 *       '400':
 *         description: Uno o más campos enviados no son válidos.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: El producto no existe.
 *       '500':
 *         description: No fue posible actualizar el producto.
 */

app.patch(
  '/api/productos/:id',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.productos = db.productos || [];
      db.inventario = db.inventario || [];

      const producto = db.productos.find(
        (item) => String(item.id) === String(req.params.id)
      );

      if (!producto) {
        return res.status(404).json({
          error: 'El producto no existe.',
        });
      }

      const cambios = req.body;

      if (
        cambios.nombre !== undefined &&
        (typeof cambios.nombre !== 'string' || !cambios.nombre.trim())
      ) {
        return res.status(400).json({
          error: 'El nombre del producto no es válido.',
        });
      }

      if (
        cambios.stock !== undefined &&
        (!Number.isSafeInteger(cambios.stock) || cambios.stock < 0)
      ) {
        return res.status(400).json({
          error: 'El stock debe ser un entero mayor o igual que cero.',
        });
      }

      if (
        cambios.precio !== undefined &&
        (!Number.isFinite(cambios.precio) || cambios.precio < 0)
      ) {
        return res.status(400).json({
          error: 'El precio debe ser un número mayor o igual que cero.',
        });
      }

      for (const campo of ['categoria', 'presentacion']) {
        if (
          cambios[campo] !== undefined &&
          typeof cambios[campo] !== 'string'
        ) {
          return res.status(400).json({
            error: `El campo ${campo} debe ser texto.`,
          });
        }
      }

      const stockAnterior = Number(producto.stock);
      const stockNuevo =
        cambios.stock !== undefined ? cambios.stock : stockAnterior;

      if (stockNuevo !== stockAnterior) {
        db.inventario.push({
          id: `INV-${Date.now()}`,
          productoId: producto.id,
          producto: producto.nombre,
          tipo: stockNuevo > stockAnterior ? 'entrada' : 'salida',
          cantidad: Math.abs(stockNuevo - stockAnterior),
          stockAnterior,
          stockNuevo,
          motivo: 'Ajuste de stock por edición de producto',
          fecha: new Date().toISOString(),
        });
      }

      if (cambios.nombre !== undefined) {
        producto.nombre = cambios.nombre.trim();
      }

      if (cambios.categoria !== undefined) {
        producto.categoria = cambios.categoria.trim();
      }

      if (cambios.presentacion !== undefined) {
        producto.presentacion = cambios.presentacion.trim();
      }

      if (cambios.stock !== undefined) {
        producto.stock = cambios.stock;
      }

      if (cambios.precio !== undefined) {
        producto.precio = cambios.precio;
      }

      const ultimoMovimiento = db.inventario[db.inventario.length - 1];

      if (
        stockNuevo !== stockAnterior &&
        ultimoMovimiento?.productoId === producto.id
      ) {
        ultimoMovimiento.producto = producto.nombre;
      }

      guardarDB(db);

      return res.status(200).json(producto);
    } catch (error) {
      console.error('Error editando producto:', error);

      return res.status(500).json({
        error: 'No fue posible actualizar el producto.',
      });
    }
  }
);

/**
 * @openapi
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     description: Elimina un producto si no está asociado a pedidos. Requiere permisos de administrador.
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador del producto que se eliminará.
 *         schema:
 *           type: string
 *         example: PROD-001
 *     responses:
 *       '200':
 *         description: Producto eliminado correctamente.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: El producto no existe.
 *       '409':
 *         description: No se puede eliminar porque el producto está asociado a pedidos.
 *       '500':
 *         description: No fue posible eliminar el producto por un error interno.
 */

app.delete(
  '/api/productos/:id',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.productos = db.productos || [];

      const indice = db.productos.findIndex(
        (item) => String(item.id) === String(req.params.id)
      );

      if (indice === -1) {
        return res.status(404).json({
          error: 'El producto no existe.',
        });
      }

      const producto = db.productos[indice];

      const tienePedidos = (db.pedidos || []).some(
        (pedido) =>
          String(pedido.productoId) === String(producto.id)
      );

      if (tienePedidos) {
        return res.status(409).json({
          error: 'No se puede eliminar un producto asociado a pedidos.',
        });
      }

      db.productos.splice(indice, 1);
      guardarDB(db);

      return res.status(200).json({
        mensaje: 'Producto eliminado correctamente.',
        producto,
      });
    } catch (error) {
      console.error('Error eliminando producto:', error);

      return res.status(500).json({
        error: 'No fue posible eliminar el producto.',
      });
    }
  }
);

/**
 * @openapi
 * /api/clientes:
 *   get:
 *     summary: Listar clientes
 *     description: Obtiene los clientes registrados en BulkWay. Requiere permisos de administrador.
 *     tags:
 *       - Clientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de clientes obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '500':
 *         description: No fue posible consultar los clientes.
 */

app.get(
  '/api/clientes',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      return res.status(200).json(db.clientes || []);
    } catch (error) {
      console.error('Error consultando clientes:', error);
      return res.status(500).json({
        error: 'No fue posible consultar los clientes.',
      });
    }
  }
);

/**
 * @openapi
 * /api/clientes:
 *   post:
 *     summary: Registrar un cliente
 *     description: Crea un cliente nuevo. Requiere autenticación y permisos de administrador.
 *     tags:
 *       - Clientes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Supermercado El Ahorro
 *               empresa:
 *                 type: string
 *                 example: El Ahorro SAS
 *               documento:
 *                 type: string
 *                 example: "900123456"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: compras@ejemplo.com
 *               direccion:
 *                 type: string
 *                 example: Calle 10 # 20-30
 *               ciudad:
 *                 type: string
 *                 default: Bogotá
 *                 example: Bogotá
 *               estado:
 *                 type: string
 *                 default: Activo
 *                 example: Activo
 *               fechaRegistro:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-14"
 *     responses:
 *       '201':
 *         description: Cliente creado correctamente, si la implementación devuelve ese código.
 *       '400':
 *         description: El nombre del cliente es obligatorio.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '409':
 *         description: Ya existe un cliente con ese documento o correo.
 *       '500':
 *         description: Error interno al registrar el cliente.
 */

app.post(
  '/api/clientes',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.clientes = db.clientes || [];

      const {
        nombre,
        empresa = '',
        documento = '',
        telefono = '',
        correo = '',
        direccion = '',
        ciudad = 'Bogotá',
        estado = 'Activo',
        fechaRegistro,
      } = req.body || {};

      if (typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({
          error: 'El nombre del cliente es obligatorio.',
        });
      }

      const documentoNuevo = String(documento).trim();
      const correoNuevo = String(correo).trim().toLowerCase();

      const duplicado = db.clientes.some((cliente) =>
        (documentoNuevo &&
          String(cliente.documento || '').trim() === documentoNuevo) ||
        (correoNuevo &&
          String(cliente.correo || '').trim().toLowerCase() === correoNuevo)
      );

      if (duplicado) {
        return res.status(409).json({
          error: 'Ya existe un cliente con ese documento o correo.',
        });
      }

      const nuevoCliente = {
        id: `CLI-${Date.now()}`,
        nombre: nombre.trim(),
        empresa: String(empresa).trim(),
        documento: documentoNuevo,
        telefono: String(telefono).trim(),
        correo: String(correo).trim(),
        direccion: String(direccion).trim(),
        ciudad: String(ciudad).trim(),
        estado: String(estado).trim() || 'Activo',
        fechaRegistro:
          typeof fechaRegistro === 'string' && fechaRegistro.trim()
            ? fechaRegistro
            : new Date().toISOString().split('T')[0],
      };

      db.clientes.push(nuevoCliente);
      guardarDB(db);

      return res.status(201).json(nuevoCliente);
    } catch (error) {
      console.error('Error creando cliente:', error);
      return res.status(500).json({
        error: 'No fue posible crear el cliente.',
      });
    }
  }
);

/**
 * @openapi
 * /api/clientes/{id}:
 *   patch:
 *     summary: Actualizar un cliente
 *     description: Actualiza los datos de un cliente y comprueba que su documento y correo no estén duplicados. Requiere permisos de administrador.
 *     tags:
 *       - Clientes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador del cliente.
 *         schema:
 *           type: string
 *         example: CLI-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Supermercado Central
 *               empresa:
 *                 type: string
 *                 example: Central SAS
 *               documento:
 *                 type: string
 *                 example: "123456789"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: cliente@ejemplo.com
 *               direccion:
 *                 type: string
 *                 example: Calle 80 # 20-15
 *               ciudad:
 *                 type: string
 *                 example: Bogotá
 *               estado:
 *                 type: string
 *                 example: Activo
 *     responses:
 *       '200':
 *         description: Cliente actualizado correctamente.
 *       '400':
 *         description: Los campos enviados no son válidos.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: El cliente no existe.
 *       '409':
 *         description: Otro cliente ya tiene ese documento o correo.
 *       '500':
 *         description: No fue posible actualizar el cliente.
 */

app.patch(
  '/api/clientes/:id',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.clientes = db.clientes || [];

      const cliente = db.clientes.find(
        (item) => String(item.id) === String(req.params.id)
      );

      if (!cliente) {
        return res.status(404).json({
          error: 'El cliente no existe.',
        });
      }

      const camposPermitidos = [
        'nombre',
        'empresa',
        'documento',
        'telefono',
        'correo',
        'direccion',
        'ciudad',
        'estado',
      ];

      const cambios = req.body || {};
      const camposRecibidos = Object.keys(cambios);

      if (
        camposRecibidos.length === 0 ||
        camposRecibidos.some((campo) => !camposPermitidos.includes(campo))
      ) {
        return res.status(400).json({
          error: 'Los campos enviados no son válidos.',
        });
      }

      for (const campo of camposRecibidos) {
        if (typeof cambios[campo] !== 'string') {
          return res.status(400).json({
            error: `El campo ${campo} debe ser texto.`,
          });
        }
      }

      if (
        cambios.nombre !== undefined &&
        !cambios.nombre.trim()
      ) {
        return res.status(400).json({
          error: 'El nombre del cliente es obligatorio.',
        });
      }

      const documentoNuevo =
        cambios.documento === undefined
          ? String(cliente.documento || '').trim()
          : cambios.documento.trim();

      const correoNuevo =
        cambios.correo === undefined
          ? String(cliente.correo || '').trim().toLowerCase()
          : cambios.correo.trim().toLowerCase();

      const duplicado = db.clientes.some(
        (otro) =>
          String(otro.id) !== String(cliente.id) &&
          (
            (documentoNuevo &&
              String(otro.documento || '').trim() === documentoNuevo) ||
            (correoNuevo &&
              String(otro.correo || '').trim().toLowerCase() === correoNuevo)
          )
      );

      if (duplicado) {
        return res.status(409).json({
          error: 'Otro cliente ya tiene ese documento o correo.',
        });
      }

      for (const campo of camposRecibidos) {
        cliente[campo] = cambios[campo].trim();
      }

      guardarDB(db);

      return res.status(200).json(cliente);
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      return res.status(500).json({
        error: 'No fue posible actualizar el cliente.',
      });
    }
  }
);

/**
 * @openapi
 * /api/clientes/{id}:
 *   delete:
 *     summary: Eliminar un cliente
 *     description: Elimina un cliente si no tiene pedidos asociados. Requiere permisos de administrador.
 *     tags:
 *       - Clientes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador del cliente que se desea eliminar.
 *         schema:
 *           type: string
 *         example: CLI-001
 *     responses:
 *       '200':
 *         description: Cliente eliminado correctamente.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Cliente eliminado correctamente.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: El cliente no existe.
 *       '409':
 *         description: No se puede eliminar un cliente asociado a pedidos.
 *       '500':
 *         description: Error interno al eliminar el cliente.
 */

app.delete(
  '/api/clientes/:id',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.clientes = db.clientes || [];

      const indice = db.clientes.findIndex(
        (item) => String(item.id) === String(req.params.id)
      );

      if (indice === -1) {
        return res.status(404).json({
          error: 'El cliente no existe.',
        });
      }

      const cliente = db.clientes[indice];

      const tienePedidos = (db.pedidos || []).some(
        (pedido) =>
          String(pedido.clienteId || '') === String(cliente.id) ||
          (
            pedido.cliente &&
            cliente.nombre &&
            String(pedido.cliente).trim().toLowerCase() ===
              String(cliente.nombre).trim().toLowerCase()
          )
      );

      if (tienePedidos) {
        return res.status(409).json({
          error: 'No se puede eliminar un cliente asociado a pedidos.',
        });
      }

      db.clientes.splice(indice, 1);
      guardarDB(db);

      return res.status(200).json({
        mensaje: 'Cliente eliminado correctamente.',
        cliente,
      });
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      return res.status(500).json({
        error: 'No fue posible eliminar el cliente.',
      });
    }
  }
);

/**
 * @openapi
 * /api/conductores:
 *   get:
 *     summary: Listar conductores
 *     description: Obtiene los conductores registrados en BulkWay. Requiere permisos de administrador.
 *     tags:
 *       - Conductores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de conductores obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '500':
 *         description: No fue posible consultar los conductores.
 */

app.get(
  '/api/conductores',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      return res.status(200).json(db.conductores || []);
    } catch (error) {
      console.error('Error consultando conductores:', error);
      return res.status(500).json({
        error: 'No fue posible consultar los conductores.',
      });
    }
  }
);

/**
 * @openapi
 * /api/conductores:
 *   post:
 *     summary: Registrar un conductor
 *     description: Registra un conductor nuevo. Requiere autenticación y permisos de administrador.
 *     tags:
 *       - Conductores
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - nombre
 *               - cedula
 *               - telefono
 *               - correo
 *               - zona
 *             properties:
 *               id:
 *                 type: string
 *                 example: COND-002
 *               nombre:
 *                 type: string
 *                 example: Laura Martínez
 *               cedula:
 *                 type: string
 *                 example: "1020304050"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: conductor@ejemplo.com
 *               zona:
 *                 type: string
 *                 example: Chapinero
 *               estado:
 *                 type: string
 *                 default: Activo
 *                 example: Activo
 *     responses:
 *       '201':
 *         description: Conductor registrado correctamente.
 *       '400':
 *         description: Faltan campos obligatorios o sus valores no son válidos.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '409':
 *         description: Ya existe un conductor con ese ID, cédula o correo.
 *       '500':
 *         description: Error interno al registrar el conductor.
 */

app.post(
  '/api/conductores',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.conductores = db.conductores || [];

      const {
        id,
        nombre,
        cedula,
        telefono,
        correo,
        zona,
        estado = 'Activo',
      } = req.body || {};

      if (
        !id ||
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        typeof cedula !== 'string' ||
        !cedula.trim() ||
        typeof telefono !== 'string' ||
        !telefono.trim() ||
        typeof correo !== 'string' ||
        !correo.trim() ||
        typeof zona !== 'string' ||
        !zona.trim()
      ) {
        return res.status(400).json({
          error: 'Debes enviar el ID, nombre, cédula, teléfono, correo y zona del conductor.',
        });
      }

      const duplicado = db.conductores.some(
        (conductor) =>
          String(conductor.id) === String(id) ||
          String(conductor.cedula || '').trim() === cedula.trim() ||
          String(conductor.correo || '').trim().toLowerCase() ===
            correo.trim().toLowerCase()
      );

      if (duplicado) {
        return res.status(409).json({
          error: 'Ya existe un conductor con ese ID, cédula o correo.',
        });
      }

      const nuevoConductor = {
        id: String(id),
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        telefono: telefono.trim(),
        correo: correo.trim(),
        zona: zona.trim(),
        estado: String(estado).trim() || 'Activo',
      };

      db.conductores.push(nuevoConductor);
      guardarDB(db);

      return res.status(201).json(nuevoConductor);
    } catch (error) {
      console.error('Error registrando conductor:', error);
      return res.status(500).json({
        error: 'No fue posible registrar el conductor.',
      });
    }
  }
);

/**
 * @openapi
 * /api/conductores/{id}:
 *   patch:
 *     summary: Actualizar un conductor
 *     description: Actualiza los datos de un conductor y comprueba que su cédula o correo no estén duplicados. Requiere permisos de administrador.
 *     tags:
 *       - Conductores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador del conductor.
 *         schema:
 *           type: string
 *         example: COND-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Andrés Gómez
 *               cedula:
 *                 type: string
 *                 example: "1020304050"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: conductor@ejemplo.com
 *               zona:
 *                 type: string
 *                 example: Norte
 *               estado:
 *                 type: string
 *                 example: Activo
 *     responses:
 *       '200':
 *         description: Conductor actualizado correctamente.
 *       '400':
 *         description: Los campos enviados no son válidos o contienen valores vacíos.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: El conductor no existe.
 *       '409':
 *         description: Otro conductor ya tiene esa cédula o correo.
 *       '500':
 *         description: No fue posible actualizar el conductor.
 */

app.patch(
  '/api/conductores/:id',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.conductores = db.conductores || [];

      const conductor = db.conductores.find(
        (item) => String(item.id) === String(req.params.id)
      );

      if (!conductor) {
        return res.status(404).json({
          error: 'El conductor no existe.',
        });
      }

      const cambios = req.body || {};
      const camposPermitidos = [
        'nombre',
        'cedula',
        'telefono',
        'correo',
        'zona',
        'estado',
      ];
      const campos = Object.keys(cambios);

      if (
        campos.length === 0 ||
        campos.some((campo) => !camposPermitidos.includes(campo))
      ) {
        return res.status(400).json({
          error: 'Los campos enviados no son válidos.',
        });
      }

      for (const campo of campos) {
        if (typeof cambios[campo] !== 'string' || !cambios[campo].trim()) {
          return res.status(400).json({
            error: `El campo ${campo} debe ser un texto no vacío.`,
          });
        }
      }

      const cedulaNueva = cambios.cedula?.trim();
      const correoNuevo = cambios.correo?.trim().toLowerCase();

      const duplicado = db.conductores.some(
        (otro) =>
          String(otro.id) !== String(conductor.id) &&
          (
            (cedulaNueva &&
              String(otro.cedula || '').trim() === cedulaNueva) ||
            (correoNuevo &&
              String(otro.correo || '').trim().toLowerCase() === correoNuevo)
          )
      );

      if (duplicado) {
        return res.status(409).json({
          error: 'Otro conductor ya tiene esa cédula o correo.',
        });
      }

      for (const campo of campos) {
        conductor[campo] = cambios[campo].trim();
      }

      guardarDB(db);

      return res.status(200).json(conductor);
    } catch (error) {
      console.error('Error actualizando conductor:', error);
      return res.status(500).json({
        error: 'No fue posible actualizar el conductor.',
      });
    }
  }
);

/**
 * @openapi
 * /api/conductores/{id}:
 *   delete:
 *     summary: Eliminar un conductor
 *     description: Elimina un conductor únicamente si no tiene pedidos ni rutas asignados. Requiere permisos de administrador.
 *     tags:
 *       - Conductores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador del conductor que se desea eliminar.
 *         schema:
 *           type: string
 *         example: COND-001
 *     responses:
 *       '200':
 *         description: Conductor eliminado correctamente.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Conductor eliminado correctamente.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: El conductor no existe.
 *       '409':
 *         description: No se puede eliminar el conductor porque tiene pedidos o rutas asignados.
 *       '500':
 *         description: Error interno al eliminar el conductor.
 */

app.delete(
  '/api/conductores/:id',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.conductores = db.conductores || [];

      const indice = db.conductores.findIndex(
        (item) => String(item.id) === String(req.params.id)
      );

      if (indice === -1) {
        return res.status(404).json({
          error: 'El conductor no existe.',
        });
      }

      const conductor = db.conductores[indice];
      const nombreConductor = String(conductor.nombre || '')
        .trim()
        .toLowerCase();

      const tienePedidos = (db.pedidos || []).some(
        (pedido) =>
          String(pedido.conductor || '').trim().toLowerCase() ===
          nombreConductor
      );

      const tieneRutas = (db.rutas || []).some(
        (ruta) =>
          String(ruta.conductor || '').trim().toLowerCase() ===
          nombreConductor
      );

      if (tienePedidos || tieneRutas) {
        return res.status(409).json({
          error: 'No se puede eliminar este conductor porque tiene pedidos o rutas asignados.',
        });
      }

      db.conductores.splice(indice, 1);
      guardarDB(db);

      return res.status(200).json({
        mensaje: 'Conductor eliminado correctamente.',
        conductor,
      });
    } catch (error) {
      console.error('Error eliminando conductor:', error);
      return res.status(500).json({
        error: 'No fue posible eliminar el conductor.',
      });
    }
  }
);

/**
 * @openapi
 * /api/pedidos/{id}:
 *   patch:
 *     summary: Actualizar un pedido
 *     description: Permite actualizar el conductor asignado, la ruta o el estado de un pedido. Requiere permisos de administrador.
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador del pedido.
 *         schema:
 *           type: string
 *         example: BK-201
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conductor:
 *                 type: string
 *                 example: Carlos Sierra
 *               ruta:
 *                 type: string
 *                 example: Ruta Norte
 *               estado:
 *                 type: string
 *                 example: En ruta
 *             minProperties: 1
 *             additionalProperties: false
 *           examples:
 *             actualizarEstado:
 *               summary: Cambiar estado del pedido
 *               value:
 *                 estado: En ruta
 *     responses:
 *       '200':
 *         description: Pedido actualizado correctamente.
 *       '400':
 *         description: Los campos enviados no son válidos o están vacíos.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: El pedido no existe.
 *       '500':
 *         description: No fue posible actualizar el pedido.
 */

app.patch(
  '/api/pedidos/:id',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.pedidos = db.pedidos || [];

      const pedido = db.pedidos.find(
        (item) => String(item.id) === String(req.params.id)
      );

      if (!pedido) {
        return res.status(404).json({
          error: 'El pedido no existe.',
        });
      }

      const camposPermitidos = ['conductor', 'ruta', 'estado'];
      const cambios = req.body || {};

      const camposRecibidos = Object.keys(cambios);
      const camposInvalidos = camposRecibidos.filter(
        (campo) => !camposPermitidos.includes(campo)
      );

      if (camposInvalidos.length > 0) {
        return res.status(400).json({
          error: 'Solo se pueden actualizar conductor, ruta y estado.',
        });
      }

      if (camposRecibidos.length === 0) {
        return res.status(400).json({
          error: 'Debes indicar al menos un campo para actualizar.',
        });
      }

      for (const campo of camposRecibidos) {
        if (
          typeof cambios[campo] !== 'string' ||
          !cambios[campo].trim()
        ) {
          return res.status(400).json({
            error: `El campo ${campo} debe ser un texto válido.`,
          });
        }
      }

      for (const campo of camposRecibidos) {
        pedido[campo] = cambios[campo].trim();
      }

      guardarDB(db);

      return res.status(200).json(pedido);
    } catch (error) {
      console.error('Error actualizando pedido:', error);

      return res.status(500).json({
        error: 'No fue posible actualizar el pedido.',
      });
    }
  }
);

/**
 * @openapi
 * /api/rutas:
 *   get:
 *     summary: Listar rutas de entrega
 *     description: Obtiene las rutas registradas en BulkWay. Requiere permisos de administrador.
 *     tags:
 *       - Rutas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de rutas obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '500':
 *         description: No fue posible cargar las rutas.
 */

app.get(
  '/api/rutas',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      const rutas = db.rutas || [];

      return res.status(200).json(rutas);
    } catch (error) {
      console.error('Error consultando rutas:', error);

      return res.status(500).json({
        error: 'No fue posible cargar las rutas.',
      });
    }
  }
);

/**
 * @openapi
 * /api/rutas:
 *   post:
 *     summary: Crear una ruta de entrega
 *     description: Crea una ruta y asigna los pedidos seleccionados al conductor indicado. Requiere permisos de administrador.
 *     tags:
 *       - Rutas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - zona
 *               - conductor
 *               - pedidos
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Ruta Chapinero Norte
 *               zona:
 *                 type: string
 *                 example: Chapinero
 *               conductor:
 *                 type: string
 *                 example: Carlos Sierra
 *               pedidos:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                 example:
 *                   - BK-201
 *                   - BK-202
 *               estado:
 *                 type: string
 *                 example: Pendiente
 *               fechaCreacion:
 *                 type: string
 *                 format: date-time
 *                 example: '2026-10-14T10:00:00.000Z'
 *     responses:
 *       '201':
 *         description: Ruta creada y pedidos asignados correctamente.
 *       '400':
 *         description: Faltan datos obligatorios o hay pedidos repetidos o inexistentes.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '409':
 *         description: El nombre de la ruta ya existe o uno de los pedidos ya está asignado.
 *       '500':
 *         description: No fue posible crear la ruta.
 */

app.post(
  '/api/rutas',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const {
        nombre,
        zona,
        conductor,
        pedidos,
        cantidadPedidos,
        estado,
        fechaCreacion,
        fechaActualizacion,
      } = req.body || {};

      if (
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        typeof zona !== 'string' ||
        !zona.trim() ||
        typeof conductor !== 'string' ||
        !conductor.trim() ||
        !Array.isArray(pedidos) ||
        pedidos.length === 0
      ) {
        return res.status(400).json({
          error: 'Nombre, zona, conductor y al menos un pedido son obligatorios.',
        });
      }

      const db = leerDB();
      db.rutas = db.rutas || [];
      db.pedidos = db.pedidos || [];

      const nombreExiste = db.rutas.some(
        (ruta) =>
          String(ruta.nombre || '').trim().toLowerCase() ===
          nombre.trim().toLowerCase()
      );

      if (nombreExiste) {
        return res.status(409).json({
          error: 'Ya existe una ruta con ese nombre.',
        });
      }

      const ids = pedidos.map((id) => String(id));
      const idsUnicos = new Set(ids);

      if (idsUnicos.size !== ids.length) {
        return res.status(400).json({
          error: 'No puedes incluir el mismo pedido más de una vez.',
        });
      }

      const pedidosEncontrados = ids.map((id) =>
        db.pedidos.find((pedido) => String(pedido.id) === id)
      );

      if (pedidosEncontrados.some((pedido) => !pedido)) {
        return res.status(400).json({
          error: 'Uno o más pedidos seleccionados no existen.',
        });
      }

      const pedidosOcupados = pedidosEncontrados.some(
        (pedido) =>
          (
            pedido.conductor &&
            pedido.conductor.trim().toLowerCase() !== 'sin asignar' &&
            pedido.conductor.trim().toLowerCase() !== conductor.trim().toLowerCase()
          ) ||
          (
            pedido.ruta &&
            pedido.ruta.trim().toLowerCase() !== 'sin asignar'
          )
      );

      if (pedidosOcupados) {
        return res.status(409).json({
          error: 'Uno o más pedidos ya están asignados a una ruta.',
        });
      }

      const fechaActual = new Date().toISOString();

      const nuevaRuta = {
        id: Date.now(),
        nombre: nombre.trim(),
        zona: zona.trim(),
        conductor: conductor.trim(),
        pedidos: ids,
        cantidadPedidos: ids.length,
        estado: estado || 'Pendiente',
        fechaCreacion: fechaCreacion || fechaActual,
        fechaActualizacion: fechaActual,
      };

      for (const pedido of pedidosEncontrados) {
        pedido.conductor = nuevaRuta.conductor;
        pedido.ruta = nuevaRuta.nombre;
        pedido.estado =
          nuevaRuta.estado === 'Entregada'
            ? 'Entregado'
            : nuevaRuta.estado === 'En ruta'
              ? 'En ruta'
              : 'Pendiente';
      }

      db.rutas.push(nuevaRuta);
      guardarDB(db);

      return res.status(201).json(nuevaRuta);
    } catch (error) {
      console.error('Error creando ruta:', error);

      return res.status(500).json({
        error: 'No fue posible crear la ruta.',
      });
    }
  }
);

/**
 * @openapi
 * /api/rutas/{id}:
 *   patch:
 *     summary: Actualizar una ruta de entrega
 *     description: Actualiza los datos de una ruta y sincroniza los pedidos asignados. Requiere permisos de administrador.
 *     tags:
 *       - Rutas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador de la ruta que se actualizará.
 *         schema:
 *           type: string
 *         example: "1729000000000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Ruta Chapinero Norte
 *               zona:
 *                 type: string
 *                 example: Chapinero
 *               conductor:
 *                 type: string
 *                 example: Carlos Sierra
 *               pedidos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - BK-201
 *                   - BK-202
 *               cantidadPedidos:
 *                 type: integer
 *                 example: 2
 *               estado:
 *                 type: string
 *                 enum:
 *                   - Pendiente
 *                   - En ruta
 *                   - Entregada
 *                   - Cancelada
 *                 example: En ruta
 *               fechaActualizacion:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '200':
 *         description: Ruta actualizada correctamente.
 *       '400':
 *         description: Los campos, el estado o los pedidos enviados no son válidos.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: La ruta no existe.
 *       '409':
 *         description: Nombre duplicado o pedidos asignados a otra ruta.
 *       '500':
 *         description: No fue posible actualizar la ruta.
 */

app.patch(
  '/api/rutas/:id',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.rutas = db.rutas || [];
      db.pedidos = db.pedidos || [];

      const ruta = db.rutas.find(
        (item) => String(item.id) === String(req.params.id)
      );

      if (!ruta) {
        return res.status(404).json({
          error: 'La ruta no existe.',
        });
      }

      const cambios = req.body || {};
      const camposPermitidos = [
        'nombre',
        'zona',
        'conductor',
        'pedidos',
        'cantidadPedidos',
        'estado',
        'fechaActualizacion',
      ];

      const camposRecibidos = Object.keys(cambios);
      const camposInvalidos = camposRecibidos.filter(
        (campo) => !camposPermitidos.includes(campo)
      );

      if (camposInvalidos.length > 0 || camposRecibidos.length === 0) {
        return res.status(400).json({
          error: 'Los campos enviados no son válidos.',
        });
      }

      const rutaAnterior = { ...ruta };
      const pedidosAnteriores = Array.isArray(ruta.pedidos)
        ? ruta.pedidos.map(String)
        : db.pedidos
            .filter(
              (pedido) =>
                String(pedido.ruta || '').trim().toLowerCase() ===
                String(ruta.nombre || '').trim().toLowerCase()
            )
            .map((pedido) => String(pedido.id));

      const nombreNuevo = cambios.nombre ?? ruta.nombre;
      const conductorNuevo = cambios.conductor ?? ruta.conductor;
      const zonaNueva = cambios.zona ?? ruta.zona;
      const estadoNuevo = cambios.estado ?? ruta.estado;
      const pedidosNuevos = cambios.pedidos ?? pedidosAnteriores;

      if (
        typeof nombreNuevo !== 'string' ||
        !nombreNuevo.trim() ||
        typeof conductorNuevo !== 'string' ||
        !conductorNuevo.trim() ||
        typeof zonaNueva !== 'string' ||
        !zonaNueva.trim() ||
        !Array.isArray(pedidosNuevos)
      ) {
        return res.status(400).json({
          error: 'Nombre, zona, conductor y pedidos deben ser válidos.',
        });
      }

      if (
        !['Pendiente', 'En ruta', 'Entregada', 'Cancelada'].includes(
          estadoNuevo
        )
      ) {
        return res.status(400).json({
          error: 'El estado de la ruta no es válido.',
        });
      }

      const nombreDuplicado = db.rutas.some(
        (otra) =>
          String(otra.id) !== String(ruta.id) &&
          String(otra.nombre || '').trim().toLowerCase() ===
            nombreNuevo.trim().toLowerCase()
      );

      if (nombreDuplicado) {
        return res.status(409).json({
          error: 'Ya existe otra ruta con ese nombre.',
        });
      }

      const idsNuevos = pedidosNuevos.map(String);

      if (new Set(idsNuevos).size !== idsNuevos.length) {
        return res.status(400).json({
          error: 'No puedes incluir el mismo pedido más de una vez.',
        });
      }

      const pedidosSeleccionados = idsNuevos.map((id) =>
        db.pedidos.find((pedido) => String(pedido.id) === id)
      );

      if (pedidosSeleccionados.some((pedido) => !pedido)) {
        return res.status(400).json({
          error: 'Uno o más pedidos seleccionados no existen.',
        });
      }

      const pedidosOcupados = pedidosSeleccionados.some((pedido) => {
        const asignadoAOtraRuta =
          pedido.ruta &&
          pedido.ruta.trim().toLowerCase() !== 'sin asignar' &&
          !pedidosAnteriores.includes(String(pedido.id));

        return asignadoAOtraRuta;
      });

      if (pedidosOcupados) {
        return res.status(409).json({
          error: 'Uno o más pedidos ya pertenecen a otra ruta.',
        });
      }

      const fechaActual = new Date().toISOString();

      for (const id of pedidosAnteriores) {
        if (!idsNuevos.includes(id)) {
          const pedido = db.pedidos.find(
            (item) => String(item.id) === id
          );

          if (pedido) {
            pedido.conductor = 'Sin asignar';
            pedido.ruta = 'Sin asignar';

            if (pedido.estado === 'En ruta') {
              pedido.estado = 'Publicado';
            }
          }
        }
      }

      for (const pedido of pedidosSeleccionados) {
        pedido.conductor = conductorNuevo.trim();
        pedido.ruta = nombreNuevo.trim();
        pedido.estado =
          estadoNuevo === 'Entregada'
            ? 'Entregado'
            : estadoNuevo === 'En ruta'
              ? 'En ruta'
              : estadoNuevo === 'Cancelada'
                ? 'Cancelado'
                : 'Pendiente';
      }

      Object.assign(ruta, {
        nombre: nombreNuevo.trim(),
        zona: zonaNueva.trim(),
        conductor: conductorNuevo.trim(),
        pedidos: idsNuevos,
        cantidadPedidos: idsNuevos.length,
        estado: estadoNuevo,
        fechaActualizacion: fechaActual,
      });

      guardarDB(db);

      return res.status(200).json(ruta);
    } catch (error) {
      console.error('Error actualizando ruta:', error);

      return res.status(500).json({
        error: 'No fue posible actualizar la ruta.',
      });
    }
  }
);

/**
 * @openapi
 * /api/rutas/{id}:
 *   delete:
 *     summary: Eliminar una ruta de entrega
 *     description: Elimina la ruta y libera los pedidos que tenía asignados. Requiere permisos de administrador.
 *     tags:
 *       - Rutas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identificador de la ruta que se eliminará.
 *         schema:
 *           type: string
 *         example: "1729000000000"
 *     responses:
 *       '200':
 *         description: Ruta eliminada y pedidos liberados correctamente.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: La ruta no existe.
 *       '500':
 *         description: No fue posible eliminar la ruta.
 */

app.delete(
  '/api/rutas/:id',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB();
      db.rutas = db.rutas || [];
      db.pedidos = db.pedidos || [];

      const indice = db.rutas.findIndex(
        (item) => String(item.id) === String(req.params.id)
      );

      if (indice === -1) {
        return res.status(404).json({
          error: 'La ruta no existe.',
        });
      }

      const ruta = db.rutas[indice];

      const idsPedidos = Array.isArray(ruta.pedidos)
        ? ruta.pedidos.map(String)
        : db.pedidos
            .filter(
              (pedido) =>
                String(pedido.ruta || '').trim().toLowerCase() ===
                String(ruta.nombre || '').trim().toLowerCase()
            )
            .map((pedido) => String(pedido.id));

      for (const id of idsPedidos) {
        const pedido = db.pedidos.find(
          (item) => String(item.id) === id
        );

        if (pedido) {
          pedido.conductor = 'Sin asignar';
          pedido.ruta = 'Sin asignar';

          if (pedido.estado === 'En ruta') {
            pedido.estado = 'Publicado';
          }
        }
      }

      db.rutas.splice(indice, 1);
      guardarDB(db);

      return res.status(200).json({
        mensaje: 'Ruta eliminada correctamente y pedidos liberados.',
        ruta,
      });
    } catch (error) {
      console.error('Error eliminando ruta:', error);

      return res.status(500).json({
        error: 'No fue posible eliminar la ruta.',
      });
    }
  }
);

/**
 * @openapi
 * /api/solicitudes:
 *   get:
 *     summary: Consultar solicitudes
 *     description: El administrador consulta todas las solicitudes y el cliente únicamente las asociadas a su correo. Requiere autenticación.
 *     tags:
 *       - Solicitudes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Solicitudes consultadas correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties: true
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos para consultar solicitudes.
 *       '500':
 *         description: No fue posible consultar las solicitudes o verificar los permisos.
 */

app.get(
  '/api/solicitudes',
  verificarToken,
  async (req, res) => {
    try {
      const encabezado = req.headers.authorization
      const token = encabezado.slice(7).trim()

      const supabaseUsuario = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const { data: perfil, error } = await supabaseUsuario
        .from('perfiles')
        .select('role')
        .eq('id', req.usuario.id)
        .maybeSingle()

      if (error) {
        return res.status(500).json({
          error: 'No fue posible verificar los permisos.',
        })
      }

      const rol = String(perfil?.role || '')
        .trim()
        .toLowerCase()

      if (!['administrador', 'cliente'].includes(rol)) {
        return res.status(403).json({
          error: 'No tienes permisos para consultar solicitudes.',
        })
      }

      const db = leerDB()
      const solicitudes = db.solicitudes || []

      if (rol === 'administrador') {
        return res.status(200).json(solicitudes)
      }

      const correo = String(req.usuario.email || '')
        .trim()
        .toLowerCase()

      return res.status(200).json(
        solicitudes.filter(
          solicitud =>
            String(solicitud.clienteEmail || '')
              .trim()
              .toLowerCase() === correo
        )
      )
    } catch (error) {
      console.error('Error consultando solicitudes:', error)

      return res.status(500).json({
        error: 'No fue posible cargar las solicitudes.',
      })
    }
  }
)

/**
 * @openapi
 * /api/solicitudes:
 *   post:
 *     summary: Registrar una solicitud
 *     description: Permite a un cliente autenticado solicitar productos. El correo debe coincidir con la sesión y los precios y totales se calculan desde los productos registrados.
 *     tags:
 *       - Solicitudes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cliente
 *               - clienteEmail
 *               - direccion
 *               - items
 *               - cantidadTotal
 *             properties:
 *               cliente:
 *                 type: string
 *                 example: Supermercado Central
 *               clienteEmail:
 *                 type: string
 *                 format: email
 *                 example: cliente@ejemplo.com
 *               direccion:
 *                 type: string
 *                 example: Calle 80 # 20-15, Bogotá
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productoId
 *                     - cantidad
 *                   properties:
 *                     productoId:
 *                       type: string
 *                       example: PROD-001
 *                     cantidad:
 *                       type: integer
 *                       minimum: 1
 *                       example: 3
 *               cantidadTotal:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *               total:
 *                 type: number
 *                 description: El servidor calcula el total con los precios registrados.
 *                 example: 38700
 *               observacion:
 *                 type: string
 *                 example: Entregar en horario de la mañana.
 *     responses:
 *       '201':
 *         description: Solicitud registrada correctamente.
 *       '400':
 *         description: Datos incompletos, productos inexistentes, cantidades inválidas o precios incorrectos.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no es cliente o el correo no coincide con la sesión.
 *       '500':
 *         description: No fue posible registrar la solicitud.
 */

app.post(
  '/api/solicitudes',
  verificarToken,
  verificarRol('cliente'),
  (req, res) => {
    try {
      const {
        cliente,
        clienteEmail,
        direccion,
        items,
        cantidadTotal,
        total,
        observacion,
      } = req.body || {}

      const correoAutenticado = String(req.usuario.email || '')
        .trim()
        .toLowerCase()

      if (
        typeof cliente !== 'string' ||
        !cliente.trim() ||
        typeof direccion !== 'string' ||
        !direccion.trim() ||
        !Array.isArray(items) ||
        items.length === 0 ||
        !Number.isFinite(Number(cantidadTotal)) ||
        Number(cantidadTotal) <= 0
      ) {
        return res.status(400).json({
          error: 'Los datos de la solicitud están incompletos.',
        })
      }

      if (
        !correoAutenticado ||
        String(clienteEmail || '').trim().toLowerCase() !==
          correoAutenticado
      ) {
        return res.status(403).json({
          error: 'El correo de la solicitud no coincide con tu sesión.',
        })
      }

      const db = leerDB()
      db.solicitudes = db.solicitudes || []
      db.productos = db.productos || []

      const itemsValidados = []

      for (const item of items) {
        const producto = db.productos.find(
          producto =>
            String(producto.id) === String(item.productoId)
        )

        const cantidad = Number(item.cantidad)

        if (
          !producto ||
          !Number.isInteger(cantidad) ||
          cantidad <= 0
        ) {
          return res.status(400).json({
            error: 'Hay productos o cantidades inválidos en la solicitud.',
          })
        }

        const precioUnitario = Number(producto.precio)

        if (
          !Number.isFinite(precioUnitario) ||
          precioUnitario < 0
        ) {
          return res.status(400).json({
            error: 'Uno de los productos tiene un precio inválido.',
          })
        }

        itemsValidados.push({
          productoId: producto.id,
          producto: producto.nombre,
          cantidad,
          precioUnitario,
          subtotal: cantidad * precioUnitario,
        })
      }

      const cantidadCalculada = itemsValidados.reduce(
        (suma, item) => suma + item.cantidad,
        0
      )

      const totalCalculado = itemsValidados.reduce(
        (suma, item) => suma + item.subtotal,
        0
      )

      const solicitud = {
        id: `SOL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fecha: new Date().toISOString(),
        cliente: cliente.trim(),
        clienteEmail: correoAutenticado,
        direccion: direccion.trim(),
        items: itemsValidados,
        cantidadTotal: cantidadCalculada,
        total: totalCalculado,
        estado: 'Pendiente',
        observacion:
          typeof observacion === 'string'
            ? observacion
            : 'Solicitud enviada por el cliente.',
        pedidoId: null,
      }

      db.solicitudes.push(solicitud)
      guardarDB(db)

      return res.status(201).json(solicitud)
    } catch (error) {
      console.error('Error creando solicitud:', error)

      return res.status(500).json({
        error: 'No fue posible registrar la solicitud.',
      })
    }
  }
)

/**
 * @openapi
 * /api/solicitudes/{id}/aprobar:
 *   post:
 *     summary: Aprobar una solicitud
 *     description: Permite al administrador aprobar una solicitud pendiente, generar los pedidos correspondientes y registrar las salidas de inventario. Verifica que los productos existan y que haya stock suficiente.
 *     tags:
 *       - Solicitudes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador de la solicitud que se aprobará.
 *         schema:
 *           type: string
 *         example: SOL-1725300000000-123
 *     responses:
 *       '200':
 *         description: Solicitud aprobada, pedidos generados e inventario actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Solicitud aprobada correctamente.
 *                 solicitud:
 *                   type: object
 *                   description: Solicitud actualizada con estado Aprobada y los identificadores de los pedidos.
 *                   additionalProperties: true
 *                 pedidos:
 *                   type: array
 *                   description: Pedidos generados a partir de la solicitud.
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *       '400':
 *         description: La solicitud no contiene productos válidos o hay cantidades o precios incorrectos.
 *       '401':
 *         description: Token ausente o inválido.
 *       '403':
 *         description: El usuario no tiene permisos de administrador.
 *       '404':
 *         description: La solicitud o uno de sus productos no existe.
 *       '409':
 *         description: La solicitud ya fue procesada o no hay stock suficiente.
 *       '500':
 *         description: Error interno al aprobar la solicitud o stock inválido.
 */

app.post(
  '/api/solicitudes/:id/aprobar',
  verificarToken,
  verificarRol('administrador'),
  (req, res) => {
    try {
      const db = leerDB()

      db.solicitudes = db.solicitudes || []
      db.pedidos = db.pedidos || []
      db.productos = db.productos || []
      db.inventario = db.inventario || []

      const solicitud = db.solicitudes.find(
        item => String(item.id) === String(req.params.id)
      )

      if (!solicitud) {
        return res.status(404).json({
          error: 'La solicitud no existe.'
        })
      }

      if (solicitud.estado !== 'Pendiente' || solicitud.pedidoId) {
        return res.status(409).json({
          error: 'La solicitud ya fue procesada.',
          estado: solicitud.estado,
          pedidoId: solicitud.pedidoId || null,
          pedidoIds: solicitud.pedidoIds || []
        })
      }

      if (!Array.isArray(solicitud.items) || solicitud.items.length === 0) {
        return res.status(400).json({
          error: 'La solicitud no contiene productos.'
        })
      }

      const itemsValidados = []
      const cantidadesPorProducto = new Map()

      for (const item of solicitud.items) {
        const producto = db.productos.find(
          producto => String(producto.id) === String(item.productoId)
        )

        const cantidad = Number(item.cantidad)

        if (!producto) {
          return res.status(400).json({
            error: `El producto ${item.productoId} ya no existe.`
          })
        }

        if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
          return res.status(400).json({
            error: 'La solicitud contiene una cantidad no valida.'
          })
        }

        const stock = Number(producto.stock)
        const precio = Number(item.precioUnitario)

        if (!Number.isSafeInteger(stock) || stock < 0) {
          return res.status(500).json({
            error: `El stock de ${producto.nombre} no es valido.`
          })
        }

        if (!Number.isFinite(precio) || precio < 0) {
          return res.status(400).json({
            error: `El precio solicitado para ${producto.nombre} no es valido.`
          })
        }

        cantidadesPorProducto.set(
          String(producto.id),
          (cantidadesPorProducto.get(String(producto.id)) || 0) + cantidad
        )

        itemsValidados.push({
          producto,
          cantidad,
          precio,
          subtotal: precio * cantidad
        })
      }

      for (const [productoId, cantidadNecesaria] of cantidadesPorProducto) {
        const producto = db.productos.find(
          item => String(item.id) === productoId
        )

        if (cantidadNecesaria > Number(producto.stock)) {
          return res.status(409).json({
            error: `Stock insuficiente para ${producto.nombre}.`,
            stockDisponible: Number(producto.stock),
            cantidadSolicitada: cantidadNecesaria
          })
        }
      }

      const fechaActual = new Date()
      const fechaISO = fechaActual.toISOString()
      const fechaPedido = fechaISO.slice(0, 10)
      const baseId = Date.now()

      const nuevosPedidos = []
      const nuevosMovimientos = []
      const stockTemporal = new Map()

      for (const [productoId] of cantidadesPorProducto) {
        const producto = db.productos.find(
          item => String(item.id) === productoId
        )

        stockTemporal.set(productoId, Number(producto.stock))
      }

      for (let i = 0; i < itemsValidados.length; i++) {
        const item = itemsValidados[i]
        const producto = item.producto
        const productoId = String(producto.id)

        const stockAnterior = stockTemporal.get(productoId)
        const stockNuevo = stockAnterior - item.cantidad
        const total = item.subtotal

        if (!Number.isFinite(total)) {
          return res.status(400).json({
            error: 'No fue posible calcular el total de un pedido.'
          })
        }

        const idPedido = `PED-${baseId}-${i + 1}`

        nuevosPedidos.push({
          id: idPedido,
          fecha: fechaPedido,
          cliente: solicitud.cliente,
          direccion: solicitud.direccion,
          productoId: producto.id,
          producto: producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: total,
          total,
          estado: 'Pendiente',
          conductor: 'Sin asignar',
          ruta: 'Sin asignar',
          solicitudId: solicitud.id
        })

        nuevosMovimientos.push({
          id: `INV-${baseId}-${i + 1}`,
          productoId: producto.id,
          producto: producto.nombre,
          tipo: 'salida',
          cantidad: item.cantidad,
          stockAnterior,
          stockNuevo,
          motivo: `Solicitud ${solicitud.id} - Pedido ${idPedido}`,
          fecha: fechaISO
        })

        stockTemporal.set(productoId, stockNuevo)
      }

      for (const [productoId, stockNuevo] of stockTemporal) {
        const producto = db.productos.find(
          item => String(item.id) === productoId
        )

        producto.stock = stockNuevo
      }

      db.pedidos.push(...nuevosPedidos)
      db.inventario.push(...nuevosMovimientos)

      solicitud.estado = 'Aprobada'
      solicitud.pedidoIds = nuevosPedidos.map(pedido => pedido.id)
      solicitud.pedidoId = nuevosPedidos[0].id
      solicitud.fechaAprobacion = fechaISO

      guardarDB(db)

      return res.status(200).json({
        mensaje: 'Solicitud aprobada correctamente.',
        solicitud,
        pedidos: nuevosPedidos
      })
    } catch (error) {
      console.error('Error aprobando solicitud:', error)

      return res.status(500).json({
        error: 'No fue posible aprobar la solicitud.'
      })
    }
  }
)

app.listen(PORT, () => {
  console.log(`API BulkWay ejecutándose en http://localhost:${PORT}`)
})