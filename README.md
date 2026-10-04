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
- MongoDB + Mongoose
- bcrypt (hash de contraseñas)
- dotenv
- Bootstrap 5 (página de inicio)

## Instalación

```bash
git clone <url-del-repositorio>
cd CoderHouse_Backend2
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

```bash
cp .env.example .env
```

| Variable     | Descripción                                   | Ejemplo |
|--------------|-----------------------------------------------|---------|
| `PORT`       | Puerto donde escucha el servidor              | `8080` |
| `NODE_ENV`   | Entorno de ejecución                          | `development` |
| `MONGO_URL`  | Cadena de conexión a MongoDB (Atlas o local)  | `mongodb://localhost:27017/voley-liga` |
| `JWT_SECRET` | Secreto para firmar tokens JWT (próximas entregas) | `un_secreto_largo` |
| `BCRYPT_SALT_ROUNDS` | Costo del hash de contraseñas (opcional, por defecto `10`) | `10` |

> El servidor necesita `MONGO_URL` para iniciar: si falta o la conexión falla, se detiene mostrando el error.

## Ejecución

```bash
# desarrollo (se reinicia al guardar cambios)
npm run dev

# producción
npm start
```

Con el servidor levantado, en `http://localhost:8080/` hay una página de inicio con las rutas disponibles y botones para probar la API.

## Estructura de carpetas

```
CoderHouse_Backend2/
├── src/
│   ├── app.js                  # configura Express, middlewares y rutas (NO levanta el server)
│   ├── server.js               # conecta la base de datos y levanta el servidor
│   ├── config/
│   │   ├── config.js           # lectura de variables de entorno (dotenv)
│   │   └── database.js         # conexión a MongoDB
│   ├── routes/
│   │   ├── health.router.js
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js
│   ├── services/
│   │   ├── events.service.js
│   │   └── sessions.service.js     # reglas de negocio del registro
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
│   │   ├── notFound.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── validateRegister.middleware.js   # validación de entrada del registro
│   ├── utils/
│   │   ├── hash.js             # createHash / isValidPassword (bcrypt)
│   │   ├── validators.js       # validación y normalización de email
│   │   └── errors.js           # AppError con código HTTP
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

## Rutas disponibles

| Método | Ruta                      | Descripción                         | Estado |
|--------|---------------------------|-------------------------------------|--------|
| GET    | `/`                       | Página de inicio                    | ✅ |
| GET    | `/api/health`             | Estado del servidor                 | ✅ |
| GET    | `/api/events`             | Listado de torneos                  | ✅ |
| POST   | `/api/sessions/register`  | Registro de usuario                 | ✅ |
| POST   | `/api/sessions/login`     | Login                               | 🚧 `501` |
| GET    | `/api/sessions/current`   | Usuario autenticado actual          | 🚧 `501` |
| POST   | `/api/sessions/logout`    | Logout                              | 🚧 `501` |

### Ejemplos

`GET /api/health` → `200`

```json
{ "status": "ok", "message": "Servidor activo" }
```

`GET /api/events` → `200`

```json
{ "status": "success", "payload": [] }
```

## Registro de usuarios

`POST /api/sessions/register`

### Campos que espera (body JSON)

| Campo        | Tipo   | Obligatorio | Reglas |
|--------------|--------|:-----------:|--------|
| `first_name` | string | ✅ | No puede estar vacío |
| `last_name`  | string | ✅ | No puede estar vacío |
| `email`      | string | ✅ | Formato de email válido. Se guarda normalizado (sin espacios y en minúsculas) |
| `password`   | string | ✅ | Mínimo 8 caracteres. Se guarda hasheada con bcrypt |

- El `role` **no se puede elegir** desde el registro público: siempre se crea como `user`, aunque el body traiga otro valor.
- La respuesta **nunca incluye la contraseña**, ni en texto plano ni hasheada.

### Respuestas

`201` – usuario creado:

```json
{ "status": "success", "payload": { "id": "665f2a...", "first_name": "Ana", "last_name": "Pérez", "email": "ana@mail.com", "role": "user" } }
```

`400` – datos inválidos (uno de estos mensajes):

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
{ "status": "error", "message": "El formato del email es inválido" }
{ "status": "error", "message": "La contraseña debe tener al menos 8 caracteres" }
```

`409` – email ya registrado:

```json
{ "status": "error", "message": "El email ya está registrado" }
```

### Cómo probarlo

**Desde la página de inicio:** con el servidor levantado, en `http://localhost:8080/` hay un formulario de registro que muestra la respuesta del endpoint.

**Con Postman / Insomnia:** `POST http://localhost:8080/api/sessions/register` con body *raw → JSON*:

```json
{ "first_name": "Ana", "last_name": "Pérez", "email": "Ana@Mail.com ", "password": "Secreta123" }
```

**Con curl:**

```bash
curl -X POST http://localhost:8080/api/sessions/register -H "Content-Type: application/json" -d "{\"first_name\":\"Ana\",\"last_name\":\"Pérez\",\"email\":\"Ana@Mail.com \",\"password\":\"Secreta123\"}"
```

### Casos probados

| # | Caso | Resultado esperado |
|---|------|--------------------|
| 1 | Registro exitoso | `201`, email normalizado, `role: "user"`, sin `password` |
| 2 | Campos faltantes o vacíos | `400` – Faltan campos obligatorios |
| 3 | Email con formato inválido | `400` – El formato del email es inválido |
| 4 | Email ya registrado (aunque cambien mayúsculas/minúsculas) | `409` – El email ya está registrado |
| 5 | Contraseña en la base de datos | Hash bcrypt (`$2b$10$...`), nunca texto plano |
| 6 | Respuesta del endpoint | No incluye el campo `password` |
| + | Body con `"role": "admin"` | Se ignora: el usuario se crea como `user` |

## Entregas

| # | Entrega | Estado |
|---|---------|--------|
| 1 | Refactor arquitectónico inicial | ✅ |
| 2 | Registro seguro de usuarios | ✅ |
| 3 | Autenticación con JWT y cookies | ⏳ |
| 4 | Autenticación centralizada con Passport | ⏳ |
| 5 | Roles y autorización | ⏳ |
| 6 | Entidad events y lógica de negocio | ⏳ |
| 7 | Tickets, inscripciones y control de cupos | ⏳ |

Cada entrega está marcada con un tag de git (`pre-entrega-1`, `pre-entrega-2`, …) para poder ver el código tal como quedó en cada etapa.
