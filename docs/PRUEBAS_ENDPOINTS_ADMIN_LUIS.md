# Informe de pruebas de endpoints administrativos — BulkWay

## 1. Información general

| Campo | Descripción |
|---|---|
| Proyecto | BulkWay |
| Responsable de las pruebas | Luis Ospina |
| Programa de formación | Análisis y Desarrollo de Software (ADSO) — SENA |
| Rama de trabajo | `feature/api-admin-luis` |
| Fecha de actualización | 28 de octubre de 2026 |
| Backend | Node.js y Express |
| Fuente de datos operativos | `db.json` |
| Autenticación y roles | Supabase |
| Servidor de desarrollo adicional | JSON Server, puerto 3001 |
| API Express local | Puerto 3000 |
| Estado general | Pruebas funcionales realizadas; quedan verificaciones de seguridad e incidencias por documentar |

## 2. Objetivo

Verificar el funcionamiento de los endpoints administrativos de BulkWay relacionados con productos, inventario y pedidos, revisando el comportamiento de las operaciones de consulta, creación, actualización y eliminación cuando corresponda.

También se busca comprobar el manejo de solicitudes inválidas, la respuesta ante recursos inexistentes y los controles de autenticación y autorización implementados en el backend.

El propósito es identificar errores funcionales, reducir solicitudes con datos inválidos y mantener una separación adecuada entre las operaciones disponibles para los clientes y aquellas reservadas para los administradores.

## 3. Alcance

Las pruebas contemplan los siguientes módulos:

- **Productos:** consulta, creación, actualización y eliminación.
- **Inventario:** consulta y movimientos de existencias.
- **Pedidos:** consulta, creación y actualización.
- **Seguridad:** autenticación mediante token y control de permisos administrativos.
- **Manejo de errores:** validación de solicitudes y respuestas ante situaciones excepcionales.

También se documentan las observaciones realizadas durante las pruebas de la interfaz web, especialmente en el flujo de solicitudes de clientes, aprobación administrativa y gestión de rutas.

No se contempla en esta fase una migración completa de los datos operativos a otra base de datos ni la resolución definitiva del problema de acceso desde dispositivos móviles.

## 4. Arquitectura utilizada para las pruebas

BulkWay utiliza una arquitectura híbrida durante su desarrollo:

- **Frontend:** aplicación web desarrollada con React y Vite.
- **Backend:** servidor Node.js con Express que expone endpoints REST.
- **Autenticación:** Supabase Auth.
- **Perfiles y roles:** información consultada desde la tabla `perfiles` de Supabase.
- **Datos operativos:** archivo `db.json` para los módulos que utilizan esta fuente.
- **JSON Server:** servicio utilizado por algunas solicitudes del frontend, disponible localmente en el puerto 3001.
- **Express:** API disponible localmente en el puerto 3000.

La autenticación y la autorización son controles diferentes. La autenticación permite identificar al usuario; la autorización determina si ese usuario tiene permiso para ejecutar una operación.

Las pruebas deben realizarse en el entorno local o de pruebas autorizado, evitando modificar información real innecesariamente.

### 4.1. Inicio de los servicios locales

Para ejecutar el proyecto durante las pruebas, se utilizan las terminales de Git Bash.

Frontend:

```bash
npm run dev
```

JSON Server:

```bash
npm run server
```

API Express:

```bash
npm run start:api
```

Las direcciones locales utilizadas son:

- Frontend: `http://localhost:5173/`
- JSON Server: `http://localhost:3001/`
- API Express: `http://localhost:3000/api`
- Documentación Swagger: `http://localhost:3000/api-docs/`

Los servicios deben estar ejecutándose según las dependencias de cada módulo. En particular, se identificó que el formulario de creación de pedidos necesita que JSON Server esté iniciado para cargar las opciones de clientes y productos cuando utiliza ese servicio.

## 5. Criterios de evaluación

Para interpretar los resultados de las pruebas se utilizan los siguientes criterios:

| Código HTTP | Interpretación |
|---|---|
| `200 OK` | La solicitud se procesó correctamente. |
| `201 Created` | Se creó un recurso correctamente, cuando corresponda. |
| `400 Bad Request` | La solicitud contiene datos inválidos o no cumple las validaciones. |
| `401 Unauthorized` | Falta la autenticación o el token no es válido. |
| `403 Forbidden` | El usuario está autenticado, pero no tiene permisos suficientes. |
| `404 Not Found` | El recurso solicitado no existe. |
| `500 Internal Server Error` | Se produjo un error interno del servidor. |

