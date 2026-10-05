# 🏐 Liga de Vóley API

API REST para una **plataforma de torneos de vóley**, desarrollada como proyecto integrador de **Programación Backend II (CoderHouse)**.

## Temática

La plataforma gestiona torneos de vóley organizados en **ligas por división y rama**:

| División | Femenino | Masculino |
|----------|:--------:|:---------:|
| A        | ✅       | ✅        |
| B        | ✅       | ✅        |
| C        | ✅       | ✅        |
| D        | ✅       | ✅        |
| E        | ✅       | ✅        |

A lo largo de las entregas se van a incorporar equipos, jugadores, partidos e inscripciones a torneos.

Cómo se relacionan las entidades del curso con la temática:

| Entidad del curso | En este proyecto |
|-------------------|------------------|
| `User`            | Jugadores, organizadores de torneos y administradores |
| `Event`           | Torneo o fecha de una liga |
| `category` del evento | Liga: división + rama (`A-femenino` … `E-masculino`) |
| `Ticket`          | Inscripción a un torneo |

**Roles:** `admin` (gestiona todo el sistema), `organizer` (crea y administra torneos) y `user` (jugador que consulta torneos y se inscribe).

## Tecnologías

- Node.js (ESM: `import` / `export`)
- Express 5
- MongoDB Atlas + Mongoose
- bcrypt (hash de contraseñas)
- Passport.js (`passport-local` y `passport-jwt`)
- jsonwebtoken (JWT)
- cookie-parser (cookie de autenticación)
- Nodemailer (email de confirmación de inscripción)
- dotenv
- Bootstrap 5 (página de inicio)

## Instalación

```bash
git clone https://github.com/IngNicolasCosta/CoderHouse_Backend2.git
cd CoderHouse_Backend2
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

```bash
cp .env.example .env
```

| Variable             | Descripción                                          | Obligatoria | Ejemplo |
|----------------------|------------------------------------------------------|:-----------:|---------|
| `PORT`               | Puerto donde escucha el servidor                     | No (`8080`) | `8080` |
| `NODE_ENV`           | Entorno (`development` / `production`)               | No (`development`) | `development` |
| `MONGO_URL`          | Cadena de conexión a MongoDB (Atlas o local)         | ✅ | `mongodb+srv://usuario:password@cluster.mongodb.net/voley-liga` |
| `JWT_SECRET`         | Clave para firmar los JWT (larga y aleatoria)        | ✅ | `un_secreto_largo_y_aleatorio` |
| `JWT_EXPIRES_IN`     | Duración del token                                   | No (`1h`) | `1h` |
| `BCRYPT_SALT_ROUNDS` | Costo del hash de contraseñas                        | No (`10`) | `10` |
| `MAIL_HOST`          | Servidor SMTP para los emails                        | No (sin él no se envían emails) | `smtp.gmail.com` |
| `MAIL_PORT`          | Puerto SMTP                                          | No (`587`) | `587` |
| `MAIL_USER`          | Usuario SMTP                                         | No | `tu_cuenta@gmail.com` |
| `MAIL_PASS`          | Contraseña SMTP (en Gmail, contraseña de aplicación) | No | `abcd efgh ijkl mnop` |
| `MAIL_FROM`          | Remitente de los emails                              | No (`MAIL_USER`) | `"Liga de Vóley <tu_cuenta@gmail.com>"` |

> Si falta `MONGO_URL` o `JWT_SECRET`, o no se puede conectar a la base, el servidor no arranca y muestra el error.

Para generar un `JWT_SECRET` aleatorio:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Ejecución

```bash
# desarrollo (se reinicia al guardar cambios)
npm run dev

# producción
npm start

# asignar un rol a un usuario registrado (por ejemplo, el primer admin)
npm run set-role -- admin@mail.com admin
```

Con el servidor levantado, en `http://localhost:8080/` hay una página de inicio con las rutas disponibles y formularios para probar registro, login, `current` y logout.

## Estructura de carpetas

```
CoderHouse_Backend2/
├── src/
│   ├── app.js                  # configura Express, middlewares, Passport y rutas (NO levanta el server)
│   ├── server.js               # valida el entorno, conecta la base y levanta el servidor
│   ├── config/
│   │   ├── config.js           # variables de entorno (dotenv) y opciones de la cookie
│   │   ├── constants.js        # estados de eventos y tickets, ligas, transiciones y paginación
│   │   ├── database.js         # conexión a MongoDB
│   │   ├── mailer.config.js    # transporter de Nodemailer (credenciales desde el .env)
│   │   ├── passport.config.js  # estrategias de Passport: register, login y current
│   │   └── permissions.js      # roles y matriz de permisos
│   ├── routes/
│   │   ├── health.router.js
│   │   ├── events.router.js    # rutas de eventos protegidas con authenticate + authorizeRoles
│   │   ├── sessions.router.js
│   │   ├── users.router.js     # rutas administrativas (solo admin)
│   │   └── tickets.router.js   # my-tickets y cancelación de inscripciones
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   ├── sessions.controller.js
│   │   ├── users.controller.js
│   │   └── tickets.controller.js
│   ├── services/
│   │   ├── events.service.js       # reglas de negocio de torneos, filtros y paginación
│   │   ├── sessions.service.js     # reglas de negocio: alta de usuario, credenciales, usuario de la sesión
│   │   ├── users.service.js        # listado de usuarios y cambio de rol
│   │   ├── tickets.service.js      # inscripciones: validaciones, cupos y cancelación
│   │   └── mail.service.js         # email de confirmación de inscripción
│   ├── repositories/
│   │   ├── events.repository.js
│   │   ├── users.repository.js
│   │   └── tickets.repository.js
│   ├── dao/
│   │   ├── events.dao.js
│   │   ├── users.dao.js
│   │   └── tickets.dao.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── Ticket.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      # authenticate (401), optionalAuthenticate y passportCall
│   │   ├── authorize.middleware.js # authorizeRoles (403), authorizeEventOwnerOrAdmin y authorizeTicketOwnerOrAdmin
│   │   ├── notFound.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── scripts/
│   │   └── setRole.js          # npm run set-role: asigna un rol (para crear el primer admin)
│   ├── utils/
│   │   ├── hash.js             # createHash / isValidPassword (bcrypt)
│   │   ├── jwt.js              # generateToken (lo usa el controller de login)
│   │   ├── validators.js       # validación de datos de registro/login y normalización de email
│   │   ├── errors.js           # AppError con código HTTP y mensajes de error
│   │   └── codes.js            # generador de códigos de reserva
│   └── public/
│       └── index.html          # página de inicio (Bootstrap)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Flujo de una petición:

```
Cliente → Router → Middleware → Controller → Service → Repository → DAO → Model (MongoDB)
```

En las rutas de sesión, el middleware es una estrategia de Passport:

```
Cliente → Router → passportCall('register' | 'login' | 'current') → Strategy → Service → Repository → DAO → Model
                                                                 ↘ req.user → Controller → Respuesta
