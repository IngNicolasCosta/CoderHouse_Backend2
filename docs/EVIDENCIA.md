# Evidencia

Capturas de la API funcionando contra MongoDB Atlas, tomadas desde la página de inicio (`http://localhost:8080/`). Las imágenes están en [`docs/evidencia/`](evidencia/).

### Pre-entrega 1 – Estructura base

`GET /api/health` → `200`

![GET /api/health](evidencia/pe1-health.png)

### Pre-entrega 2 – Registro seguro

Registro → `201`, con el email normalizado y **sin `password`** en la respuesta:

![Registro sin password](evidencia/pe2-registro.png)

Usuarios en MongoDB Atlas, con la contraseña **hasheada con bcrypt** (`$2b$10$…`) y no en texto plano:

![Contraseña hasheada en Atlas](evidencia/pe2-atlas-hash.png)

### Pre-entrega 3 – JWT y cookies

Login → `200`:

![Login](evidencia/pe3-login.png)

Cookie `currentUser` con **HttpOnly** y SameSite `Lax`:

![Cookie currentUser HttpOnly](evidencia/pe3-cookie.png)

`GET /api/sessions/current` con la cookie → `200` con `{ id, email, role }`:

![current 200](evidencia/pe3-current-200.png)

`GET /api/sessions/current` sin cookie → `401`:

![current 401](evidencia/pe3-current-401.png)

### Pre-entrega 4 – Passport

Flujo completo con las estrategias de Passport: registro (PE2) → login → `current` `200` (PE3) → **logout** → `current` `401` (PE3).

![Logout](evidencia/pe4-logout.png)

### Pre-entrega 5 – Roles y autorización

`POST /api/events` con rol `user` → `403`:

![Crear evento como user](evidencia/pe5-crear-evento-user-403.png)

`POST /api/events` con rol `organizer` → `201`, con `organizer` igual al usuario autenticado:

![Crear evento como organizer](evidencia/pe5-crear-evento-organizer-201.png)

`GET /api/users` con rol `organizer` → `403`:

![Usuarios como organizer](evidencia/pe5-users-organizer-403.png)

`GET /api/users` con rol `admin` → `200`:

![Usuarios como admin](evidencia/pe5-users-admin-200.png)

### Pre-entrega 6 – Eventos y lógica de negocio

Un `admin` modifica el torneo de otro organizador → `200`:

![Admin modifica torneo ajeno](evidencia/pe6-admin-modifica-ajeno-200.png)

Un `organizer` intenta modificar un torneo ajeno → `403`:

![Organizer modifica torneo ajeno](evidencia/pe6-organizer-modifica-ajeno-403.png)

Cambiar el estado de un torneo cancelado → `409`:

![Estado de torneo cancelado](evidencia/pe6-estado-cancelado-409.png)

Listado con filtros y paginación, con `data`, `page`, `limit`, `total` y `totalPages`:

![Listado paginado](evidencia/pe6-listado-paginado.png)

### Pre-entrega 7 – Inscripciones y cupos

Inscripción → `201`, ticket `confirmed` con código de reserva:

![Inscripción](evidencia/pe7-inscripcion-201.png)

Email de confirmación recibido (Nodemailer):

![Email de confirmación](evidencia/pe7-email.png)

Inscripción duplicada → `409`:

![Inscripción duplicada](evidencia/pe7-duplicada-409.png)

Sin cupo suficiente → `409` con mensaje claro:

![Sin cupo](evidencia/pe7-sin-cupo-409.png)

Un `user` intenta ver los inscriptos de un torneo → `403`:

![Inscriptos como user](evidencia/pe7-inscriptos-user-403.png)

Cancelación propia → `200`, con `status: cancelled` y `cancelledAt` (el ticket no se borra):

![Cancelar inscripción](evidencia/pe7-cancelar-200.png)

Nueva inscripción al mismo torneo → `201`: el cupo se liberó al cancelar:

![Reinscripción](evidencia/pe7-reinscripcion-201.png)

`GET /api/tickets/my-tickets` → los tickets propios con los datos del torneo (populate):

![Mis tickets](evidencia/pe7-my-tickets.png)

El organizador dueño ve los inscriptos y el resumen de cupos (los cancelados no ocupan cupo):

![Inscriptos como organizer](evidencia/pe7-inscriptos-organizer-200.png)

[← Volver al README](../README.md)
