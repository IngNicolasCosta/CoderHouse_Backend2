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
| `Event`           | Torneo o fecha de una liga (división + rama) |
| `Category`        | Liga (A–E, femenino / masculino) |
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
│   │   ├── database.js         # conexión a MongoDB
│   │   ├── passport.config.js  # estrategias de Passport: register, login y current
│   │   └── permissions.js      # roles y matriz de permisos
│   ├── routes/
│   │   ├── health.router.js
│   │   ├── events.router.js    # rutas de eventos protegidas con authenticate + authorizeRoles
│   │   ├── sessions.router.js
│   │   └── users.router.js     # rutas administrativas (solo admin)
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   ├── sessions.controller.js
│   │   └── users.controller.js
│   ├── services/
│   │   ├── events.service.js
│   │   ├── sessions.service.js     # reglas de negocio: alta de usuario, credenciales, usuario de la sesión
│   │   └── users.service.js        # listado de usuarios y cambio de rol
│   ├── repositories/
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── dao/
│   │   ├── events.dao.js
│   │   └── users.dao.js
│   ├── models/
│   │   ├── User.js
│   │   └── Event.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      # authenticate (401) y passportCall
│   │   ├── authorize.middleware.js # authorizeRoles (403) y authorizeEventOwnerOrAdmin
│   │   ├── notFound.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── scripts/
│   │   └── setRole.js          # npm run set-role: asigna un rol (para crear el primer admin)
│   ├── utils/
│   │   ├── hash.js             # createHash / isValidPassword (bcrypt)
│   │   ├── jwt.js              # generateToken (lo usa el controller de login)
│   │   ├── validators.js       # validación de datos de registro/login y normalización de email
│   │   └── errors.js           # AppError con código HTTP y mensajes de error
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
| GET    | `/api/events`                 | Listado de torneos publicados                 | Pública |
| POST   | `/api/events`                 | Crear un torneo                               | 🔒 `organizer`, `admin` |
| PUT    | `/api/events/:eventId`        | Modificar un torneo                           | 🔒 dueño (`organizer`) o `admin` |
| PATCH  | `/api/events/:eventId/cancel` | Cancelar un torneo                            | 🔒 dueño (`organizer`) o `admin` |
| POST   | `/api/sessions/register`      | Registro de usuario                           | Pública |
| POST   | `/api/sessions/login`         | Login: genera el JWT y lo guarda en la cookie | Pública |
| GET    | `/api/sessions/current`       | Datos del usuario autenticado                 | 🔒 cualquier usuario con sesión |
| POST   | `/api/sessions/logout`        | Cierra la sesión borrando la cookie           | Pública |
| GET    | `/api/users`                  | Listado de todos los usuarios                 | 🔒 `admin` |
| PATCH  | `/api/users/:uid/role`        | Cambiar el rol de un usuario                  | 🔒 `admin` |

Todas las respuestas tienen el formato `{ "status": "success" | "error", ... }`. Una ruta inexistente devuelve `404`.

