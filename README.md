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
│   │   └── events.service.js
│   ├── repositories/
│   │   └── events.repository.js
│   ├── dao/
│   │   └── events.dao.js
│   ├── models/
│   │   ├── User.js
│   │   └── Event.js
│   ├── middlewares/
│   │   ├── notFound.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── utils/
│   └── public/
│       └── index.html          # página de inicio (Bootstrap)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Flujo de una petición:

```
Cliente → Router → Controller → Service → Repository → DAO → Model (MongoDB)
```

## Rutas disponibles

| Método | Ruta                      | Descripción                         | Estado |
|--------|---------------------------|-------------------------------------|--------|
| GET    | `/`                       | Página de inicio                    | ✅ |
| GET    | `/api/health`             | Estado del servidor                 | ✅ |
| GET    | `/api/events`             | Listado de torneos                  | ✅ |
| POST   | `/api/sessions/register`  | Registro de usuario                 | 🚧 `501` |
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

## Entregas

| # | Entrega | Estado |
|---|---------|--------|
| 1 | Refactor arquitectónico inicial | ✅ |
| 2 | Registro seguro de usuarios | ⏳ |
| 3 | Autenticación con JWT y cookies | ⏳ |
| 4 | Autenticación centralizada con Passport | ⏳ |
| 5 | Roles y autorización | ⏳ |
| 6 | Entidad events y lógica de negocio | ⏳ |
| 7 | Tickets, inscripciones y control de cupos | ⏳ |
