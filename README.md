# 🏐 Liga de Vóley API

API REST para una **plataforma de torneos de vóley** (ligas, torneos, inscripciones y cupos), desarrollada como proyecto integrador de **Programación Backend II (CoderHouse)**.

Node.js · Express · MongoDB/Mongoose · Passport + JWT en cookie HttpOnly · Nodemailer · arquitectura en capas con **DAO, Repository, Services y DTOs**.

| Documento | Contenido |
|-----------|-----------|
| **Este README** | Temática, arquitectura, instalación, uso, entregas y devoluciones |
| [`docs/API.md`](docs/API.md) | Referencia completa de endpoints con ejemplos, reglas de negocio, roles, Passport y cómo probar |
| [`docs/EVIDENCIA.md`](docs/EVIDENCIA.md) | Capturas de la API funcionando, por pre-entrega |
| [`docs/postman/`](docs/postman) | Colección de Postman con el flujo completo de la entrega final |

## Temática

La plataforma gestiona torneos de vóley organizados en **ligas por división y rama**:

| División | Femenino | Masculino |
|----------|:--------:|:---------:|
| A        | ✅       | ✅        |
| B        | ✅       | ✅        |
| C        | ✅       | ✅        |
| D        | ✅       | ✅        |
| E        | ✅       | ✅        |

La API cubre usuarios con roles, torneos por liga e inscripciones con control de cupos y notificaciones por email.

Cómo se relacionan las entidades del curso con la temática:

| Entidad del curso | En este proyecto |
|-------------------|------------------|
| `User`            | Jugadores, organizadores de torneos y administradores |
| `Event`           | Torneo o fecha de una liga |
| `category` del evento | Liga: división + rama (`A-femenino` … `E-masculino`) |
| `Ticket`          | Inscripción a un torneo |

**Roles:** `admin` (gestiona todo el sistema), `organizer` (crea y administra torneos) y `user` (jugador que consulta torneos y se inscribe).

## Arquitectura

La API está organizada en capas con una sola responsabilidad cada una. Un request baja por las capas y la respuesta vuelve transformada por un DTO:

```
Cliente
  │  HTTP
  ▼
Routes ─────────── URL → middlewares → controller
  ▼
Middlewares ────── autenticación (401) · autorización por rol y propiedad (403) · errores
  ▼
Controllers ────── solo HTTP: arman el DTO de entrada, llaman al service y responden
  │                   ▲
  │  DTO de entrada   │  DTO de salida
  ▼                   │
Services ───────── reglas de negocio: cupos, estados, duplicados, permisos, emails
  ▼
Repositories ───── métodos del dominio: findByEmail, countOccupiedSeats, cancelTicket…
  ▼
DAO ────────────── único acceso a Mongoose: findById, findOne, find, count, create, update
  ▼
Models ─────────── schemas de Mongoose: User, Event, Ticket (relacionados por referencias)
```

Las reglas de capas se verifican automáticamente con [`tests/architecture.test.js`](tests/architecture.test.js), que lee los imports de cada archivo de `src/`:

| Regla | Verificado |
|-------|:----------:|
| Solo los **DAO** importan los modelos de Mongoose | ✅ |
| `mongoose` solo aparece en DAO, modelos y la conexión a la base | ✅ |
| Los **repositories** usan su DAO y no importan modelos | ✅ |
| Los **services** consumen repositories, nunca DAO ni modelos | ✅ |
| Los **controllers** no importan modelos, DAO ni repositories | ✅ |
| Las **rutas** solo conectan URLs con middlewares y controllers | ✅ |

### 1. Persistencia: DAO y Repository

**DAO** ([`src/dao/`](src/dao)): es la **única capa que habla con MongoDB**. `BaseDAO` implementa las operaciones comunes con Mongoose, y cada entidad tiene su DAO:

| DAO | Modelo | Métodos |
|-----|--------|---------|
| `UserDAO` | `User` | `findById`, `findOne`, `find`, `count`, `create`, `update`, `updateOne` (heredados de `BaseDAO`) |
| `EventDAO` | `Event` | Ídem |
| `TicketDAO` | `Ticket` | Ídem + `sumQuantity` (aggregate que suma los cupos de los tickets) |

Un id con formato inválido se trata como "no encontrado" en el DAO, así la API responde `404` y nunca `500`.