```

## Rutas disponibles

| Método | Ruta                          | Descripción                                   | Acceso |
|--------|-------------------------------|-----------------------------------------------|--------|
| GET    | `/`                           | Página de inicio para probar la API           | Pública |
| GET    | `/api/health`                 | Estado del servidor                           | Pública |
| GET    | `/api/events`                 | Listado de torneos con filtros, paginación y orden | Pública |
| GET    | `/api/events/:id`             | Detalle de un torneo                          | Pública (los borradores solo los ve su dueño o un admin) |
| POST   | `/api/events`                 | Crear un torneo                               | 🔒 `organizer`, `admin` |
| PUT    | `/api/events/:id`             | Modificar los datos de un torneo              | 🔒 dueño (`organizer`) o `admin` |
| PATCH  | `/api/events/:id/status`      | Cambiar el estado (publicar, cancelar, finalizar) | 🔒 dueño (`organizer`) o `admin` |
| POST   | `/api/sessions/register`      | Registro de usuario                           | Pública |
| POST   | `/api/sessions/login`         | Login: genera el JWT y lo guarda en la cookie | Pública |
| GET    | `/api/sessions/current`       | Datos del usuario autenticado                 | 🔒 cualquier usuario con sesión |
| POST   | `/api/sessions/logout`        | Cierra la sesión borrando la cookie           | Pública |
| GET    | `/api/users`                  | Listado de todos los usuarios                 | 🔒 `admin` |
| PATCH  | `/api/users/:uid/role`        | Cambiar el rol de un usuario                  | 🔒 `admin` |
| POST   | `/api/events/:eid/tickets`    | Inscribirse a un torneo                       | 🔒 cualquier usuario con sesión |
| GET    | `/api/events/:eid/tickets`    | Inscriptos de un torneo y resumen de cupos    | 🔒 dueño (`organizer`) o `admin` |
| GET    | `/api/tickets/my-tickets`     | Mis inscripciones                             | 🔒 cualquier usuario con sesión |
| PATCH  | `/api/tickets/:tid/cancel`    | Cancelar una inscripción                      | 🔒 dueño del ticket o `admin` |

Todas las respuestas tienen el formato `{ "status": "success" | "error", ... }`. Una ruta inexistente devuelve `404`.

Las rutas 🔒 responden **`401`** si no hay sesión y **`403`** si hay sesión pero el rol no tiene permiso (ver [Roles y autorización](#roles-y-autorización)).

### `GET /api/health`

Response `200`:

```json
{ "status": "ok", "message": "Servidor activo" }
```

## Torneos (eventos)

Un torneo es una fecha o competencia de una liga. Su `category` es la **liga**, que combina división y rama:

`A-femenino`, `A-masculino`, `B-femenino`, `B-masculino`, `C-femenino`, `C-masculino`, `D-femenino`, `D-masculino`, `E-femenino`, `E-masculino`

### Modelo `Event`

| Campo         | Tipo     | Obligatorio | Reglas |
|---------------|----------|:-----------:|--------|
| `title`       | string   | ✅ | |
| `description` | string   | ✅ | |
| `category`    | string   | ✅ | Una de las ligas de arriba |
| `date`        | fecha    | ✅ | ISO 8601 (`2026-11-15T10:00:00Z` o `2026-11-15`). Tiene que ser **futura** |
| `location`    | string   | ✅ | Sede |
| `capacity`    | number   | ✅ | Cupo de equipos: entero **mayor a 0** |
| `price`       | number   | | Inscripción por equipo: **mayor o igual a 0** (por defecto `0`) |
| `status`      | string   | | `draft`, `published`, `cancelled` o `finished` (por defecto `draft`) |
| `organizer`   | ObjectId | automático | **Referencia** al `User` que lo creó (no un objeto embebido). Se toma de `req.user`, nunca del body |

### `GET /api/events` – listado con filtros

Pública. Todos los parámetros son opcionales:

| Parámetro  | Ejemplo | Descripción |
|------------|---------|-------------|
| `status`   | `published` | `published` (por defecto), `cancelled` o `finished`. Los borradores (`draft`) no son públicos |
| `category` | `A-femenino` | Liga exacta |
| `location` | `ferro` | Búsqueda parcial, sin distinguir mayúsculas |
| `search`   | `apertura` | Busca en el título y la descripción |
| `dateFrom` | `2026-11-01` | Torneos desde esa fecha (inclusive) |
| `dateTo`   | `2026-11-30` | Torneos hasta esa fecha (inclusive: si es solo una fecha, incluye el día completo) |
| `page`     | `2` | Página, desde 1 (por defecto `1`) |
| `limit`    | `5` | Resultados por página (por defecto `10`, máximo `50`) |
| `sort`     | `-date` | Campo de orden: `date` (por defecto), `price`, `title`, `capacity` o `createdAt`. Con `-` adelante es descendente |

Un parámetro inválido (estado o liga inexistentes, `page=0`, fecha mal escrita, `dateFrom` posterior a `dateTo`, campo de orden no permitido) responde `400` con el detalle.

`GET /api/events?status=published&category=A-femenino&page=2&limit=5` → `200`:

```json
{
  "status": "success",
  "data": [
    { "id": "6690...", "title": "Fecha 6", "description": "Liga A femenino", "category": "A-femenino", "date": "2026-11-15T10:00:00.000Z", "location": "Club Ferro", "capacity": 12, "price": 5000, "status": "published", "organizer": "665f2a..." }
  ],
  "page": 2,
  "limit": 5,
  "total": 12,
  "totalPages": 3
}
```

### `GET /api/events/:id`

Pública. Devuelve el torneo en `payload` (`200`), con `availableSeats` (cupos disponibles calculados con las inscripciones activas). Si no existe, si el id es inválido, o si es un borrador y quien consulta no es su dueño ni un admin → `404`:

```json
{ "status": "error", "message": "Evento no encontrado" }
```

### `POST /api/events` 🔒 organizer, admin

Request:

```json
{ "title": "Torneo Apertura", "description": "Fecha 1 de la liga", "category": "A-femenino", "date": "2026-11-15T10:00:00Z", "location": "Club Ferro", "capacity": 12, "price": 5000, "status": "published" }
```

`status` es opcional y solo acepta `draft` (por defecto) o `published`: un torneo nuevo no puede nacer cancelado ni finalizado.

Response `201`:

```json
{ "status": "success", "payload": { "id": "6690...", "title": "Torneo Apertura", "description": "Fecha 1 de la liga", "category": "A-femenino", "date": "2026-11-15T10:00:00.000Z", "location": "Club Ferro", "capacity": 12, "price": 5000, "status": "published", "organizer": "665f2a..." } }
```

Response `400` (ejemplos):

```json
{ "status": "error", "message": "Faltan campos obligatorios: description, category" }
{ "status": "error", "message": "La fecha del evento debe ser futura" }
{ "status": "error", "message": "La capacidad debe ser un número entero mayor a 0" }
{ "status": "error", "message": "El precio debe ser un número mayor o igual a 0" }
```

Response `401` sin sesión / `403` con rol `user`.

### `PUT /api/events/:id` 🔒 dueño o admin

Modifica los datos del torneo. Acepta los mismos campos que el `POST` (todos opcionales) con las mismas validaciones. Por ejemplo, la fecha nueva también tiene que ser futura. El `status` **no** se cambia acá, sino con `PATCH /api/events/:id/status`.

Request:

```json
{ "capacity": 16, "location": "Club GEBA" }
```

Response `200` con el torneo actualizado. Errores:

| Código | Caso | Mensaje |
|--------|------|---------|
| `400` | Datos inválidos o body con `status` | `El estado se cambia con PATCH /api/events/:id/status` |
| `403` | Un organizer intenta modificar un torneo de otro organizer | `No tenés permisos para modificar este evento` |
| `404` | El torneo no existe | `Evento no encontrado` |
| `409` | El torneo está cancelado o finalizado | `No se puede modificar un evento cancelado` |

### `PATCH /api/events/:id/status` 🔒 dueño o admin

Request:

```json
{ "status": "cancelled" }
```

Response `200` con el torneo actualizado. **Cancelar un torneo es cambiar su estado a `cancelled`: los torneos nunca se borran de la base**, así se conserva el historial (y, más adelante, sus inscripciones).

Cambios de estado permitidos:

```
draft ──────► published ──────► finished
  │               │
  └──► cancelled ◄┘
