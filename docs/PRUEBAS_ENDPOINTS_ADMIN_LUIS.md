# Revisión de endpoints administrativos — BulkWay

**Responsable:** Luis  
**Rama de trabajo:** `feature/api-admin-luis`  
**Alcance:** productos, inventario y pedidos  
**Backend:** Node.js + Express  
**Fuente operativa actual:** `db.json`  
**Autorización:** token Bearer de Supabase y rol `administrador`

## Objetivo

Revisar las validaciones de entrada y las respuestas de la API para reducir solicitudes inválidas y asegurar que las rutas administrativas rechacen usuarios sin permisos. Los cambios de este trabajo son acotados y no migran la persistencia desde `db.json`.

## Cambios realizados

1. **Consulta de producto por ID:** la comparación del identificador convierte ambos valores a texto, evitando diferencias por tipo entre el parámetro de ruta y el identificador guardado.
2. **Consulta de pedido por ID:** aplica la misma comparación consistente de identificadores.
3. **Creación de producto:** si se envían `categoria` o `presentacion`, deben ser cadenas de texto; los demás campos mantienen las validaciones de nombre, stock y precio.
4. **Actualización de producto:** rechaza cuerpos que no sean objetos JSON, cuerpos vacíos y campos no permitidos. Solo acepta `nombre`, `categoria`, `presentacion`, `stock` y `precio`.
5. **Integridad del inventario:** el registro de movimientos valida el identificador del producto y conserva la comprobación de stock entero, no negativo y suficiente para salidas.
6. **Respuestas:** las solicitudes inválidas responden con HTTP `400`, los recursos inexistentes con `404`, y los errores internos con `500`. Las operaciones de inventario y productos siguen protegidas para el rol administrador cuando corresponde.

## Matriz de pruebas

> La matriz define pruebas reproducibles. No se deben marcar como ejecutadas hasta probarlas en el entorno con un token válido y una copia de datos de prueba.

| ID | Endpoint / escenario | Resultado esperado |
|---|---|---|
| P-01 | `GET /api/productos` | `200`; devuelve una lista JSON. La ruta de listado es pública en la implementación revisada. |
| P-02 | `GET /api/productos/PROD-001` | `200`; devuelve el producto existente. |
| P-03 | `GET /api/productos/NO-EXISTE` | `404`; mensaje de producto no encontrado. |
| P-04 | `POST /api/productos` con nombre, stock entero no negativo y precio válido, usando administrador | `201`; devuelve el producto creado. Ejecutar solo con datos de prueba. |
| P-05 | `POST /api/productos` con nombre vacío, stock negativo/no entero o precio negativo/no numérico | `400`; no debe crear producto. |
| P-06 | `PATCH /api/productos/PROD-001` con `{}` | `400`; solicita al menos un campo. |
| P-07 | `PATCH /api/productos/PROD-001` con un campo no permitido, por ejemplo `{"id":"otro"}` | `400`; rechaza campos no permitidos. |
| P-08 | `PATCH /api/productos/NO-EXISTE` con datos válidos | `404`; el producto no existe. |
| P-09 | `DELETE /api/productos/NO-EXISTE` con administrador | `404`; no elimina registros. |
| I-01 | `GET /api/inventario` con administrador | `200`; devuelve una lista JSON. |
| I-02 | `POST /api/inventario` con producto existente, tipo `entrada`, cantidad entera positiva y motivo | `201`; registra movimiento y devuelve el stock restante. Ejecutar en datos de prueba. |
| I-03 | `POST /api/inventario` con tipo diferente de `entrada`/`salida`, cantidad cero/negativa/no entera o motivo vacío | `400`; no registra movimiento. |
| I-04 | `POST /api/inventario` con producto inexistente | `404`; no registra movimiento. |
| I-05 | `POST /api/inventario` con una salida mayor al stock disponible | `400`; informa stock insuficiente y no permite stock negativo. |
| A-01 | `GET /api/pedidos` con administrador | `200`; devuelve una lista JSON. |
| A-02 | `GET /api/pedidos/BK-201` con administrador | `200`; devuelve el pedido existente. |
| A-03 | `GET /api/pedidos/NO-EXISTE` con administrador | `404`; informa que el pedido no existe. |
| A-04 | `PATCH /api/pedidos/BK-201` con campo permitido, por ejemplo `{"estado":"En ruta"}` | `200`; devuelve el pedido actualizado. Ejecutar con datos de prueba. |
| A-05 | `PATCH /api/pedidos/BK-201` con `{}` o campo no permitido | `400`; no debe modificar el pedido. |
| S-01 | Llamar a `GET /api/inventario` sin token | `401`; requiere autenticación. |
| S-02 | Llamar a una ruta administrativa con token de un rol distinto de administrador | `403`; no autoriza la operación. |
| E-01 | Provocar un error controlado de lectura/escritura en el entorno de pruebas | `500`; respuesta genérica sin exponer detalles internos. No probar dañando datos de producción. |

## Cómo ejecutar las pruebas

1. Iniciar el backend en el entorno local configurado y comprobar `GET /api`.
2. Abrir la documentación Swagger en `/api-docs`.
3. Autorizar la sesión con un token Bearer válido de Supabase para las pruebas protegidas.
4. Usar una copia de `db.json` o datos temporales. No crear, editar ni eliminar registros reales de producción para probar.
5. Registrar por cada caso: fecha, endpoint, cuerpo enviado (sin tokens ni contraseñas), código HTTP, resultado obtenido y estado `Aprobada` / `Fallida`.
6. Repetir los casos de seguridad con una cuenta sin rol de administrador.

## Observaciones y límites conocidos

- La aplicación conserva una arquitectura híbrida: `db.json` sirve como fuente operativa de estos endpoints y Supabase se utiliza para autenticación/perfiles.
- Estas modificaciones no convierten `db.json` en una base de datos administrada ni garantizan persistencia del archivo en el alojamiento remoto.
- El listado `GET /api/productos` y la consulta `GET /api/productos/:id` no llevan middleware de autenticación en el código revisado. Esto puede ser intencional para el catálogo público; el equipo debe confirmarlo según los permisos del negocio.
- La matriz es un plan de pruebas hasta que se ejecute contra el servidor. No afirmar que todas las pruebas pasaron sin registrar los resultados reales.