**Repository** ([`src/repositories/`](src/repositories)): son **intermediarios entre services y DAO**. Reciben su DAO por constructor y exponen métodos con nombres del dominio. Arman los filtros, populates y consultas para que los services no conozcan detalles de MongoDB:

| Repository | Métodos del dominio |
|------------|---------------------|
| `UserRepository` | `findByEmail`, `findById`, `findAll`, `createUser`, `updateRole` |
| `EventRepository` | `findById`, `findPaginated(criterios, paginación)` (traduce filtros, búsqueda de texto y orden a una consulta de MongoDB), `createEvent`, `updateEvent` |
| `TicketRepository` | `findActiveByUserAndEvent`, `countOccupiedSeats`, `findByUser` (populate del evento), `findByEvent` (populate del usuario, sin password), `createTicket`, `confirmTicket`, `cancelTicket` |

Ejemplo de la cadena para calcular cupos ocupados:

```js
// dao/tickets.dao.js — acceso a datos (Mongoose)
async sumQuantity ({ event, statuses, maxId }) {
  const [result] = await TicketModel.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$quantity' } } }])
  return result?.total ?? 0
}

// repositories/tickets.repository.js — método del dominio
countOccupiedSeats (eventId) {
  return this.dao.sumQuantity({ event: eventId, statuses: ACTIVE_TICKET_STATUSES })
}

// services/tickets.service.js — regla de negocio
if (quantity > event.availableSeats) throw noSeatsError(event.availableSeats, quantity)
```

El desacoplamiento se prueba en [`tests/unit.test.js`](tests/unit.test.js): `EventRepository` funciona con un DAO falso, y `SessionsService` y `EventsService` con repositories falsos en memoria, **sin base de datos**.

### 2. DTOs: datos que entran y salen de la API

**DTOs de entrada** ([`src/dto/request/`](src/dto/request)): los arma el controller (o la estrategia de Passport) con el request. Cada uno **filtra** (toma solo los campos permitidos), **valida** el formato (`400` si algo está mal) y **adapta** los datos antes de que lleguen al service:

| DTO de entrada | Endpoint | Filtra | Valida | Adapta |
|----------------|----------|--------|--------|--------|
| `RegisterUserDTO` | `POST /api/sessions/register` | Solo nombre, apellido, email y password (un `role` en el body se descarta) | Campos obligatorios, formato de email, largo de contraseña | Recorta espacios y normaliza el email |
| `LoginDTO` | `POST /api/sessions/login` | Email y password | Que vengan los dos como texto | Normaliza el email |
| `CreateEventDTO` | `POST /api/events` | Campos editables (`organizer` se ignora) | Obligatorios, liga válida, fecha legible, números | Convierte números y fechas, `status` por defecto `draft` |
| `UpdateEventDTO` | `PUT /api/events/:id` | Solo los campos enviados | Ídem, y que no venga `status` | Ídem |
| `ChangeEventStatusDTO` | `PATCH /api/events/:id/status` | `status` | Que sea un estado existente | — |
| `EventQueryDTO` | `GET /api/events` | Solo los query params conocidos | Tipos, liga, fechas, página, orden permitido | Criterios de búsqueda, `limit` máximo 50, orden y fechas listos para el repository |
| `CreateTicketDTO` | `POST /api/events/:eid/tickets` | `quantity` | Entero mayor a 0 | `1` por defecto |
| `ChangeRoleDTO` | `PATCH /api/users/:uid/role` | `role` | Que sea un rol existente | — |

**DTOs de salida** ([`src/dto/response/`](src/dto/response)): los services devuelven siempre un DTO. **Ninguna respuesta incluye `password`, ni siquiera hasheada, ni campos internos** (`__v`, `updatedAt`). Cuando hay `populate`, el documento relacionado también pasa por un DTO:

| DTO de salida | Campos |
|---------------|--------|
| `CurrentUserDTO` | `id`, `email`, `role` (es `req.user` y la respuesta de `/current`) |
| `UserDTO` | `id`, `first_name`, `last_name`, `email`, `role` |
| `UserSummaryDTO` | `id`, `first_name`, `last_name`, `email` (usuario con populate en los inscriptos) |
| `EventDTO` | `id`, `title`, `description`, `category`, `date`, `location`, `capacity`, `price`, `status`, `organizer` (+ `availableSeats` en el detalle) |
| `EventSummaryDTO` | `id`, `title`, `date`, `location`, `category`, `status` (evento con populate en mis tickets) |
| `TicketDTO` | `id`, `event`, `user`, `quantity`, `status`, `reservationCode`, `createdAt`, `cancelledAt` |

