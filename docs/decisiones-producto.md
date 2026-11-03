# Decisiones de producto y pendientes

Las decisiones que tomamos al construir el recorrido del partido (configuración → jugadores → habilitación → partido → convocatoria → asistencia) y lo que queda para después. Cómo se usa cada pantalla está en [guia-de-uso.md](guia-de-uso.md).

Las decisiones de arquitectura grandes están en [adr/](adr/). Las de la API, en su `docs/decisions.md`.

> Actualizado al 2/11/2026.

---

## Decisiones tomadas

### Datos del club

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| 1 | **Las categorías pertenecen a una temporada.** Para el año siguiente se crean de nuevo. | Cada temporada tiene su plantel, sus edades y sus competencias, y la historia de la anterior queda intacta. | Categorías permanentes reutilizadas año tras año |
| 2 | **El jugador no tiene un deporte propio: su deporte es el de su categoría.** | Evita datos que se contradigan. Un jugador puede estar en dos deportes a la vez. | Campo `sport` en el jugador |
| 3 | **Pase de categoría:** si el jugador ya está en otra categoría del mismo deporte, sumarlo a una nueva lo saca de la anterior, que queda en su historial. | Es lo que pasa en la realidad y evita jugadores duplicados en dos planteles del mismo deporte. | Dejarlo en las dos |
| 4 | **Las competencias son por deporte y temporada, con categorías y requisitos propios.** "Copiar a otra temporada" copia los datos y los requisitos, pero no las categorías. | Las ligas repiten requisitos año a año, y las categorías son de otra temporada. | Copiar todo; competencias sin temporada |
| 5 | **Sedes del club** (TIZ-39 / FRO-39): un partido de local elige una sede y la API completa el lugar y el link de Maps. Una sede con partidos programados no se borra, se desactiva. | El club juega en más de un lugar (sede, parque deportivo) y el profe no tiene que escribir la dirección cada vez. | Escribir la dirección en cada partido |
| 6 | **El link de Google Maps se arma solo** desde la dirección. El buscador usa OpenStreetMap (Nominatim) a través de una ruta propia del front, y el mapa es un embed de Google sin API key. | Sin costo ni claves para mantener, con sugerencias y punto exacto. | Google Places API (pago y con clave); pegar el link a mano |

### Habilitación y convocatoria

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| 7 | **Un jugador está habilitado** si tiene aprobados todos los papeles obligatorios de las competencias de su categoría. Los requisitos "solo para menores" no aplican a mayores de edad. Si la categoría no juega ninguna competencia, no se la muestra como "habilitada". | Es lo que pide la liga. Mostrar "habilitado" sin requisitos cargados confundía. | Habilitación manual por jugador |
| 8 | **Solo se convoca a habilitados.** Los no habilitados aparecen en gris con lo que les falta. | Evita que un jugador sin papeles llegue a jugar. | Permitir y solo avisar |
| 9 | **Un solo link en el grupo:** cada convocado toca su nombre y responde Voy o No puedo. El link personal queda solo para recordatorios por privado. | El profe manda un mensaje, no veinte. | Un link personal para cada jugador |
| 10 | **El link del grupo no pide identificarse:** cualquiera del grupo puede responder por cualquiera, como en una encuesta de WhatsApp. El motivo de "No puedo" lo ve solo el profe. | Es el mismo nivel de confianza que el grupo, y cero fricción para las familias. | Login o código por jugador |
| 11 | **La encuesta de WhatsApp es opcional y se arma a mano** (el sistema da los pasos y la pregunta). El link sigue siendo lo principal. | WhatsApp no deja que otro sistema cree encuestas, y sus respuestas no llegan al sistema (no hay contadores ni asistencia precargada). | Solo encuesta; solo link |
| 12 | **El mensaje del grupo incluye la lista de convocados** con número y nombre completo. La página pública muestra solo el nombre y la inicial del apellido. | El grupo es privado del equipo, mientras que la página se puede reenviar. | La misma lista en los dos lugares |
| 13 | **"Hubo cambios: volvé a avisar"** cuando se edita fecha, hora o lugar después de publicar. "Actualizar mensaje" rearma el texto. | Que nadie llegue con la hora vieja. | Avisar automáticamente |
| 14 | **Agendar:** Google Calendar como opción principal y `.ics` para iPhone y Outlook, con una explicación. | El `.ics` solo confundía ("¿qué es esto que se descargó?"). | Solo `.ics` |