Las rutas 🔒 responden **`401`** si no hay sesión y **`403`** si hay sesión pero el rol no tiene permiso (ver [Roles y autorización](#roles-y-autorización)).

### `GET /api/health`

Response `200`:

```json
{ "status": "ok", "message": "Servidor activo" }
```

### `GET /api/events`

Devuelve solo los torneos con `status: "published"`.

Response `200`:

```json
{ "status": "success", "payload": [ { "id": "6690...", "title": "Torneo Apertura", "division": "A", "gender": "femenino", "status": "published", "organizer": "665f2a...", "...": "..." } ] }
```

### `POST /api/events` 🔒 organizer, admin

| Campo         | Tipo   | Obligatorio | Reglas |
|---------------|--------|:-----------:|--------|
| `title`       | string | ✅ | |
| `division`    | string | ✅ | `A`, `B`, `C`, `D` o `E` |
| `gender`      | string | ✅ | `femenino` o `masculino` |
| `date`        | fecha  | ✅ | ISO 8601, por ejemplo `2026-11-15T10:00:00Z` |
| `location`    | string | ✅ | Sede |
| `capacity`    | number | ✅ | Cupo de equipos, mínimo 1 |
| `description` | string | | |
| `status`      | string | | `draft` (por defecto), `published`, `cancelled` o `finished` |

El `organizer` **no se toma del body**: siempre es el usuario autenticado.

Request:

```json
{ "title": "Torneo Apertura", "division": "A", "gender": "femenino", "date": "2026-11-15T10:00:00Z", "location": "Club Ferro", "capacity": 12, "status": "published" }
```

Response `201`:

```json
{ "status": "success", "payload": { "id": "6690...", "title": "Torneo Apertura", "division": "A", "gender": "femenino", "date": "2026-11-15T10:00:00.000Z", "location": "Club Ferro", "capacity": 12, "status": "published", "organizer": "665f2a..." } }
```

Response `400` – datos inválidos:

```json
{ "status": "error", "message": "Datos inválidos en: capacity, date" }
```

Response `401` sin sesión / `403` con rol `user`:

```json
{ "status": "error", "message": "No autenticado" }
{ "status": "error", "message": "No tenés permisos para realizar esta acción" }
```

### `PUT /api/events/:eventId` 🔒 dueño o admin

Recibe los mismos campos que `POST /api/events` (todos opcionales) y devuelve el torneo actualizado (`200`).

Response `403` – un organizer intenta modificar un torneo de otro organizer:

```json
{ "status": "error", "message": "No tenés permisos para modificar este evento" }
```

Response `404`:

```json
{ "status": "error", "message": "Evento no encontrado" }
```

### `PATCH /api/events/:eventId/cancel` 🔒 dueño o admin

Pasa el torneo a `status: "cancelled"` y lo devuelve (`200`). Mismos errores `401`, `403` y `404` que el `PUT`.

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
| Modificar / cancelar torneos propios | ❌ | ✅ | ✅ | `PUT /api/events/:eventId`, `PATCH /api/events/:eventId/cancel` |
| Modificar / cancelar cualquier torneo | ❌ | ❌ | ✅ | ídem |
| Ver todos los usuarios              | ❌ | ❌ | ✅ | `GET /api/users` |
| Cambiar el rol de un usuario        | ❌ | ❌ | ✅ | `PATCH /api/users/:uid/role` |

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

```js
router.put(
  '/:eventId',
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
| `POST /api/events` con rol `user` | `403` – No tenés permisos para realizar esta acción |
| `POST /api/events` con rol `organizer` | `201`, con `organizer` = usuario autenticado |
| `GET /api/users` con rol `organizer` | `403` |
| `GET /api/users` con rol `admin` | `200`, sin `password` |
| Rutas privadas (`POST /api/events`, `PUT /api/events/:id`, `GET /api/users`, `/current`) sin cookie | `401` – No autenticado |
| `organizer` modifica o cancela un torneo de otro organizer | `403` – No tenés permisos para modificar este evento |
| `organizer` modifica su propio torneo / `admin` modifica uno ajeno | `200` |
| Body con `organizer` de otro usuario al crear o modificar | Se ignora |
| Torneo inexistente o id inválido | `404` – Evento no encontrado |
| Torneo con datos inválidos | `400` – Datos inválidos en: ... |
| `organizer` intenta cambiar un rol | `403` |
| `admin` cambia su propio rol / rol inexistente | `400` |
| `admin` promueve un `user` a `organizer` | `200` y la misma sesión ya puede crear torneos |

## Entregas

| # | Entrega | Estado |
|---|---------|--------|
| 1 | Refactor arquitectónico inicial | ✅ |
| 2 | Registro seguro de usuarios | ✅ |
| 3 | Autenticación con JWT y cookies | ✅ |
| 4 | Autenticación centralizada con Passport | ✅ |
| 5 | Roles y autorización | ✅ |
| 6 | Entidad events y lógica de negocio | ⏳ |
| 7 | Tickets, inscripciones y control de cupos | ⏳ |

Cada entrega está marcada con un tag de git (`pre-entrega-1`, `pre-entrega-2`, …) para poder ver el código tal como quedó en cada etapa.