### 3. Services y Controllers

**Controllers** ([`src/controllers/`](src/controllers)): **solo manejan HTTP**. Leen `body`, `params` y `query`, arman el DTO de entrada, llaman al service y devuelven el status code con la respuesta. No calculan cupos, no validan estados ni conocen la base de datos:

```js
// controllers/tickets.controller.js
export const createTicket = async (req, res) => {
  const ticket = await ticketsService.createTicket(req.params.eid, req.user, new CreateTicketDTO(req.body))
  res.status(201).json({ status: 'success', payload: ticket })
}
```

**Services** ([`src/services/`](src/services)): **concentran toda la lógica de negocio**. Reciben DTOs ya validados, usan repositories (inyectados por constructor) y devuelven DTOs de salida:

| Service | Reglas de negocio |
|---------|-------------------|
| `SessionsService` | Email único (`409`), hash bcrypt, rol `user` forzado en el registro, credenciales con mensaje genérico y comparación contra un hash falso para no revelar emails registrados |
| `UsersService` | Listado de usuarios y cambio de rol (el admin no puede cambiarse su propio rol) |
| `EventsService` | Fecha futura, capacidad mayor a 0 y no menor a los cupos ocupados, precio no negativo, transiciones de estado, eventos cancelados o finalizados no editables, borradores no públicos, **permisos sobre eventos propios** (`getManageableEvent`) |
| `TicketsService` | Evento publicado y futuro, cupo suficiente (solo cuentan los tickets activos), una inscripción activa por usuario, control de inscripciones simultáneas, cancelación sin borrado, **permisos sobre tickets propios** (`getCancellableTicket`) y **emails** de confirmación y cancelación |
| `MailService` | Arma y envía los emails con Nodemailer |

Los middlewares de autorización por propiedad (`authorizeEventOwnerOrAdmin`, `authorizeTicketOwnerOrAdmin`) solo delegan en esos métodos de los services. La regla vive en una sola capa.

### Manejo de errores

Los services y los DTOs lanzan `AppError(mensaje, código)`, y el middleware centralizado [`errorHandler`](src/middlewares/errorHandler.middleware.js) responde siempre `{ "status": "error", "message": "..." }`:

| Código | Cuándo |
|--------|--------|
| `400` | Datos o parámetros inválidos (DTO de entrada o regla de negocio) |
| `401` | Sin sesión o token inválido |
| `403` | Con sesión pero sin permiso (rol o propiedad del recurso) |
| `404` | Recurso inexistente o id inválido |
| `409` | Conflicto con el estado actual (email registrado, inscripción duplicada, sin cupo, evento cancelado) |
| `500` | Error inesperado (en producción no se muestra el detalle) |

## Estructura de carpetas

```
CoderHouse_Backend2/
├── src/
│   ├── app.js                  # configura Express, Passport y rutas (no levanta el server)
│   ├── server.js               # valida el entorno, conecta la base y levanta el server
│   ├── config/                 # entorno, conexión a MongoDB, Passport, Nodemailer, roles y permisos, constantes
│   ├── routes/                 # sessions, events, tickets, users, health
│   ├── middlewares/            # authenticate, authorizeRoles, propiedad de recursos, errores, 404
│   ├── controllers/            # solo HTTP
│   ├── services/               # reglas de negocio: sessions, users, events, tickets, mail
│   ├── repositories/           # UserRepository, EventRepository, TicketRepository
│   ├── dao/                    # BaseDAO, UserDAO, EventDAO, TicketDAO
│   ├── dto/
│   │   ├── request/            # DTOs de entrada: filtran, validan y adaptan
│   │   └── response/           # DTOs de salida: sin datos sensibles
│   ├── models/                 # User, Event, Ticket (Mongoose)
│   ├── utils/                  # hash (bcrypt), jwt, validadores, errores, códigos de reserva
│   ├── scripts/setRole.js      # npm run set-role
│   └── public/index.html       # página de inicio para probar la API (Bootstrap)
├── tests/                      # npm test: arquitectura, unitarios e integración
├── docs/                       # API.md, EVIDENCIA.md y capturas
├── .env.example
├── .gitignore
└── package.json
```