### Horarios

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| 15 | **La API guarda las horas en UTC; el front manda UTC y muestra en hora argentina.** | Laravel guarda la hora tal como llega. Con `-03:00`, un partido de las 15:00 aparecía a las 12:00. | Mandar la hora local con offset |
| 16 | **Los textos para las familias** (mensaje de WhatsApp y calendario) se formatean en la zona del club: `CLUB_TIMEZONE`, por defecto `America/Argentina/Buenos_Aires`. | El mensaje decía "Partido 18:00" para un partido de las 15:00. | Formatear en UTC |

### Pantallas

| # | Decisión | Por qué |
|---|---|---|
| 17 | **La guía de primeros pasos es un botón discreto** ("Configurar club 0/3") en la barra, que se abre solo la primera vez. | El banner grande era invasivo. |
| 18 | **En la página del partido, la convocatoria es lo principal.** Los datos y el mapa van en el encabezado, y asistencia, resultado y acciones en una columna lateral corta. | Es lo que más se usa, y antes quedaba abajo con mucho espacio vacío. |
| 19 | **La asistencia se toma en un panel lateral** desde el partido. Queda la página completa para links directos y para la cancha. | Antes era una franja angosta en una página aparte. |
| 20 | **Pie con versión, commit y fecha de actualización.** `package.json` pasó a 1.0.0, igual que el tag `v1.0.0`. | Saber qué versión está corriendo cuando alguien reporta algo. |
| 21 | **Borrar un entrenamiento es un borrado lógico** (la asistencia no se pierde). | Evitar perder datos por un toque. |

### Forma de trabajo

| # | Decisión |
|---|---|
| 22 | Una tarea por PR, con CI en verde (lint, tipos y build en el front; tests, Pint y `openapi.json` actualizado en la API) antes de mergear. |
| 23 | Merge con commit de merge y **sin borrar las ramas**. |
| 24 | Cada cambio de la API que el front consume regenera `openapi.json`, y el front regenera `lib/api/schema.d.ts`. |
| 25 | Las pantallas se prueban con Playwright en escritorio (1360–1440 px) y celular (390 px): sin scroll horizontal ni errores de consola. |

---

## Pendiente

### Hecho desde la última actualización (2/11/2026)

FRO-37 (asistencia precargada y sin conexión), FRO-38 (inicio por rol y navegación móvil), FRO-26 (notificaciones), FRO-19 (Materiales, Indumentaria y Canchas), FRO-15 (sin datos de ejemplo), FRO-20 (Análisis y Proyecto, con la prueba en vivo), FRO-23 (Comunicados), FRO-21 (ABM del panel admin), FRO-40 (rama, género y duplicar competencia), FRO-14 + TIZ-34 (Equipo del club) y FRO-28 (Mi perfil).

### Bloqueado o a definir

| Ticket | Qué | Bloqueo |
|---|---|---|
| **TIZ-35** | Coordinador por deporte (el de fútbol ve solo fútbol) | A definir con el equipo |
| **TIZ-38** | Roles reales del club, "A definir". Según la charla con un club: presidente y vicepresidente no usan el sistema; coordinadores por deporte y profes sí; utilero y quien hace pedidos depende del club, pero quedan como roles estándar; el admin del club se parece al coordinador | Definir con el equipo |
| **TIZ-23** | Mail propio de invitación al sumar a alguien al equipo | Hoy la persona nueva recibe el de restablecer contraseña, que le sirve para elegir la suya |
| **TIZ-41 / TIZ-44 / TIZ-47** | Deploy a staging y producción | Cuentas de Laravel Cloud y Vercel |

### Ideas para más adelante (sin ticket)

- **Cuotas y socios con Mercado Pago** y **carnet digital con QR.** Es lo que tienen casi todos los sistemas argentinos para clubes (Clubin, Clubbi, ClubAr, Klub). Nuestro diferencial es la parte deportiva y operativa: la habilitación por requisitos de la liga y la utilería, que ninguno de los productos relevados tiene. Conviene plantearlo como integración o como etapa posterior.
- **Marcar a mano la respuesta de un convocado** desde el panel del profe, para quien responde por la encuesta de WhatsApp o en persona.
- **Recordatorio automático** a los que no respondieron, cuando haya mails o notificaciones.
