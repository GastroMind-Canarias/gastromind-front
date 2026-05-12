# Gastromind — Panel de Administración

> Manual de usuario completo · Versión en español  
> [English version → README.en.md](./README.en.md)

---

## Tabla de contenidos

1. [Introducción](#1-introducción)
2. [Acceso al sistema — Login](#2-acceso-al-sistema--login)
3. [Estructura general de la interfaz](#3-estructura-general-de-la-interfaz)
4. [Dashboard — Inicio](#4-dashboard--inicio)
5. [Usuarios](#5-usuarios)
6. [Hogares](#6-hogares)
7. [Neveras](#7-neveras)
8. [Tickets de compra](#8-tickets-de-compra)
9. [Compras habituales](#9-compras-habituales)
10. [Favoritos](#10-favoritos)
11. [Productos](#11-productos)
12. [Categorías](#12-categorías)
13. [Tiendas](#13-tiendas)
14. [Unidades](#14-unidades)
15. [Métricas del servidor](#15-métricas-del-servidor)
16. [Elementos comunes de la interfaz](#16-elementos-comunes-de-la-interfaz)

---

## 1. Introducción

**Gastromind** es un panel de administración web diseñado para gestionar de forma centralizada todos los recursos del ecosistema Gastromind: usuarios, hogares, neveras inteligentes, productos, tickets de compra, recetas favoritas y métricas del servidor.

La aplicación está orientada exclusivamente a administradores (`ROLE_ADMIN`). Si el usuario autenticado no posee ese rol, el sistema denegará el acceso y redirigirá al login.

### Requisitos para el acceso

- Cuenta de usuario con rol `ROLE_ADMIN`.
- Navegador moderno (Chrome, Firefox, Edge, Safari actualizados).
- Conexión al servidor backend de Gastromind.

---

## 2. Acceso al sistema — Login

### Ruta: `/login`

Al abrir la aplicación por primera vez, o al cerrar sesión, el sistema redirige automáticamente a la página de inicio de sesión.

### Campos del formulario

| Campo | Descripción |
|---|---|
| **Correo electrónico** | Email de la cuenta administradora. |
| **Contraseña** | Contraseña de la cuenta. |

### Proceso de autenticación

1. Introduce tu email y contraseña y pulsa **Iniciar sesión**.
2. El sistema envía las credenciales al servidor y recibe un token JWT.
3. Se verifica que la cuenta tenga el rol `ROLE_ADMIN`. Si no lo tiene, el acceso queda bloqueado con un mensaje de error.
4. Si la autenticación es correcta, el token se guarda en el navegador y se redirige al **Dashboard**.

### Persistencia de sesión

El token de sesión se almacena localmente en el navegador. Esto significa que, al recargar la página, no es necesario volver a iniciar sesión: la aplicación recupera el token automáticamente y restaura la sesión.

### Cierre de sesión

Para cerrar sesión pulsa el botón **Cerrar sesión** situado en la parte inferior de la barra lateral izquierda. El token se elimina del navegador y el sistema redirige al login.

---

## 3. Estructura general de la interfaz

Una vez autenticado, la aplicación presenta una estructura de dos columnas:

```
┌──────────────────┬───────────────────────────────────────┐
│   Barra lateral  │                                       │
│   (Sidebar)      │        Área de contenido              │
│                  │                                       │
│  · Dashboard     │  (Página activa según la ruta)        │
│  · Usuarios      │                                       │
│  · Hogares       │                                       │
│  · Neveras       │                                       │
│  · Tickets       │                                       │
│  · Compras hab.  │                                       │
│  · Favoritos     │                                       │
│  · Productos     │                                       │
│  · Categorías    │                                       │
│  · Tiendas       │                                       │
│  · Unidades      │                                       │
│  · Métricas      │                                       │
│  ─────────────── │                                       │
│  · Cerrar sesión │                                       │
└──────────────────┴───────────────────────────────────────┘
```

### Barra lateral (Sidebar)

- El **elemento activo** se resalta visualmente con el color primario.
- En pantallas pequeñas la barra lateral se colapsa para maximizar el espacio de contenido.
- En la parte inferior aparece el nombre y el avatar del administrador conectado.

### Área de contenido

Cada página sigue la misma estructura interna:

1. **Cabecera** — título de la sección y subtítulo con conteo de registros.
2. **Barra de herramientas** — búsqueda, filtros y botón de acción principal.
3. **Tabla o listado** de registros.
4. **Modales** para crear y editar (se abren sobre el contenido sin abandonar la página).

---

## 4. Dashboard — Inicio

### Ruta: `/dashboard`

El Dashboard es la página de inicio y ofrece una visión global del estado del sistema.

### Tarjetas KPI (indicadores clave)

En la parte superior se muestran **8 tarjetas** con el contador actual de cada entidad principal:

| Tarjeta | Color | Qué mide |
|---|---|---|
| Usuarios | Verde | Total de usuarios registrados en el sistema |
| Hogares | Naranja | Total de hogares creados |
| Neveras | Azul | Total de neveras registradas |
| Tickets | Violeta | Total de tickets de compra |
| Categorías | Rosa | Total de categorías de productos |
| Recetas | Amarillo | Total de recetas en favoritos |
| Tiendas | Índigo | Total de tiendas registradas |
| Productos | Cian | Total de productos en el catálogo |

Cada tarjeta muestra un icono representativo, el nombre de la entidad, el número actual y una barra de acento de color en el lado izquierdo.

### Estado de carga

Mientras los datos se están obteniendo del servidor, las tarjetas muestran un **esqueleto animado** (skeleton loader) con efecto de brillo. Una vez que los datos llegan, los contadores se actualizan automáticamente.

### Acceso rápido

Debajo de las tarjetas KPI se muestra una cuadrícula de **accesos rápidos** a las secciones más utilizadas. Cada tarjeta de acceso rápido muestra el nombre de la sección y un icono; al pulsar sobre ella, navega directamente a dicha sección.

---

## 5. Usuarios

### Ruta: `/users`

Esta sección permite gestionar todas las cuentas de usuario del sistema.

### Listado de usuarios

La tabla muestra las siguientes columnas:

| Columna | Descripción |
|---|---|
| **Usuario** | Avatar con iniciales + nombre completo + email |
| **Rol** | Badge de color indicando el rol asignado |
| **Hogar** | Nombre del hogar al que pertenece el usuario |
| **Acciones** | Botones de editar y eliminar |

#### Badges de rol

| Rol | Color del badge |
|---|---|
| `Admin` | Verde |
| `Owner` | Naranja |
| `Member`, `Premium Member`, `Tests` | Gris neutro |

### Búsqueda y ordenación

- **Búsqueda en tiempo real**: escribe en el campo de búsqueda para filtrar usuarios por nombre o por email. El filtro se aplica mientras escribes.
- **Ordenación**: pulsa el botón de ordenación (flecha arriba/abajo junto al campo de búsqueda) para cambiar entre orden ascendente y descendente por nombre.

### Crear usuario

1. Pulsa el botón **Nuevo usuario** (esquina superior derecha).
2. Rellena el formulario en el modal:
   - **Nombre completo** — nombre visible del usuario.
   - **Email** — dirección de correo electrónico (debe ser única).
   - **Contraseña** — contraseña inicial.
   - **Rol** — selecciona entre: `Admin`, `Owner`, `Member`, `Premium Member`, `Tests`.
3. Pulsa **Crear usuario**. Si hay algún error, aparece un mensaje de notificación en la esquina de la pantalla.

### Ver detalle de un usuario

Pulsa sobre cualquier fila de la tabla para abrir la página de detalle del usuario (`/users/:id`).

La página de detalle muestra:
- Datos completos del perfil (nombre, email, rol, hogar asignado).
- Formulario para **cambiar el rol** del usuario sin necesidad de editar otros campos.
- **Zona peligrosa** con el botón para eliminar el usuario.

### Editar rol

En la página de detalle, selecciona el nuevo rol en el desplegable y pulsa **Guardar rol**. El cambio se aplica de inmediato.

### Eliminar usuario

Tanto desde la tabla (icono de papelera) como desde la página de detalle, el sistema abrirá un **diálogo de confirmación** antes de ejecutar el borrado. El diálogo muestra el email del usuario y solicita confirmación explícita.

> **Atención:** La eliminación es permanente e irreversible.

---

## 6. Hogares

### Ruta: `/households`

Un **hogar** es la unidad organizativa central de Gastromind. Agrupa usuarios (miembros), electrodomésticos disponibles y neveras. Esta sección permite administrar todos los hogares del sistema.

### Listado de hogares

Cada fila de la tabla muestra:

| Columna | Descripción |
|---|---|
| **Hogar** | Nombre del hogar con icono identificativo |
| **Miembros** | Número de miembros y lista de sus avatares |
| **Electrodomésticos** | Badges con los electrodomésticos registrados |
| **Acciones** | Botones de acceso al detalle y eliminación |

### Búsqueda y ordenación

- **Búsqueda**: filtra por nombre del hogar o por nombre de cualquiera de sus miembros.
- **Ordenación**: alterna entre A→Z y Z→A por nombre del hogar.

### Crear hogar

1. Pulsa **Nuevo hogar**.
2. Introduce el nombre del hogar en el modal.
3. Pulsa **Crear hogar**.

### Página de detalle del hogar

Pulsa sobre cualquier hogar para abrir su página de detalle (`/households/:id`). Aquí puedes:

#### Editar el nombre

Pulsa el botón **Editar** en la cabecera de la tarjeta para abrir el modal de edición. Modifica el nombre y pulsa **Guardar cambios**.

#### Gestionar electrodomésticos

La sección **Electrodomésticos** muestra todos los electrodomésticos actualmente registrados en el hogar. Los electrodomésticos disponibles son:

| Electrodoméstico | Descripción |
|---|---|
| Horno | Horno convencional |
| Microondas | Microondas |
| Air Fryer | Freidora de aire |
| Vitrocerámica | Placa vitrocerámica |
| Robot de cocina | Robot multifunción |
| Batidora | Batidora / licuadora |
| Olla exprés | Olla a presión |

Para **añadir un electrodoméstico**, selecciónalo en el desplegable y pulsa **Añadir**. Solo aparecen en el desplegable los electrodomésticos que el hogar aún no tiene.

> Los electrodomésticos no pueden eliminarse una vez añadidos desde este panel.

#### Gestionar miembros

La sección **Miembros** lista todos los usuarios del hogar con su nombre, email y rol.

- **Invitar miembro**: pulsa **Generar token de invitación** para obtener un código único. Cópialo con el botón que aparece junto al token y compártelo con el usuario que deseas invitar. El token tiene una validez limitada.
- **Promover a Owner**: en la fila de un miembro con rol inferior, el botón de corona permite promocionarlo al rol `Owner` dentro del hogar.
- **Expulsar miembro**: el botón de salida (icono de puerta) elimina al miembro del hogar previa confirmación.

#### Eliminar hogar

En la **zona peligrosa** de la página de detalle, el botón **Eliminar hogar** elimina el hogar y todos sus datos asociados previa confirmación.

---

## 7. Neveras

### Ruta: `/fridges`

Las neveras son los contenedores físicos de alimentos vinculados a un hogar. Desde esta sección se administran todas las neveras del sistema y los alimentos que contienen.

### Listado de neveras

| Columna | Descripción |
|---|---|
| **Nevera** | Icono + identificador abreviado (8 primeros caracteres del ID) |
| **Hogar asignado** | Nombre del hogar al que pertenece la nevera |
| **ID completo** | UUID completo de la nevera en formato monoespaciado |
| **Acciones** | Botones de editar y eliminar |

### Búsqueda y filtro

- **Búsqueda**: escribe en el campo para filtrar por nombre del hogar o por el ID de la nevera. El filtro es instantáneo.
- **Filtro por hogar**: usa el desplegable para mostrar únicamente las neveras de un hogar concreto.
- **Limpiar filtros**: cuando hay filtros activos, aparece el botón **Limpiar** para eliminarlos todos de una vez.

El subtítulo de la cabecera indica dinámicamente cuántas neveras se muestran del total (por ejemplo, *3 de 12 neveras*).

### Crear nevera

1. Pulsa **Nueva nevera**.
2. Selecciona el hogar al que se asignará la nevera en el desplegable.
3. Pulsa **Crear nevera**.

### Editar nevera

Pulsa el icono de lápiz en la fila de la nevera para abrir el modal de edición. Cambia el hogar asignado y guarda.

### Eliminar nevera

Pulsa el icono de papelera. Se mostrará un diálogo de confirmación indicando que la nevera y **todos sus items** serán eliminados permanentemente.

### Página de detalle de la nevera

Pulsa sobre cualquier fila para abrir la página de detalle (`/fridges/:id`).

#### Información del hogar

En la tarjeta superior se muestra el ID completo de la nevera y el nombre del hogar al que está asignada. El botón **Editar** permite cambiar el hogar asignado.

#### Items de la nevera

La tabla de items muestra:

| Columna | Descripción |
|---|---|
| **Producto** | Nombre del producto |
| **Cantidad** | Cantidad almacenada |
| **Caducidad** | Fecha de caducidad (si se especificó) |
| **Estado** | Badge de color indicando el estado del item |

#### Estados de los items

| Estado | Color | Significado |
|---|---|---|
| `Bueno` | Verde | El alimento está en buen estado |
| `Por caducar` | Naranja | El alimento está próximo a caducar |
| `Consumido` | Gris | El alimento ha sido consumido |
| `Caducado` | Rojo | El alimento ha caducado |

#### Filtros de items

Encima de la tabla hay tres filtros:

| Filtro | Descripción |
|---|---|
| **Todos** | Muestra todos los items de la nevera |
| **Por caducar** | Muestra solo los items próximos a caducar |
| **Por categoría** | Desplegable para filtrar por categoría de producto; pulsa **Filtrar** para aplicar |

#### Añadir item

1. Pulsa **Añadir item**.
2. Rellena el formulario:
   - **Producto** — selecciona el producto del catálogo en el desplegable.
   - **Cantidad** — introduce la cantidad numérica.
   - **Fecha de caducidad** — opcional; usa el selector de fecha.
   - **Estado** — elige el estado inicial del item.
3. Pulsa **Añadir item**.

#### Acciones sobre cada item

| Acción | Icono | Descripción |
|---|---|---|
| Editar | Lápiz | Modifica los datos del item |
| Marcar consumido | Check | Marca el item como `CONSUMED` directamente |
| Consumir cantidad | Copa | Abre un modal para reducir la cantidad en una cantidad concreta |
| Eliminar | Papelera | Elimina el item previa confirmación |

---

## 8. Tickets de compra

### Ruta: `/tickets`

Los tickets registran las compras realizadas por los usuarios. Cada ticket corresponde a un recibo de compra con sus líneas de producto.

### Listado de tickets

| Columna | Descripción |
|---|---|
| **Ticket** | Identificador abreviado + fecha de compra |
| **Usuario** | Nombre del usuario que realizó la compra |
| **Tienda** | Nombre de la tienda |
| **Total** | Importe total de la compra |
| **Acciones** | Ver detalle y eliminar |

### Búsqueda y ordenación

- **Búsqueda**: filtra por nombre de usuario, nombre de tienda o ID del ticket.
- **Ordenación**: alterna entre más reciente primero y más antiguo primero.

### Crear ticket

1. Pulsa **Nuevo ticket**.
2. Rellena la cabecera del ticket:
   - **Usuario** — selecciona el usuario comprador en el desplegable.
   - **Tienda** — selecciona la tienda en el desplegable.
   - **Fecha de compra** — selecciona la fecha con el selector de fecha.
   - **Total** — importe total de la compra.
3. Añade las **líneas de producto** pulsando **Añadir línea**:
   - **Producto** — selecciona el producto del catálogo; el nombre se rellena automáticamente.
   - **Nombre en línea** — nombre del producto tal como aparece en el recibo (editable).
   - **Cantidad** — número de unidades.
   - **Precio unitario** — precio por unidad.
   - **Unidad** — selecciona la unidad de medida en el desplegable.
   - **Estado de verificación** — `OK`, `PENDING`, `MISMATCH`.
   - **Nota** — nota opcional sobre esa línea.
   - El botón de papelera elimina esa línea del formulario.
4. Pulsa **Crear ticket**.

### Ver detalle del ticket

Pulsa sobre cualquier fila para abrir la página de detalle (`/tickets/:id`). Muestra todos los campos del ticket y cada línea de producto con su precio, cantidad y estado de verificación.

### Eliminar ticket

Desde la tabla o desde la página de detalle, pulsa el icono de papelera. Se pedirá confirmación antes de eliminar.

---

## 9. Compras habituales

### Ruta: `/usual-purchases`

Las compras habituales registran los productos que un usuario compra de forma regular o recurrente.

### Listado

| Columna | Descripción |
|---|---|
| **Producto** | Nombre del producto habitual |
| **Usuario** | Nombre del usuario propietario de la compra habitual |
| **Acciones** | Editar, ver detalle y eliminar |

### Búsqueda y ordenación

- **Búsqueda**: filtra por nombre de usuario o nombre de producto.
- **Ordenación**: alterna entre más reciente y más antiguo.

### Crear compra habitual

1. Pulsa **Nueva compra habitual**.
2. Selecciona el **usuario** en el desplegable.
3. Selecciona el **producto** en el desplegable.
4. Pulsa **Crear**.

### Ver y editar detalle

Pulsa sobre una fila o en el icono de lápiz para abrir la página de detalle (`/usual-purchases/:id`). Desde ahí puedes modificar el usuario o el producto asignado.

### Eliminar

Pulsa el icono de papelera y confirma en el diálogo.

---

## 10. Favoritos

### Ruta: `/user-favorites`

Esta sección gestiona las recetas favoritas de los usuarios. Cada favorito vincula a un usuario con una receta completa (título, instrucciones, tiempo, electrodoméstico necesario, dificultad).

### Listado de favoritos

| Columna | Descripción |
|---|---|
| **Receta** | Título de la receta + electrodoméstico |
| **Usuario** | Nombre del usuario propietario del favorito |
| **Dificultad** | Badge de dificultad de la receta |
| **Tiempo** | Tiempo de preparación en minutos |
| **Acciones** | Editar, ver detalle y eliminar |

### Búsqueda y ordenación

- **Búsqueda**: filtra por título de receta, nombre de usuario, electrodoméstico o dificultad.
- **Ordenación**: alterna entre orden A→Z y Z→A por título de receta.

### Crear favorito

1. Pulsa **Nuevo favorito**.
2. Selecciona el **usuario** propietario.
3. Rellena los datos de la receta:
   - **Título** — nombre de la receta.
   - **Instrucciones** — pasos de preparación detallados.
   - **Raciones** — número de porciones.
   - **Tiempo de preparación** — en minutos.
   - **Electrodoméstico necesario** — selecciona el electrodoméstico requerido.
   - **Dificultad** — `Fácil`, `Media` o `Difícil`.
4. Pulsa **Crear favorito**.

> Internamente el sistema crea primero la receta y luego la vincula al usuario en dos pasos de API.

### Niveles de dificultad

| Valor | Descripción |
|---|---|
| `EASY` / Fácil | Receta sencilla sin técnicas complejas |
| `MEDIUM` / Media | Requiere algo de experiencia en cocina |
| `HARD` / Difícil | Receta avanzada con técnicas o tiempos exigentes |

### Ver y editar detalle

La página de detalle (`/user-favorites/:id`) muestra la receta completa y permite editar todos sus campos o cambiar el usuario propietario.

### Eliminar favorito

Desde la tabla o la página de detalle, el botón de eliminación muestra un diálogo de confirmación antes de borrar.

---

## 11. Productos

### Ruta: `/products`

El catálogo de productos es la base de referencia usada en neveras, tickets y compras habituales.

### Listado de productos

| Columna | Descripción |
|---|---|
| **Producto** | Nombre del producto |
| **Esencial** | Indica si el producto es esencial |
| **Revisión** | Badge si el producto necesita revisión |
| **Alérgeno** | ID del alérgeno asociado (si tiene) |
| **Acciones** | Editar y eliminar |

### Crear producto

1. Pulsa **Nuevo producto**.
2. Rellena los campos:
   - **Nombre** — nombre del producto.
   - **Es esencial** — marca si el producto es de primera necesidad.
   - **Necesita revisión** — marca si el producto debe ser revisado por un administrador.
   - **Nota de revisión** — texto libre explicando el motivo de revisión.
   - **Alérgeno** — ID del alérgeno si aplica.
3. Pulsa **Crear producto**.

### Editar y eliminar

Usa los iconos de la columna de acciones. La eliminación requiere confirmación.

---

## 12. Categorías

### Ruta: `/categories`

Las categorías organizan los productos en grupos temáticos (lácteos, frutas, verduras, etc.) y se usan como filtro en las neveras.

### Listado de categorías

Muestra el nombre de cada categoría y los botones de editar y eliminar.

### Crear categoría

1. Pulsa **Nueva categoría**.
2. Introduce el nombre de la categoría.
3. Pulsa **Crear categoría**.

### Editar y eliminar

Los botones de acción en cada fila permiten modificar el nombre o eliminar la categoría. La eliminación requiere confirmación.

---

## 13. Tiendas

### Ruta: `/stores`

Las tiendas son los establecimientos donde se realizan las compras registradas en los tickets.

### Listado de tiendas

Muestra el nombre de cada tienda y los botones de editar y eliminar.

### Crear tienda

1. Pulsa **Nueva tienda**.
2. Introduce el nombre de la tienda.
3. Pulsa **Crear tienda**.

### Editar y eliminar

Usa los iconos de acción de cada fila. La eliminación muestra un diálogo de confirmación.

---

## 14. Unidades

### Ruta: `/units`

Las unidades de medida se asignan a las líneas de producto de los tickets (kilogramos, litros, unidades, gramos, etc.).

### Listado de unidades

Muestra el nombre de cada unidad y los botones de editar y eliminar.

### Crear unidad

1. Pulsa **Nueva unidad**.
2. Introduce el nombre de la unidad (por ejemplo: `kg`, `L`, `ud`, `g`).
3. Pulsa **Crear unidad**.

### Editar y eliminar

Usa los iconos de acción. La eliminación requiere confirmación.

---

## 15. Métricas del servidor

### Ruta: `/metrics`

Esta sección muestra gráficas en tiempo real con métricas del servidor backend obtenidas desde **Prometheus**. Está pensada para monitorear la salud del sistema.

### Botón de actualización

En la esquina superior derecha aparece el botón **Actualizar** que recarga todos los datos de las gráficas. Mientras se cargan, el botón muestra un spinner y queda deshabilitado.

### Gráfica 1 — Tráfico HTTP por código de estado

**Tipo:** Línea temporal · **Unidad:** peticiones por segundo (req/s)

Muestra la tasa de peticiones HTTP recibidas por el servidor en las últimas **2 horas**, agrupadas por código de respuesta:

| Color | Código | Significado |
|---|---|---|
| Verde | 2xx | Respuestas exitosas |
| Azul | 3xx | Redirecciones |
| Ámbar | 4xx | Errores del cliente |
| Rojo | 5xx | Errores del servidor |

**Cómo interpretarlo:** Un aumento sostenido de errores 5xx indica problemas en el servidor. Un pico de 4xx puede indicar peticiones incorrectas o problemas de autenticación.

### Gráfica 2 — Memoria JVM (Heap)

**Tipo:** Dónut · **Unidad:** megabytes (MB) · **Badge:** Live (actualización en tiempo real)

Muestra el estado actual de la memoria heap de la JVM dividida en:
- **Usada** (rojo): memoria heap actualmente ocupada.
- **Libre** (gris): memoria heap disponible.

Debajo de la gráfica se muestran los valores exactos en MB:
- **Usada** — MB actualmente en uso.
- **Libre** — MB disponibles (Total − Usada).
- **Total heap** — límite máximo configurado de la heap.

**Cómo interpretarlo:** Si la memoria usada supera el **85 %** del total de forma sostenida, puede haber riesgo de error `OutOfMemoryError`.

### Gráfica 3 — Uso de CPU

**Tipo:** Línea temporal · **Unidad:** porcentaje (%)

Muestra el porcentaje de CPU consumido por el proceso JVM en las últimas **2 horas**.

**Cómo interpretarlo:** Picos puntuales son normales. Si el uso supera el **80 %** de forma continuada, puede indicar cuellos de botella o consultas lentas a la base de datos.

### Gráfica 4 — Latencia media HTTP

**Tipo:** Línea temporal · **Unidad:** milisegundos (ms)

Muestra el tiempo medio de respuesta de todos los endpoints de la API en las últimas **2 horas**.

**Cómo interpretarlo:**
- Por debajo de **200 ms**: rendimiento óptimo.
- Entre 200 ms y 1 000 ms: zona de atención.
- Por encima de **1 000 ms**: degradación del servicio; revisar logs y base de datos.

---

## 16. Elementos comunes de la interfaz

### Notificaciones toast

Al completar una acción (crear, editar, eliminar, error…) aparece una pequeña notificación en la esquina de la pantalla que desaparece automáticamente tras **5 segundos**. Los colores indican el tipo:

| Color | Tipo |
|---|---|
| Verde | Éxito |
| Rojo | Error |
| Azul | Información |
| Amarillo | Advertencia |

### Diálogo de confirmación

Antes de cualquier acción destructiva (eliminar un registro) el sistema muestra un modal de confirmación de **dos pasos**:
1. Se presenta el título de la acción y un mensaje descriptivo con el nombre de la entidad afectada.
2. Hay que pulsar el botón rojo de confirmación para proceder. El botón **Cancelar** cierra el diálogo sin hacer nada.

### Skeletons de carga

Mientras los datos se cargan desde el servidor, las tablas y tarjetas muestran filas grises animadas (esqueletos). Esto indica que la carga está en progreso y evita el parpadeo de contenido.

### Estados vacíos

Cuando una sección no tiene registros (o los filtros no devuelven resultados), se muestra un icono representativo con un mensaje explicativo y, en muchos casos, un botón directo para crear el primer registro o limpiar los filtros.

### Responsive

La interfaz se adapta a diferentes tamaños de pantalla:
- En tablets (< 960 px) algunas columnas secundarias de las tablas se ocultan automáticamente para mantener la legibilidad.
- En móviles (< 480 px) la barra lateral se colapsa y el contenido ocupa todo el ancho.

---

*Gastromind Admin Panel — Documentación interna*