```

| Desde | Puede pasar a | Condición |
|-------|---------------|-----------|
| `draft` | `published`, `cancelled` | Para publicar, la fecha tiene que ser futura |
| `published` | `cancelled`, `finished` | Para finalizar, la fecha ya tiene que haber pasado |
| `cancelled` | — | Estado final |
| `finished` | — | Estado final |

Un cambio no permitido responde `409`:

```json
{ "status": "error", "message": "No se puede cambiar el estado de un evento cancelado" }
{ "status": "error", "message": "No se puede pasar un evento de published a draft" }
{ "status": "error", "message": "No se puede publicar un evento cuya fecha ya pasó" }
```

### Reglas de negocio

Todas las reglas viven en la capa de servicios ([`events.service.js`](src/services/events.service.js)), no en las rutas ni en los controllers:

- No se puede crear (ni mover) un torneo a una **fecha pasada**.
- `capacity` tiene que ser un entero **mayor a 0** y `price` **mayor o igual a 0**.
- La `capacity` no puede bajar por debajo de los cupos ya ocupados por inscripciones activas (`409`).
- Un torneo nuevo solo puede crearse como `draft` o `published`.
- **No se puede publicar** un torneo **cancelado o finalizado**, ni uno cuya fecha ya pasó.
- Los torneos **cancelados o finalizados no se pueden modificar**: son estados finales para conservar el historial tal como quedó. Si hay que cambiar algo, se crea un torneo nuevo.
- Un torneo solo se puede marcar como `finished` cuando su fecha ya pasó.
- **Cancelar no borra**: cambia el estado a `cancelled`. La API no tiene ningún `DELETE` de torneos.
- El `organizer` siempre es el usuario autenticado que lo creó. Un `organizer` solo gestiona sus propios torneos y un `admin` puede gestionar cualquiera (lo validan los middlewares de autorización).
- El listado nunca devuelve todo junto: siempre está paginado (máximo 50 por página).
- Los textos de búsqueda (`location`, `search`) se escapan antes de armar la expresión regular, así un texto con caracteres especiales no puede romper ni trabar la consulta.

Códigos de error: `400` datos o parámetros inválidos, `401` sin sesión, `403` sin permiso, `404` torneo inexistente, `409` la acción choca con el estado actual del torneo.

## Inscripciones (tickets)

Un **ticket** es la inscripción de un usuario a un torneo. Relaciona `User` con `Event` usando **referencias** (ObjectId), nunca objetos embebidos.

### Modelo `Ticket`

| Campo             | Tipo     | Descripción |
|-------------------|----------|-------------|
| `user`            | ObjectId | Referencia al `User` que se inscribió (sale de `req.user`) |
| `event`           | ObjectId | Referencia al `Event` |
| `status`          | string   | `pending`, `confirmed` o `cancelled` |
| `quantity`        | number   | Cupos que reserva (entero mayor a 0, por defecto `1`) |
| `reservationCode` | string   | Código único de reserva, por ejemplo `VOL-7QK2MX` |
| `createdAt`       | fecha    | Fecha de la inscripción (automática) |
| `cancelledAt`     | fecha    | Fecha de cancelación (`null` mientras esté activo) |

### Estados

| Estado      | Significado | ¿Ocupa cupo? |
|-------------|-------------|:------------:|
| `pending`   | Reserva recién creada, mientras se verifica que el cupo alcance (dura milisegundos) | ✅ |
| `confirmed` | Inscripción confirmada: se envía el email | ✅ |
| `cancelled` | Inscripción cancelada. El documento **no se borra**: queda con `cancelledAt` | ❌ |

### Rutas

| Método | Ruta                          | Acceso | Descripción |
|--------|-------------------------------|--------|-------------|
| POST   | `/api/events/:eid/tickets`    | 🔒 cualquier usuario con sesión | Inscribirse a un torneo |
| GET    | `/api/tickets/my-tickets`     | 🔒 cualquier usuario con sesión | Mis inscripciones, con los datos del torneo |
| GET    | `/api/events/:eid/tickets`    | 🔒 `organizer` dueño del torneo o `admin` | Inscriptos de un torneo y resumen de cupos |
| PATCH  | `/api/tickets/:tid/cancel`    | 🔒 dueño del ticket o `admin` | Cancelar una inscripción |

#### `POST /api/events/:eid/tickets`

Request (el body es opcional; `quantity` vale `1` por defecto):

```json
{ "quantity": 1 }
```

Response `201`:

```json
{ "status": "success", "payload": { "id": "66a1...", "event": "6690...", "user": "665f...", "quantity": 1, "status": "confirmed", "reservationCode": "VOL-7QK2MX", "createdAt": "2026-10-05T14:00:00.000Z", "cancelledAt": null } }
```

Errores:

| Código | Caso | Mensaje |
|--------|------|---------|
| `400` | `quantity` no es un entero mayor a 0 | `La cantidad debe ser un número entero mayor a 0` |
| `401` | Sin sesión | `No autenticado` |
| `404` | El torneo no existe (o es un borrador ajeno) | `Evento no encontrado` |
| `409` | Torneo cancelado | `No es posible inscribirse a un evento cancelado` |
| `409` | Torneo finalizado | `No es posible inscribirse a un evento finalizado` |
| `409` | Torneo en borrador o con fecha pasada | `El evento no está disponible para inscripciones` / `No es posible inscribirse a un evento que ya ocurrió` |
| `409` | Ya tiene una inscripción activa a ese torneo | `Ya tenés una inscripción activa a este evento` |
| `409` | No alcanza el cupo | `No hay cupos suficientes: quedan 2 y pediste 3` / `No quedan cupos disponibles para este evento` |

#### `GET /api/tickets/my-tickets`

Devuelve solo los tickets del usuario autenticado (activos y cancelados), con los datos básicos del torneo vía `populate`. No incluye datos de otros usuarios.

```json
{ "status": "success", "payload": [ { "id": "66a1...", "event": { "id": "6690...", "title": "Torneo Apertura", "date": "2026-11-15T10:00:00.000Z", "location": "Club Ferro", "category": "A-femenino", "status": "published" }, "user": "665f...", "quantity": 1, "status": "confirmed", "reservationCode": "VOL-7QK2MX", "createdAt": "...", "cancelledAt": null } ] }
```

#### `GET /api/events/:eid/tickets` 🔒 dueño o admin

Lista los inscriptos del torneo (con nombre y email, nunca la contraseña) y un resumen de cupos:

```json
{ "status": "success", "payload": [ { "id": "66a1...", "user": { "id": "665f...", "first_name": "Ana", "last_name": "Pérez", "email": "ana@mail.com" }, "quantity": 1, "status": "confirmed", "...": "..." } ], "summary": { "capacity": 12, "occupied": 7, "available": 5 } }
```

Un `user` recibe `403` (`No tenés permisos para realizar esta acción`). Un `organizer` que no es dueño del torneo también recibe `403` (`No tenés permisos para modificar este evento`).

#### `PATCH /api/tickets/:tid/cancel` 🔒 dueño del ticket o admin

Cambia el `status` a `cancelled` y registra `cancelledAt`. **No borra el documento.** Response `200` con el ticket actualizado.

| Código | Caso | Mensaje |
|--------|------|---------|
| `403` | El ticket es de otro usuario (y no es admin) | `No tenés permisos para cancelar esta inscripción` |
| `404` | El ticket no existe | `Inscripción no encontrada` |
| `409` | Ya estaba cancelado | `La inscripción ya está cancelada` |
| `409` | El torneo ya ocurrió | `No se puede cancelar una inscripción de un evento que ya ocurrió` |

### Flujo de inscripción

Todas las validaciones están en [`tickets.service.js`](src/services/tickets.service.js), no en el controller ni en la ruta:

1. `authenticate` valida la sesión (`401`).
2. Se valida `quantity` (entero mayor a 0).
3. El torneo existe (`404`) y está `published`, no cancelado ni finalizado, y con fecha futura (`409`).
4. El usuario no tiene otro ticket activo para ese torneo (`409`). La regla es **una inscripción activa por usuario y torneo**; para reservar más lugares se usa `quantity`.
5. Hay cupo suficiente: `cupos disponibles ≥ quantity` (`409`).
6. Se crea el ticket como `pending` con un `reservationCode` único y se vuelve a verificar el cupo (ver abajo).
7. Pasa a `confirmed` y se envía el **email de confirmación**.

### Regla de cupos

```
cupos ocupados   = suma de quantity de los tickets del torneo con status pending o confirmed
cupos disponibles = capacity − cupos ocupados
```

- Los tickets **`cancelled` no se cuentan**, así que **al cancelar, el cupo queda libre automáticamente** y otra persona se puede inscribir.
- El cupo se calcula siempre a partir de los tickets. No hay un contador aparte que se pueda desincronizar.
- `GET /api/events/:id` incluye `availableSeats` con los cupos disponibles.
- Un torneo no puede bajar su `capacity` por debajo de los cupos ya ocupados (`409`).

**Inscripciones simultáneas:** si quedan 2 lugares y 10 personas se inscriben en el mismo instante, todas podrían ver "hay lugar". Para evitar la sobreventa:

- **Cupo:** el ticket se crea primero como `pending` y después se suman los cupos de las reservas hechas **hasta ese ticket inclusive**. Si esa suma supera la capacidad, el ticket se cancela y se responde `409`. Si no, pasa a `confirmed`. Así se confirman las primeras reservas y nunca se supera la capacidad.
- **Duplicados:** un índice único parcial en MongoDB (`user + event`, solo para tickets activos) impide que el mismo usuario tenga dos inscripciones activas, aunque mande varias a la vez (doble clic).

Probado con 10 inscripciones simultáneas a un torneo de cupo 3: se confirmaron exactamente 3 y las otras 7 recibieron `409`.

### Email de confirmación (Nodemailer)

Al confirmar una inscripción se envía un email al usuario con el torneo, la liga, la fecha, la sede, los cupos y el código de reserva. El envío se hace en segundo plano: si el servidor de correo falla, la inscripción queda confirmada igual y el error se registra en la consola.

Las credenciales se leen **solo de variables de entorno** (nunca están en el código):

| Variable    | Descripción | Ejemplo |
|-------------|-------------|---------|
| `MAIL_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Puerto (`587` STARTTLS, `465` SSL) | `587` |
| `MAIL_USER` | Usuario SMTP | `tu_cuenta@gmail.com` |
| `MAIL_PASS` | Contraseña SMTP (en Gmail, una contraseña de aplicación) | `abcd efgh ijkl mnop` |
| `MAIL_FROM` | Remitente que ve el usuario | `"Liga de Vóley <tu_cuenta@gmail.com>"` |