## Tecnologías

- Node.js (ESM: `import` / `export`)
- Express 5
- MongoDB Atlas + Mongoose
- bcrypt (hash de contraseñas)
- Passport.js (`passport-local` y `passport-jwt`)
- jsonwebtoken (JWT)
- cookie-parser (cookie de autenticación)
- Nodemailer (emails de confirmación y cancelación de inscripción)
- node:test + supertest + mongodb-memory-server (tests automatizados)
- Postman (colección con el flujo completo)
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

# cargar usuarios y torneos de prueba
npm run seed

# asignar un rol a un usuario registrado
npm run set-role -- admin@mail.com admin

# tests automatizados (no necesitan .env ni MongoDB)
npm test
```

Con el servidor levantado, en `http://localhost:8080/` hay una página de inicio con las rutas disponibles y formularios para probar registro, login, `current` y logout.

### Usuarios de prueba

```bash
npm run seed
```

Crea estos usuarios en la base configurada en `MONGO_URL`. Todos tienen la contraseña **`Voley2026`**:

| Rol | Email | Para probar |
|-----|-------|-------------|
| `admin` | `admin@ligavoley.test` | Ver usuarios, cambiar roles, modificar cualquier torneo |
| `organizer` | `organizador@ligavoley.test` | Crear y gestionar sus torneos |
| `organizer` | `organizadora@ligavoley.test` | Dueña del "Torneo de Primavera" (sirve para probar el 403 sobre un evento ajeno) |
| `user` | `jugadora@ligavoley.test` | Inscribirse a torneos |
| `user` | `jugador@ligavoley.test` | Ya ocupa el único cupo de la "Copa Relámpago" (sirve para probar la inscripción sin cupo) |

También crea **11 torneos**: 10 publicados en distintas ligas (alcanzan para probar la paginación) y un borrador. El seed pasa por los mismos services y DTOs que la API, no envía emails y se puede correr varias veces sin duplicar datos.

Para crear usuarios a mano: registrarlos con `POST /api/sessions/register` (siempre quedan como `user`) y asignar el rol con `npm run set-role -- <email> <user|organizer|admin>`. Un admin también puede cambiar roles con `PATCH /api/users/:uid/role`.

> Los usuarios del seed tienen emails ficticios. Para **recibir el email de confirmación**, registrá un usuario con tu propio email (con `MAIL_*` configurado en el `.env`).

## Tests automatizados

```bash
npm test
```

Son **57 tests** hechos con `node:test` (el runner que trae Node). Los de integración usan `supertest` y hacen requests HTTP reales contra la app:

- Cada archivo levanta su propio **MongoDB en memoria** (`mongodb-memory-server`). No hace falta `.env` ni conexión a Atlas, y no se toca ninguna base real.
- Los **emails se reemplazan por mocks**: no se envía ningún mail, pero los tests verifican que se dispararon el de confirmación y el de cancelación.
- La primera vez, `mongodb-memory-server` descarga el binario de MongoDB (unos 800 MB). Después queda en caché.

| Archivo | Qué cubre |
|---------|-----------|
| [`final-flow.test.js`](tests/final-flow.test.js) | Los **10 casos del "Flujo completo a verificar"** de la entrega final, en orden |
| [`architecture.test.js`](tests/architecture.test.js) | Reglas de capas leyendo los imports de `src/`: solo los DAO usan modelos y mongoose, los repositories usan su DAO, los services no usan DAO ni modelos, los controllers no usan modelos, DAO ni repositories |
| [`unit.test.js`](tests/unit.test.js) | Sin base de datos: DTOs de entrada (filtrado, validación y adaptación), DTOs de salida sin datos sensibles (también con populate) y services/repositories con dependencias falsas en memoria |
| [`auth.test.js`](tests/auth.test.js) | Registro sin `password` y con email normalizado, duplicado `409`, validaciones `400`, cookie `currentUser` HttpOnly, `/current` con `{ id, email, role }`, credenciales inválidas con mensaje genérico, logout → `401`, token manipulado → `401` |
| [`authorization.test.js`](tests/authorization.test.js) | `401` sin sesión en todas las rutas privadas; `403` con rol insuficiente (crear evento como user, ver usuarios como organizer, cambiar roles como organizer); modificar evento ajeno (`403` organizer / `200` admin); cancelar ticket ajeno (`403` user / `200` admin); un cambio de rol aplica en la misma sesión |
| [`events.test.js`](tests/events.test.js) | Fecha pasada, `capacity` y `price` inválidos `400`; `organizer` del body ignorado y respuesta con la forma del DTO; evento cancelado `409`; transiciones inválidas `409`; borradores no públicos; filtros, paginación y orden; parámetros inválidos `400`; `404` sin errores `500` |
| [`tickets.test.js`](tests/tickets.test.js) | Inscripción `201` + email; duplicada `409`; sin cupo `409`; evento cancelado `409` e inexistente `404`; cancelación con `cancelledAt`, email y cupo liberado; cancelar dos veces `409`; inscriptos solo para dueño o admin y sin `password`; `my-tickets` con el DTO del evento; 8 inscripciones simultáneas con cupo 3 → exactamente 3 confirmadas |