El código esperado depende del método HTTP, la ruta y las reglas de negocio implementadas. Por ello, no se debe asumir que todas las operaciones exitosas necesariamente devuelven el mismo código.

## 6. Convenciones para registrar resultados

Se utilizan los siguientes estados:

- **Aprobada:** existe evidencia suficiente de que la prueba cumplió el resultado esperado.
- **Fallida:** la prueba se ejecutó y el resultado obtenido no cumplió el esperado.
- **Pendiente:** la prueba todavía no se ha ejecutado o no existe evidencia suficiente para cerrarla.
- **Reportada por el equipo:** otro integrante informó que realizó la comprobación, pero no se dispone aquí de evidencia directa para verificar el resultado.

Las pruebas funcionales de interfaz y las pruebas HTTP directas se registran por separado cuando corresponda. Que una operación funcione desde la página no demuestra automáticamente que todas las validaciones de la API hayan sido verificadas.

# 7. Matriz de pruebas

## 7.1. Productos

| ID | Prueba | Resultado esperado | Resultado conocido | Estado |
|---|---|---|---|---|
| P-01 | Consultar el listado de productos | La API devuelve el listado de productos disponibles. | Se consultó el endpoint y se obtuvieron seis productos. | Aprobada |
| P-02 | Consultar un producto existente | La API devuelve los datos del producto solicitado. | La consulta de `PROD-001` devolvió los detalles del producto. | Aprobada |
| P-03 | Consultar un producto inexistente | La API responde `404 Not Found`. | La consulta de `NO-EXISTE` devolvió `404` y el mensaje `Producto no encontrado`. | Aprobada |
| P-04 | Crear un producto con datos válidos como administrador | El producto se crea y devuelve una respuesta exitosa. | La creación de productos funcionó desde la interfaz. No se adjunta aquí evidencia HTTP directa de esta prueba administrativa. | Aprobada funcionalmente |
| P-05 | Crear un producto con datos inválidos | La API rechaza los datos y devuelve un error de validación. | La prueba inicial sin autenticación devolvió `401`; por ello, no permitió comprobar la validación de datos. | Pendiente de verificación HTTP |
| P-06 | Actualizar un producto enviando un cuerpo vacío | La API rechaza la solicitud con `400 Bad Request`. | La edición desde la interfaz funcionó; no se dispone de una respuesta HTTP directa para el cuerpo vacío. | Pendiente de evidencia HTTP |
| P-07 | Actualizar un producto con un campo no permitido | La API rechaza el campo no autorizado. | No se dispone aquí de evidencia directa de esta prueba. | Pendiente de evidencia HTTP |
| P-08 | Actualizar un producto inexistente | La API responde `404 Not Found`. | No se dispone aquí de evidencia directa de esta prueba. | Pendiente de evidencia HTTP |
| P-09 | Eliminar un producto inexistente | La API responde `404 Not Found`. | La eliminación de productos funcionó desde la interfaz para las operaciones realizadas; no se dispone de evidencia HTTP de este caso específico. | Pendiente de evidencia HTTP |

### Observaciones del módulo de productos

Durante las pruebas funcionales se verificó que el catálogo mostrara seis productos con su información principal, incluidos nombre, categoría, presentación, existencias y precio.

También se comprobó desde la interfaz que las operaciones de creación, edición y eliminación funcionaban y que los cambios se reflejaban en `db.json`.

Las pruebas de validación específicas de la API deben considerarse verificadas individualmente solo cuando se haya registrado su solicitud y respuesta HTTP.

## 7.2. Inventario

| ID | Prueba | Resultado esperado | Resultado conocido | Estado |
|---|---|---|---|---|
| I-01 | Consultar el inventario con permisos administrativos | La API devuelve la información de inventario autorizada. | Módulo reportado como probado funcionalmente. | Aprobada según las pruebas realizadas |
| I-02 | Registrar una entrada de inventario válida | La operación se procesa y actualiza las existencias según las reglas del sistema. | Módulo reportado como probado funcionalmente. No se adjunta evidencia HTTP individual. | Aprobada según las pruebas realizadas |
| I-03 | Registrar un movimiento con tipo, cantidad o motivo inválido | La API rechaza la solicitud con un error de validación. | No se dispone aquí de evidencia HTTP individual. | Pendiente de evidencia específica |
| I-04 | Registrar un movimiento para un producto inexistente | La API responde `404 Not Found`. | No se dispone aquí de evidencia HTTP individual. | Pendiente de evidencia específica |
| I-05 | Registrar una salida superior a las existencias disponibles | La API rechaza la operación y evita existencias negativas. | No se dispone aquí de evidencia HTTP individual. | Pendiente de evidencia específica |