Si `MAIL_HOST` está vacío, la API funciona igual y solo omite los emails (avisa en la consola).

**Gmail:** activá la verificación en dos pasos y creá una contraseña de aplicación en [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). Esa contraseña de 16 letras va en `MAIL_PASS`; la contraseña normal de Gmail no funciona.

**Para probar sin una casilla real:** [Ethereal](https://ethereal.email) crea casillas de prueba gratis. Los emails no llegan a nadie, pero se ven en su web, y la consola del servidor muestra el link de vista previa de cada envío.

## Sesiones y usuarios

### `POST /api/sessions/register`

| Campo        | Tipo   | Obligatorio | Reglas |
|--------------|--------|:-----------:|--------|
| `first_name` | string | ✅ | No puede estar vacío |
| `last_name`  | string | ✅ | No puede estar vacío |
| `email`      | string | ✅ | Formato de email válido. Se guarda normalizado (sin espacios y en minúsculas) |
| `password`   | string | ✅ | Mínimo 8 caracteres. Se guarda hasheada con bcrypt |

- El `role` **no se puede elegir** desde el registro público: siempre se crea como `user`, aunque el body traiga otro valor.
- La respuesta **nunca incluye la contraseña**, ni en texto plano ni hasheada.

Request:

```json
{ "first_name": "Ana", "last_name": "Pérez", "email": "Ana@Mail.com ", "password": "Secreta123" }
```

Response `201`:

```json
{ "status": "success", "payload": { "id": "665f2a...", "first_name": "Ana", "last_name": "Pérez", "email": "ana@mail.com", "role": "user" } }
```

Response `400` (uno de estos mensajes):

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
{ "status": "error", "message": "El formato del email es inválido" }
{ "status": "error", "message": "La contraseña debe tener al menos 8 caracteres" }
```

Response `409`:

```json
{ "status": "error", "message": "El email ya está registrado" }
```

### `POST /api/sessions/login`

Request:

```json
{ "email": "ana@mail.com", "password": "Secreta123" }
```

Response `200` – además setea la cookie `currentUser` con el JWT:

```json
{ "status": "success", "message": "Login correcto" }
```

```
Set-Cookie: currentUser=eyJhbGciOi...; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax
```

Response `400` – falta el email o la contraseña:

```json
{ "status": "error", "message": "Email y contraseña son obligatorios" }
```

Response `401` – email inexistente **o** contraseña incorrecta (mismo mensaje en los dos casos, para no revelar qué emails están registrados):

```json
{ "status": "error", "message": "Credenciales inválidas" }
```

### `GET /api/sessions/current`

Requiere la cookie `currentUser`. El navegador, Postman e Insomnia la envían solos después del login.

Response `200`:

```json
{ "status": "success", "payload": { "id": "665f2a...", "email": "ana@mail.com", "role": "user" } }
```

Response `401` – sin cookie, o token inválido, manipulado o expirado:

```json
{ "status": "error", "message": "No autenticado" }
```

### `POST /api/sessions/logout`

Response `200` – borra la cookie `currentUser`:

```json
{ "status": "success", "message": "Sesión cerrada" }
```

### `GET /api/users` 🔒 admin

Response `200` (nunca incluye `password`):

```json
{ "status": "success", "payload": [ { "id": "665f2a...", "first_name": "Ana", "last_name": "Pérez", "email": "ana@mail.com", "role": "user" } ] }
```

Response `403` con rol `user` u `organizer`:

```json
{ "status": "error", "message": "No tenés permisos para realizar esta acción" }
```

### `PATCH /api/users/:uid/role` 🔒 admin

Request:

```json
{ "role": "organizer" }
```

Response `200`:

```json
{ "status": "success", "payload": { "id": "665f2a...", "first_name": "Ana", "last_name": "Pérez", "email": "ana@mail.com", "role": "organizer" } }
```

Response `400`:

```json
{ "status": "error", "message": "El rol indicado no es válido" }
{ "status": "error", "message": "No podés cambiar tu propio rol" }
```

Response `404`:

```json
{ "status": "error", "message": "Usuario no encontrado" }
```

## Roles y autorización

### Roles

| Rol         | En la liga de vóley | Cómo se obtiene |
|-------------|---------------------|-----------------|
| `user`      | Jugador/a: consulta torneos (más adelante se inscribe) | Por defecto al registrarse |
| `organizer` | Organizador/a de torneos: crea y gestiona sus torneos | Lo asigna un `admin` |
| `admin`     | Administración de la liga: gestiona todo | Lo asigna otro `admin` o el script `set-role` |

El **registro público siempre crea `user`**: si el body trae `"role": "admin"` u `"organizer"`, se ignora.

### Matriz de permisos

| Acción                              | `user` | `organizer` | `admin` | Ruta |
|-------------------------------------|:------:|:-----------:|:-------:|------|
| Consultar torneos publicados        | ✅ | ✅ | ✅ | `GET /api/events` |
| Crear torneos                       | ❌ | ✅ | ✅ | `POST /api/events` |
| Modificar / cancelar torneos propios | ❌ | ✅ | ✅ | `PUT /api/events/:id`, `PATCH /api/events/:id/status` |
| Modificar / cancelar cualquier torneo | ❌ | ❌ | ✅ | ídem |
| Ver todos los usuarios              | ❌ | ❌ | ✅ | `GET /api/users` |
| Cambiar el rol de un usuario        | ❌ | ❌ | ✅ | `PATCH /api/users/:uid/role` |
| Inscribirse a un torneo             | ✅ | ✅ | ✅ | `POST /api/events/:eid/tickets` |
| Ver mis inscripciones               | ✅ | ✅ | ✅ | `GET /api/tickets/my-tickets` |
| Cancelar mi inscripción             | ✅ | ✅ | ✅ | `PATCH /api/tickets/:tid/cancel` |
| Cancelar la inscripción de otro     | ❌ | ❌ | ✅ | ídem |
| Ver inscriptos de mis torneos       | ❌ | ✅ | ✅ | `GET /api/events/:eid/tickets` |
| Ver inscriptos de cualquier torneo  | ❌ | ❌ | ✅ | ídem |

La matriz vive en código en [`src/config/permissions.js`](src/config/permissions.js). Las rutas usan esas listas en lugar de escribir los roles a mano:

```js
router.post('/', authenticate, authorizeRoles(...PERMISSIONS.createEvent), createEvent)
```

### Middlewares

Las rutas protegidas encadenan los middlewares en este orden: **autenticación → autorización por rol → autorización por propiedad → controller**.

| Middleware | Archivo | Qué hace | Error |
|------------|---------|----------|-------|
| `authenticate` | [`auth.middleware.js`](src/middlewares/auth.middleware.js) | Ejecuta la estrategia `current` de Passport: lee el JWT de la cookie, lo valida y deja `{ id, email, role }` en `req.user` | `401` |
| `authorizeRoles(...roles)` | [`authorize.middleware.js`](src/middlewares/authorize.middleware.js) | Recibe los roles permitidos y los compara con `req.user.role`. Si no hay una regla que permita la acción, la rechaza (cerrado por defecto) | `403` |
| `authorizeEventOwnerOrAdmin` | [`authorize.middleware.js`](src/middlewares/authorize.middleware.js) | Busca el torneo y permite seguir solo si `req.user` es su `organizer` o tiene `manageAnyEvent` (admin) | `403` / `404` |
| `optionalAuthenticate` | [`auth.middleware.js`](src/middlewares/auth.middleware.js) | Para rutas públicas (`GET /api/events/:id`): si hay sesión válida completa `req.user`, y si no sigue como anónimo. Sirve para que el dueño o un admin puedan ver borradores | — |

```js
router.put(
  '/:id',
  authenticate,                                    // 401 si no hay sesión
  authorizeRoles(...PERMISSIONS.manageOwnEvent),   // 403 si es user
  authorizeEventOwnerOrAdmin,                      // 403 si el torneo es de otro organizer
  updateEvent
)
```

El rol se lee **de la base de datos** en cada request (la estrategia `current` busca al usuario), no del JWT. Por eso, si un admin cambia el rol de alguien, el cambio aplica en la próxima petición, sin volver a hacer login.

### Diferencia entre 401 y 403

| Código | Significado | Cuándo | Mensaje |
|--------|-------------|--------|---------|
| **401 Unauthorized** | **No autenticado**: el servidor no sabe quién sos | No hay cookie, o el token es inválido, manipulado o expiró | `No autenticado` |
| **403 Forbidden** | **Sin permiso**: el servidor sabe quién sos, pero tu rol no puede hacer esa acción | Un `user` crea un torneo, un `organizer` entra a `/api/users` o modifica un torneo ajeno | `No tenés permisos para realizar esta acción` / `No tenés permisos para modificar este evento` |

Con un 401 la solución es iniciar sesión. Con un 403, volver a loguearse no cambia nada: hace falta otro rol.

### Crear el primer admin

Como el registro público siempre crea `user`, el primer `admin` se asigna con un script. El usuario tiene que estar registrado antes:

```bash
npm run set-role -- admin@mail.com admin
```

Después, ese admin puede asignar roles desde la API con `PATCH /api/users/:uid/role` (por ejemplo, para convertir a alguien en `organizer`). El script acepta cualquier rol: `user`, `organizer` o `admin`.

## Autenticación con Passport

Toda la autenticación pasa por estrategias de **Passport.js**, centralizadas en [`src/config/passport.config.js`](src/config/passport.config.js). En `app.js` solo se inicializa Passport (`app.use(initializePassport())`), y ninguna estrategia vive ahí. Todas se usan con `session: false`: la sesión la representa el JWT de la cookie, no una sesión en memoria del servidor.

| Estrategia | Tipo | Ruta | Qué hace | Deja en `req.user` |
|------------|------|------|----------|--------------------|
| `register` | `passport-local` | `POST /api/sessions/register` | Valida los campos, normaliza el email, rechaza duplicados, hashea la contraseña con bcrypt y crea el usuario con rol `user` | Usuario creado (sin `password`) |
| `login` | `passport-local` | `POST /api/sessions/login` | Valida que vengan email y contraseña y compara la contraseña con bcrypt. Si algo no coincide: `401 Credenciales inválidas` | `{ id, email, role }` |
| `current` | `passport-jwt` | `GET /api/sessions/current` | Extrae el JWT de la cookie `currentUser`, verifica firma y expiración y confirma en la base que el usuario sigue existiendo | `{ id, email, role }` |

- **Quién genera el JWT:** el **controller** de login, no la estrategia. La estrategia solo valida las credenciales; después el controller firma el token con `req.user` y setea la cookie.
- **Logout:** no pasa por Passport. Solo borra la cookie.
- **Rutas limpias:** cada ruta delega en `passportCall(estrategia)` ([`auth.middleware.js`](src/middlewares/auth.middleware.js)). Este middleware ejecuta `passport.authenticate(estrategia, { session: false }, callback)` y, si la estrategia falla, deriva el error al manejador central. Así se mantienen las mismas respuestas JSON (`400`, `401`, `409`) de las entregas anteriores, en lugar del `401 Unauthorized` en texto plano que Passport responde por defecto.
- **Credenciales solo por body:** `passport-local` también acepta email y contraseña por query string (`?email=...&password=...`). Las estrategias validan siempre `req.body` para que nunca viaje una contraseña en la URL.

### Preparado para providers externos

El sistema queda **preparado para sumar providers externos** como Google o GitHub (`passport-google-oauth20`, `passport-github2`) **sin tocar `app.js`**. En `passport.config.js` las estrategias se registran desde un único objeto:

```js
const strategies = {
  register: registerStrategy,
  login: loginStrategy,
  current: currentStrategy
  // github: githubStrategy  ← un provider nuevo se agrega acá
}
```

Para un provider nuevo alcanza con crear su estrategia en ese archivo, sumarla al objeto y agregar sus rutas en `sessions.router.js` usando `passportCall('github')`. Al final del flujo, el mismo controller de login genera el JWT y la cookie.

## Seguridad de la sesión

- **JWT:** se firma con `JWT_SECRET` (HS256) y expira según `JWT_EXPIRES_IN`. El payload tiene solo `{ id, email, role }`, nunca la contraseña.
- **Cookie `currentUser`:**
  - `httpOnly: true`: el JavaScript del navegador no puede leerla, lo que protege el token ante ataques XSS.
  - `sameSite: 'lax'`: no se envía en peticiones originadas desde otros sitios (protección básica contra CSRF).
  - `maxAge: 3600000`: dura 1 hora.
  - `secure`: solo se activa con `NODE_ENV=production`, para que la cookie viaje únicamente por HTTPS.
- **Estrategia `current`:** si no hay cookie, si el token es inválido, manipulado o expiró, o si el usuario ya no existe en la base, responde `401 No autenticado`.
- **Login:** cuando el email no existe, igual se ejecuta una comparación bcrypt. Así el tiempo de respuesta es el mismo que con una contraseña incorrecta y tampoco se puede deducir por tiempo si un email está registrado.

## Cómo probar

**Desde la página de inicio:** `http://localhost:8080/` tiene los formularios de registro y login y botones para `current` y `logout`.

**Con Postman / Insomnia:** guardan la cookie automáticamente después del login. Orden sugerido:

1. `POST /api/sessions/register` con el body JSON de arriba → `201`
2. `POST /api/sessions/login` → `200` (en la pestaña *Cookies* aparece `currentUser`)
3. `GET /api/sessions/current` → `200` con `{ id, email, role }`
4. `POST /api/sessions/logout` → `200`
5. `GET /api/sessions/current` → `401`

**Roles:**

1. Registrar tres usuarios, por ejemplo `admin@mail.com`, `organizador@mail.com` y `jugadora@mail.com`.
2. Convertir al primero en admin: `npm run set-role -- admin@mail.com admin`.
3. Login como admin → `GET /api/users` (`200`) para ver los ids → `PATCH /api/users/<id del organizador>/role` con `{ "role": "organizer" }`.
4. Login como jugadora → `POST /api/events` → `403`. `GET /api/users` → `403`.
5. Login como organizador → `POST /api/events` → `201`. `GET /api/users` → `403`.
6. Con otro organizer, `PUT /api/events/<id>` de un torneo ajeno → `403`.

**Inscripciones:**

1. Como organizador, crear un torneo publicado con `capacity: 2` y copiar su `id`.
2. Como jugadora, `POST /api/events/<id>/tickets` → `201` y llega el email de confirmación.
3. Repetir el mismo POST → `409` (inscripción duplicada).
4. Con otro usuario, `POST` con `{ "quantity": 2 }` → `409` (queda 1 cupo).
5. `GET /api/tickets/my-tickets` → se ve el ticket con los datos del torneo.
6. Como organizador, `GET /api/events/<id>/tickets` → inscriptos y `summary` de cupos. Como jugadora → `403`.
7. Como jugadora, `PATCH /api/tickets/<ticketId>/cancel` → `200`, y el cupo vuelve a estar disponible.

**Con curl:** `-c` guarda la cookie en un archivo y `-b` la envía.

```bash
curl -X POST http://localhost:8080/api/sessions/register -H "Content-Type: application/json" -d "{\"first_name\":\"Ana\",\"last_name\":\"Pérez\",\"email\":\"ana@mail.com\",\"password\":\"Secreta123\"}"
curl -c cookies.txt -X POST http://localhost:8080/api/sessions/login -H "Content-Type: application/json" -d "{\"email\":\"ana@mail.com\",\"password\":\"Secreta123\"}"
curl -b cookies.txt http://localhost:8080/api/sessions/current
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/sessions/logout
curl -b cookies.txt http://localhost:8080/api/sessions/current
```

## Casos probados

| Caso | Resultado |
|------|-----------|
| Registro exitoso | `201`, email normalizado, `role: "user"`, sin `password` |
| Registro con campos faltantes o vacíos | `400` – Faltan campos obligatorios |
| Registro con email inválido | `400` – El formato del email es inválido |
| Registro con email ya registrado (aunque cambien mayúsculas) | `409` – El email ya está registrado |
| Registro con `"role": "admin"` en el body | Se ignora: el usuario se crea como `user` |
| Contraseña en la base de datos | Hash bcrypt (`$2b$10$...`), nunca texto plano |
| Registro → login → `current` → logout → `current` | `201` → `200` (cookie) → `200` → `200` → `401` |
| Login con email inexistente | `401` – Credenciales inválidas |
| Login con contraseña incorrecta | `401` – Credenciales inválidas |
| `current` sin cookie | `401` – No autenticado |
| `current` con token manipulado (rol cambiado a `admin`) | `401` – No autenticado |
| `current` con token expirado | `401` – No autenticado |
| `current` con token firmado con otra clave o con `alg: none` | `401` – No autenticado |
| `current` con token válido de un usuario que ya fue borrado | `401` – No autenticado |
| Login con credenciales en la query string en vez del body | `400` – Email y contraseña son obligatorios |
| `GET /api/users` con rol `organizer` | `403` |
| `GET /api/users` con rol `admin` | `200`, sin `password` |
| Rutas privadas (`POST /api/events`, `PUT /api/events/:id`, `PATCH /api/events/:id/status`, `GET /api/users`, `/current`) sin cookie | `401` – No autenticado |
| `organizer` intenta cambiar un rol | `403` |
| `admin` cambia su propio rol / rol inexistente | `400` |
| `admin` promueve un `user` a `organizer` | `200` y la misma sesión ya puede crear torneos |
| Crear torneo con rol `user` | `403` – No tenés permisos para realizar esta acción |
| Crear torneo con fecha pasada | `400` – La fecha del evento debe ser futura |
| Crear torneo con `capacity: 0` / `capacity: 2.5` / `price: -1` | `400` con el detalle |
| Crear torneo sin campos obligatorios / con `status: cancelled` | `400` |
| Crear torneo mandando otro `organizer` en el body | `201` y se ignora: queda el usuario autenticado |
| `organizer` modifica su propio torneo | `200` |
| `organizer` modifica o cambia el estado de un torneo ajeno | `403` – No tenés permisos para modificar este evento |
| `admin` modifica un torneo de otro organizer | `200` |
| Cambiar el estado de un torneo cancelado / finalizado | `409` – No se puede cambiar el estado de un evento cancelado |
| Modificar (`PUT`) un torneo cancelado / finalizado | `409` – No se puede modificar un evento cancelado |
| Cancelar un torneo | `200` con `status: cancelled`, y el documento sigue en la base |
| `published → draft`, mismo estado, `published → finished` con fecha futura, publicar con fecha pasada | `409` con el detalle |
| `PUT` con `status` en el body / sin campos / con fecha pasada | `400` |
| `?status=published&category=A-femenino&page=2&limit=5` | `200`, torneos 6 a 10 de 12, con `data`, `page`, `limit`, `total`, `totalPages` |
| Filtros `location` (parcial), `search`, `dateFrom`/`dateTo`, `sort=-price` | `200` con los torneos que corresponden |
| `?status=draft`, liga o `sort` inválidos, `page=0`, fecha inválida, `dateFrom > dateTo`, parámetro repetido | `400` con el detalle |
| `?limit=1000` | `200` con `limit: 50` |
| `?location=(a+)+$` (regex maliciosa) | `200`: se busca como texto literal |
| Torneo inexistente o id inválido | `404` – Evento no encontrado |
| Borrador por id: anónimo u otro organizer / dueño o admin | `404` / `200` |
| Inscripción exitosa | `201`, ticket `confirmed` con `reservationCode` y email recibido |
| Inscripción sin sesión | `401` |
| Inscripción a torneo inexistente | `404` |
| Inscripción a torneo cancelado / finalizado / borrador | `409` / `409` / `404` (o `409` si es el dueño) |
| Inscripción sin cupo suficiente | `409` – No hay cupos suficientes: quedan 2 y pediste 3 |
| Inscripción duplicada activa | `409` – Ya tenés una inscripción activa a este evento |
| `quantity` 0, decimal o texto | `400` |
| Cancelación propia → otro usuario se inscribe en ese cupo | `200` → `201` |
| Volver a inscribirse después de cancelar | `201` |
| Cancelar un ticket ajeno como `user` | `403` – No tenés permisos para cancelar esta inscripción |
| `admin` cancela un ticket ajeno | `200`, con `cancelledAt`, y el documento sigue en la base |
| Cancelar un ticket ya cancelado / inexistente | `409` / `404` |
| `GET /api/events/:eid/tickets` como `user` / organizer de otro torneo | `403` / `403` |
| `GET /api/events/:eid/tickets` como dueño o admin | `200` con inscriptos (sin `password`) y `summary` de cupos |
| `GET /api/tickets/my-tickets` | `200`, solo los propios, con título, fecha y sede del torneo |
| Bajar la `capacity` de un torneo por debajo de lo ocupado | `409` |
| 10 inscripciones simultáneas a un torneo con cupo 3 | 3 × `201` y 7 × `409`: nunca se supera el cupo |
| El mismo usuario manda 5 inscripciones simultáneas | 1 × `201` y 4 × `409`: un solo ticket activo |

## Evidencia

Capturas de la API funcionando contra MongoDB Atlas, tomadas desde la página de inicio (`http://localhost:8080/`). Las imágenes están en [`docs/evidencia/`](docs/evidencia/).

### Pre-entrega 1 – Estructura base

`GET /api/health` → `200`

![GET /api/health](docs/evidencia/pe1-health.png)

### Pre-entrega 2 – Registro seguro

Registro → `201`, con el email normalizado y **sin `password`** en la respuesta:

![Registro sin password](docs/evidencia/pe2-registro.png)

Usuarios en MongoDB Atlas, con la contraseña **hasheada con bcrypt** (`$2b$10$…`) y no en texto plano:

![Contraseña hasheada en Atlas](docs/evidencia/pe2-atlas-hash.png)

### Pre-entrega 3 – JWT y cookies

Login → `200`:

![Login](docs/evidencia/pe3-login.png)

Cookie `currentUser` con **HttpOnly** y SameSite `Lax`:

![Cookie currentUser HttpOnly](docs/evidencia/pe3-cookie.png)

`GET /api/sessions/current` con la cookie → `200` con `{ id, email, role }`:

![current 200](docs/evidencia/pe3-current-200.png)

`GET /api/sessions/current` sin cookie → `401`:

![current 401](docs/evidencia/pe3-current-401.png)

### Pre-entrega 4 – Passport

Flujo completo con las estrategias de Passport: registro (PE2) → login → `current` `200` (PE3) → **logout** → `current` `401` (PE3).

![Logout](docs/evidencia/pe4-logout.png)

### Pre-entrega 5 – Roles y autorización

`POST /api/events` con rol `user` → `403`:

![Crear evento como user](docs/evidencia/pe5-crear-evento-user-403.png)

`POST /api/events` con rol `organizer` → `201`, con `organizer` igual al usuario autenticado:

![Crear evento como organizer](docs/evidencia/pe5-crear-evento-organizer-201.png)

`GET /api/users` con rol `organizer` → `403`:

![Usuarios como organizer](docs/evidencia/pe5-users-organizer-403.png)

`GET /api/users` con rol `admin` → `200`:

![Usuarios como admin](docs/evidencia/pe5-users-admin-200.png)

### Pre-entrega 6 – Eventos y lógica de negocio

Un `admin` modifica el torneo de otro organizador → `200`:

![Admin modifica torneo ajeno](docs/evidencia/pe6-admin-modifica-ajeno-200.png)

Un `organizer` intenta modificar un torneo ajeno → `403`:

![Organizer modifica torneo ajeno](docs/evidencia/pe6-organizer-modifica-ajeno-403.png)

Cambiar el estado de un torneo cancelado → `409`:

![Estado de torneo cancelado](docs/evidencia/pe6-estado-cancelado-409.png)

Listado con filtros y paginación, con `data`, `page`, `limit`, `total` y `totalPages`:

![Listado paginado](docs/evidencia/pe6-listado-paginado.png)

### Pre-entrega 7 – Inscripciones y cupos

Inscripción → `201`, ticket `confirmed` con código de reserva:

![Inscripción](docs/evidencia/pe7-inscripcion-201.png)

Email de confirmación recibido (Nodemailer):

![Email de confirmación](docs/evidencia/pe7-email.png)

Inscripción duplicada → `409`:

![Inscripción duplicada](docs/evidencia/pe7-duplicada-409.png)

Sin cupo suficiente → `409` con mensaje claro:

![Sin cupo](docs/evidencia/pe7-sin-cupo-409.png)

Un `user` intenta ver los inscriptos de un torneo → `403`:

![Inscriptos como user](docs/evidencia/pe7-inscriptos-user-403.png)

Cancelación propia → `200`, con `status: cancelled` y `cancelledAt` (el ticket no se borra):

![Cancelar inscripción](docs/evidencia/pe7-cancelar-200.png)

Nueva inscripción al mismo torneo → `201`: el cupo se liberó al cancelar:

![Reinscripción](docs/evidencia/pe7-reinscripcion-201.png)

`GET /api/tickets/my-tickets` → los tickets propios con los datos del torneo (populate):

![Mis tickets](docs/evidencia/pe7-my-tickets.png)

El organizador dueño ve los inscriptos y el resumen de cupos (los cancelados no ocupan cupo):

![Inscriptos como organizer](docs/evidencia/pe7-inscriptos-organizer-200.png)

## Entregas

| # | Entrega | Estado |
|---|---------|--------|
| 1 | Refactor arquitectónico inicial | ✅ |
| 2 | Registro seguro de usuarios | ✅ |
| 3 | Autenticación con JWT y cookies | ✅ |
| 4 | Autenticación centralizada con Passport | ✅ |
| 5 | Roles y autorización | ✅ |
| 6 | Entidad events y lógica de negocio | ✅ |
| 7 | Tickets, inscripciones y control de cupos | ✅ |

Cada entrega está marcada con un tag de git (`pre-entrega-1`, `pre-entrega-2`, …) para poder ver el código tal como quedó en cada etapa.