## Endpoints

Resumen de las rutas. El detalle de cada una, con ejemplos de request/response y errores, está en [`docs/API.md`](docs/API.md).

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

Las rutas 🔒 responden **`401`** sin sesión y **`403`** con sesión pero sin permiso.

**Flujo de autenticación:** registro → login (Passport `login` valida, el controller firma el JWT y lo guarda en la cookie `currentUser` HttpOnly) → rutas privadas (Passport `current` lee la cookie y deja el usuario en `req.user`) → logout (borra la cookie).

**Flujo de inscripción:** organizer crea un torneo publicado → user `POST /api/events/:eid/tickets` → se valida torneo, cupo y duplicados → ticket `confirmed` + email → `GET /api/tickets/my-tickets` → `PATCH /api/tickets/:tid/cancel` libera el cupo y envía un email de cancelación.

## Ejemplos de uso

Con `curl`, `-c` guarda la cookie de sesión y `-b` la envía (en Windows, `curl.exe` desde PowerShell). Más ejemplos y todos los errores posibles en [`docs/API.md`](docs/API.md).

**Login como organizador y crear un torneo:**

```bash
curl -c cookies-org.txt -X POST http://localhost:8080/api/sessions/login -H "Content-Type: application/json" -d "{\"email\":\"organizador@ligavoley.test\",\"password\":\"Voley2026\"}"
curl -b cookies-org.txt -X POST http://localhost:8080/api/events -H "Content-Type: application/json" -d "{\"title\":\"Copa Primavera\",\"description\":\"Fecha 1\",\"category\":\"A-femenino\",\"date\":\"2030-03-15T21:00:00Z\",\"location\":\"Club Ferro\",\"capacity\":12,\"price\":5000,\"status\":\"published\"}"
```

```json
{ "status": "success", "payload": { "id": "6690…", "title": "Copa Primavera", "category": "A-femenino", "date": "2030-03-15T21:00:00.000Z", "location": "Club Ferro", "capacity": 12, "price": 5000, "status": "published", "organizer": "665f…" } }
```

**Listado paginado** (`GET /api/events?status=published&page=2&limit=5`):

```json
{ "status": "success", "data": [ { "id": "6690…", "title": "Liga de Ascenso C-femenino", "status": "published", "…": "…" } ], "page": 2, "limit": 5, "total": 10, "totalPages": 2 }
```

**Inscribirse como jugadora** (`POST /api/events/:eid/tickets`) → `201`, ticket confirmado y email de confirmación:

```bash
curl -c cookies-jug.txt -X POST http://localhost:8080/api/sessions/login -H "Content-Type: application/json" -d "{\"email\":\"jugadora@ligavoley.test\",\"password\":\"Voley2026\"}"
curl -b cookies-jug.txt -X POST http://localhost:8080/api/events/<id del torneo>/tickets
```

```json
{ "status": "success", "payload": { "id": "66a1…", "event": "6690…", "user": "665f…", "quantity": 1, "status": "confirmed", "reservationCode": "VOL-7QK2MX", "createdAt": "…", "cancelledAt": null } }
```