### Observaciones del módulo de inventario

El módulo se mantiene dentro del alcance administrativo de las pruebas. La comprobación de cada validación específica debe registrarse con el resultado observado para evitar confundir el funcionamiento general del módulo con la validación de todos los casos límite.

No se deben provocar movimientos sobre datos reales sin autorización. Para las pruebas de movimientos de entrada y salida se recomienda utilizar datos de prueba o una copia de seguridad de `db.json`.

## 7.3. Pedidos

| ID | Prueba | Resultado esperado | Resultado conocido | Estado |
|---|---|---|---|---|
| A-01 | Consultar el listado de pedidos como administrador | La interfaz o API muestra los pedidos disponibles para el usuario autorizado. | La consulta de pedidos funciona desde la interfaz administrativa. | Aprobada funcionalmente |
| A-02 | Consultar un pedido existente | Se devuelven los datos del pedido solicitado. | La consulta de pedidos funciona desde la interfaz. | Aprobada funcionalmente |
| A-03 | Consultar un pedido inexistente | La API responde `404 Not Found`. | No se dispone aquí de evidencia HTTP directa de este caso. | Pendiente de evidencia específica |
| A-04 | Actualizar un pedido existente con un campo permitido | La actualización se procesa correctamente y se conservan los demás datos. | La actualización de pedidos se comprobó desde la interfaz administrativa. | Aprobada funcionalmente |
| A-05 | Actualizar un pedido con un cuerpo vacío o campos no permitidos | La API rechaza la solicitud con un error de validación. | No se dispone aquí de evidencia HTTP directa de este caso. | Pendiente de evidencia específica |

### Observaciones del módulo de pedidos

Se comprobó que el administrador puede consultar, crear y actualizar pedidos desde la interfaz de BulkWay.

Durante la revisión se identificó que las opciones de clientes y productos del formulario de creación no aparecían cuando JSON Server no estaba iniciado. El inconveniente se resolvió al ejecutar:

```bash
npm run server
```

Esto permitió cargar las opciones requeridas por el formulario. El problema correspondía a un servicio local que no estaba en ejecución y no demuestra por sí mismo un fallo de la lógica de pedidos.

### Flujo de solicitudes de clientes

Se observó que un cliente puede crear una solicitud de pedido que queda pendiente de revisión administrativa.

En el panel de administración se muestran las solicitudes recibidas, los productos, las cantidades y los importes correspondientes. El administrador puede abrir la ventana de confirmación para decidir si aprueba o rechaza la solicitud.

Al aprobar una solicitud, el sistema puede generar el pedido correspondiente. La solicitud observada con identificador `SOL-1793224966037-170` permaneció pendiente durante las comprobaciones descritas.

No se modificó esa solicitud únicamente para realizar pruebas de seguridad.

### Gestión de rutas

Se comprobó en la interfaz la disponibilidad del formulario para crear una ruta, seleccionar un pedido, completar los campos solicitados y elegir un estado.

Los estados observados son:

- Pendiente.
- En ruta.
- Entregada.
- Cancelada.

La existencia de estas opciones permite describir el flujo visible de gestión de rutas. No constituye, por sí sola, evidencia de que la asignación automática de conductores después de aprobar una solicitud funcione en todos los casos.

## 7.4. Seguridad

| ID | Prueba | Resultado esperado | Resultado conocido | Estado |
|---|---|---|---|---|
| S-01 | Consultar pedidos sin enviar token de acceso | La API responde `401 Unauthorized`. | Se ejecutó `GET /api/pedidos` sin token y se recibió `401`. | Aprobada |
| S-02 | Acceder a una ruta administrativa con un token válido de un usuario sin rol administrador | La API responde `403 Forbidden`. | Se observó que la interfaz de cliente no presenta las opciones administrativas. La comprobación directa del código HTTP no está documentada aquí. | Pendiente de evidencia directa |
| S-03 | Acceder a una ruta administrativa con un token válido de administrador | La API permite la operación cuando el usuario tiene el rol requerido. | El integrante encargado del backend informó que realizó la comprobación. No se adjunta aquí la respuesta HTTP. | Reportada por el equipo |

### Evidencia de la prueba S-01

Solicitud ejecutada:

```bash
curl -i http://localhost:3000/api/pedidos
```

Respuesta observada:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
```

Cuerpo de la respuesta:

```json
{
  "error": "Se requiere un token de acceso"
}
```

**Interpretación:** el endpoint rechazó una solicitud que no incluía un token de acceso. Esto confirma el comportamiento esperado para ese caso de autenticación.

### Verificación de roles

La aplicación utiliza Supabase para autenticar a los usuarios y consultar sus perfiles y roles. En las rutas protegidas, el backend debe comprobar que el usuario autenticado tiene los permisos necesarios.

Para cerrar S-02 con evidencia directa se debe realizar una solicitud a una ruta administrativa utilizando un token válido de un usuario con rol `cliente`. El resultado esperado es `403 Forbidden`, siempre que la ruta exija el rol de administrador y el token sea válido.

Para cerrar S-03 con evidencia directa se debe realizar la misma clase de solicitud con un token válido de administrador autorizado y registrar la respuesta recibida.

Los tokens, contraseñas y claves privadas no deben incorporarse a este documento ni compartirse en capturas o registros públicos.

## 7.5. Manejo de errores

| ID | Prueba | Resultado esperado | Resultado conocido | Estado |
|---|---|---|---|---|
| E-01 | Provocar de forma controlada un error interno en un entorno de pruebas | El servidor devuelve `500 Internal Server Error` y una respuesta controlada, sin exponer información sensible. | No se dispone de evidencia de ejecución de esta prueba. | Pendiente |

Esta prueba no debe realizarse provocando fallos intencionales en un entorno productivo ni dañando los datos operativos. Se recomienda utilizar un entorno aislado o una condición de prueba controlada.

# 8. Incidencia adicional: acceso desde dispositivos móviles

Durante las comprobaciones del equipo se reportó una dificultad para acceder al sistema desde un celular, mientras que desde un equipo de escritorio se puede abrir y utilizar la aplicación.

**Estado:** pendiente de diagnóstico.

La incidencia se abordará en una etapa posterior, antes de la presentación trimestral, mediante la revisión de:

1. Las direcciones base que utiliza el frontend para conectarse a la API.
2. La disponibilidad del backend desde una red externa.
3. La configuración de CORS.
4. Las variables de entorno del frontend desplegado.
5. La conexión entre el frontend y el backend desde el navegador móvil.

Esta incidencia no debe registrarse como una falla de todas las funciones de la API, dado que las operaciones comprobadas desde PC han funcionado.

# 9. Recomendaciones

1. Mantener separadas las pruebas de interfaz y las pruebas HTTP directas.
2. Registrar los códigos HTTP reales de las pruebas que aún no cuentan con evidencia.
3. Conservar una copia de seguridad de `db.json` antes de realizar pruebas que creen, modifiquen o eliminen registros.
4. No utilizar contraseñas, tokens ni claves privadas en el documento de pruebas.
5. Verificar que las rutas administrativas comprueben tanto la autenticación como el rol del usuario.
6. No considerar una prueba aprobada únicamente porque la interfaz oculte una opción a determinado rol.
7. Mantener la incidencia de acceso desde celular como una actividad pendiente de diagnóstico.
8. No realizar cambios de arquitectura ni migraciones de datos dentro de esta fase de pruebas sin revisar previamente su impacto.
9. Conservar las evidencias de las pruebas realizadas por otros integrantes cuando estén disponibles.

# 10. Conclusión

Las pruebas funcionales realizadas en BulkWay permitieron comprobar desde la interfaz de escritorio las operaciones de gestión de productos y pedidos, así como el flujo de solicitudes de clientes y las opciones visibles para la gestión de rutas.

En la API se verificó directamente que una solicitud a `GET /api/pedidos` sin token devuelve `401 Unauthorized` y un mensaje que indica que se requiere un token de acceso.

El acceso administrativo a la API fue reportado como probado por el integrante encargado del backend. La comprobación de rechazo de usuarios sin permisos administrativos requiere conservar evidencia directa de la respuesta HTTP para cerrar completamente esa prueba.

Se mantiene pendiente el diagnóstico de acceso desde dispositivos móviles y la obtención de evidencia para los casos específicos de validación que todavía no cuentan con una respuesta HTTP registrada.

Este documento representa el estado de las pruebas con base en la información disponible al 28 de octubre de 2026. Los estados deben actualizarse conforme se realicen nuevas verificaciones y se incorporen sus evidencias.

---

**Fin del documento.**