Un ticket `confirmed` es una **inscripción activa** (los estados son `pending`, `confirmed` y `cancelled`, ver [`docs/API.md`](docs/API.md#estados)).

**Inscripción duplicada o sin cupo** → `409`:

```json
{ "status": "error", "message": "Ya tenés una inscripción activa a este evento" }
{ "status": "error", "message": "No quedan cupos disponibles para este evento" }
```

## Colección de Postman

[`docs/postman/liga-voley.postman_collection.json`](docs/postman/liga-voley.postman_collection.json) recorre los 10 casos del flujo completo, con **61 tests automáticos** (status, mensajes, cookie HttpOnly, cupos y ausencia de `password`):

1. `npm run seed` y `npm run dev`.
2. En Postman: **Import** → elegir el archivo de la colección.
3. Revisar la variable `baseUrl` (por defecto `http://localhost:8080`).
4. **Run collection** para correrla completa en orden. Postman guarda la cookie de sesión solo después de cada login.

Para recibir el email de la inscripción, cambiar las variables `playerEmail` y `playerPassword` por las de un usuario registrado con tu email. La colección se puede correr varias veces seguidas.

## Flujo completo verificado

Los 10 casos de la consigna de la entrega final están cubiertos por el test [`final-flow.test.js`](tests/final-flow.test.js) y por la colección de Postman (una carpeta por caso):

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Registro → login → `/current` → logout → `/current` | `201` → `200` → `200` → `200` → `401` |
| 2 | `user` intenta crear un evento | `403` |
| 3 | `organizer` crea evento → `user` se inscribe → email → cupo descontado | `201` → `201` + email de confirmación → `availableSeats` baja en 1 |
| 4 | `user` se inscribe de nuevo al mismo evento | `409` – Ya tenés una inscripción activa a este evento |
| 5 | `user` se inscribe a un evento sin cupo | `409` – No quedan cupos disponibles para este evento |
| 6 | `user` cancela su ticket → cupo liberado → nueva inscripción | `200` (`cancelled`) → `availableSeats` vuelve a subir → `201` |
| 7 | `organizer` modifica un evento ajeno | `403` |
| 8 | `admin` modifica el evento de otro organizador | `200` |
| 9 | Respuestas de usuario, evento y ticket | Ninguna contiene `password` ni un hash |
| 10 | `GET /api/events?status=published&page=2&limit=5` | `200` con `data`, `page`, `limit`, `total` y `totalPages` |

## Roles y permisos

| Acción | `user` | `organizer` | `admin` |
|--------|:------:|:-----------:|:-------:|
| Consultar torneos publicados | ✅ | ✅ | ✅ |
| Inscribirse, ver y cancelar sus inscripciones | ✅ | ✅ | ✅ |
| Crear torneos | ❌ | ✅ | ✅ |
| Modificar, cambiar el estado y ver inscriptos de sus torneos | ❌ | ✅ | ✅ |
| Modificar cualquier torneo y cancelar cualquier inscripción | ❌ | ❌ | ✅ |
| Ver usuarios y cambiar roles | ❌ | ❌ | ✅ |

La matriz está en [`src/config/permissions.js`](src/config/permissions.js). El detalle de middlewares y la diferencia 401/403 está en [`docs/API.md`](docs/API.md#roles-y-autorización).

## Seguridad del repositorio

- El archivo **`.env` no se sube** al repositorio: está en el `.gitignore` y contiene las credenciales reales (MongoDB, `JWT_SECRET`, email).
- En el repo solo está **`.env.example`**, con las variables necesarias y valores de ejemplo.
- **`node_modules` tampoco se sube**: se instala con `npm install`.
- **Ninguna credencial está escrita en el código**: todo se lee de variables de entorno (`src/config/config.js`).
- Las contraseñas de los usuarios se guardan **hasheadas con bcrypt** y **ninguna respuesta de la API incluye `password`**.

## Entregas

Cada pre-entrega está marcada con un **tag de git** que apunta al commit exacto con el que se entregó. Así se puede revisar el código tal como quedó en cada etapa:

| # | Entrega | Tag | Ver en GitHub |
|---|---------|-----|---------------|
| 1 | Refactor arquitectónico inicial | `pre-entrega-1` | [código](https://github.com/IngNicolasCosta/CoderHouse_Backend2/tree/pre-entrega-1) |
| 2 | Registro seguro de usuarios | `pre-entrega-2` | [código](https://github.com/IngNicolasCosta/CoderHouse_Backend2/tree/pre-entrega-2) |
| 3 | Autenticación con JWT y cookies | `pre-entrega-3` | [código](https://github.com/IngNicolasCosta/CoderHouse_Backend2/tree/pre-entrega-3) |
| 4 | Autenticación centralizada con Passport | `pre-entrega-4` | [código](https://github.com/IngNicolasCosta/CoderHouse_Backend2/tree/pre-entrega-4) |
| 5 | Roles y autorización | `pre-entrega-5` | [código](https://github.com/IngNicolasCosta/CoderHouse_Backend2/tree/pre-entrega-5) |
| 6 | Entidad events y lógica de negocio | `pre-entrega-6` | [código](https://github.com/IngNicolasCosta/CoderHouse_Backend2/tree/pre-entrega-6) |
| 7 | Tickets, inscripciones y control de cupos | `pre-entrega-7` | [código](https://github.com/IngNicolasCosta/CoderHouse_Backend2/tree/pre-entrega-7) |
| 8 | Arquitectura con DAO, Repository y DTO | `pre-entrega-8` | [código](https://github.com/IngNicolasCosta/CoderHouse_Backend2/tree/pre-entrega-8) |
| Final | API Backend plataforma de eventos | `entrega-final` | [código](https://github.com/IngNicolasCosta/CoderHouse_Backend2/tree/entrega-final) |

Para ver una entrega en tu copia local:

```bash
git fetch --tags
git checkout pre-entrega-3   # el proyecto queda como en la pre-entrega 3
git checkout main            # volver a la versión actual
```

Para ver solo los cambios de una entrega respecto de la anterior:

```bash
git diff pre-entrega-2 pre-entrega-3 --stat
```

La rama `main` tiene siempre la versión más reciente, con las mejoras de las devoluciones aplicadas encima de la última pre-entrega.

## Devoluciones aplicadas

Mejoras hechas a partir de las correcciones de las pre-entregas:

| Pre-entrega | Devolución | Cambio aplicado |
|-------------|------------|-----------------|
| 1 | La conexión a MongoDB delegaba el manejo de errores al `try/catch` de `server.js` | `connectDB` maneja sus propios errores y los traduce a mensajes que dicen qué revisar: `MONGO_URL` con formato inválido, usuario o contraseña incorrectos, host inexistente, conexión rechazada o timeout (con la pista de Network Access en Atlas). Además avisa si la conexión se pierde o se recupera con el servidor andando ([`database.js`](src/config/database.js)) |
| 3 | Documentar qué tag corresponde a cada pre-entrega | Tabla de tags con links y comandos `git checkout` / `git diff` ([Entregas](#entregas)) |
| 3 | Mostrar cómo verificar la cookie HttpOnly con curl | Sección [Verificar la cookie HttpOnly con curl](docs/API.md#verificar-la-cookie-httponly-con-curl): header `Set-Cookie`, marca `#HttpOnly_` en el archivo de cookies y reutilización entre login, `/current` y logout |
| 5 | Faltaban tests automatizados | Tests de integración con `npm test` ([Tests automatizados](#tests-automatizados)), incluidos todos los casos de 401/403 sugeridos |
| 7 | Faltaba el email al cancelar una inscripción | `mailService.sendTicketCancellation`, que se dispara al cancelar un ticket y aclara si lo canceló un admin ([Emails](docs/API.md#emails-nodemailer)) |
| 8 | Los criterios de DAO/Repository, DTOs y Services/Controllers quedaron sin una evaluación completa | **DTOs de entrada** (`src/dto/request/`) que filtran, validan y adaptan todo lo que llega a la API, además de los de salida (`src/dto/response/`). **Services con solo reglas de negocio** y controllers con solo HTTP. **EventRepository** arma las consultas de MongoDB, así ningún service usa sintaxis de Mongo. **Tests de arquitectura** que verifican las reglas de capas y **tests con dependencias falsas** que prueban el desacoplamiento. README reorganizado con la [arquitectura](#arquitectura) al principio y el detalle de la API en [`docs/API.md`](docs/API.md) |

## Evidencia

Las capturas de la API funcionando contra MongoDB Atlas, agrupadas por pre-entrega, están en [`docs/EVIDENCIA.md`](docs/EVIDENCIA.md).
