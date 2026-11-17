# LuksBOT

Bot de Discord multipropósito con música (Lavalink), moderación, filtros automáticos, cumpleaños, tickets, bienvenidas con imagen y un dashboard web con OAuth de Discord.

> Versión actual: **1.8.7** · Node.js **20.x**

## Características

### 🎵 Música
- Reproducción por búsqueda o URL (`/play`) con volumen inicial opcional.
- Controles por slash y botones: pausa/reanudar, skip, cola, loop (pista o lista), volumen y stop.
- Tarjeta de reproducción generada con `musicard`, que se actualiza mientras suena la pista.
- Failover automático entre varios nodos Lavalink (cooldowns por nodo/host, reintentos y cambio manual con `/lavalink-node`).
- Presencia dinámica del bot mostrando la pista en reproducción.

### 🛡️ Moderación y seguridad
- `/ban` con duración opcional (de 10 minutos a 30 días), registro en MongoDB y desbaneo automático programado.
- `/unban` con motivo y trazabilidad (manual, automático o externo).
- `/filter`: activa/desactiva y administra palabras y sitios web bloqueados por servidor.
- Filtro automático de mensajes: elimina el mensaje y avisa al autor.
- Panel de tickets con categorías (soporte, bug, compras/donaciones), cierre y canal de logs.

### 👋 Comunidad
- Bienvenidas y despedidas configurables, con imagen generada por canvas.
- Seguimiento de invitaciones: creación, borrado, usos y top de invitadores.
- Cumpleaños con Agenda.js: registro, próximos cumpleaños, rol y canal de felicitaciones.
- Sincronización de usuarios del servidor a MongoDB (`/load-users`).

### ⚙️ Utilidades
- `/help` como centro de ayuda interactivo (inicio, índice generado automáticamente y guía).
- `/ping`, `/avatar`, `/invites`, `/cmd-count`, `/translate` (DeepL).
- `/config-guild` para configurar canales y roles por servidor directamente desde Discord.
- Dashboard web para administrar la configuración del servidor y el filtro de contenido.

## Stack

| Componente | Uso |
|---|---|
| discord.js 14 | Gateway, slash commands, botones y menús |
| Riffy + Lavalink v4 | Audio |
| MongoDB + Mongoose | Persistencia (guilds, usuarios, tickets, estado runtime) |
| Express 5 | Landing, dashboard y API |
| deepl-node | Traducción |
| musicard + @napi-rs/canvas | Tarjetas de música, bienvenidas y soporte |
| Agenda | Scheduler de cumpleaños |

## Estructura

```text
index.js                 Arranque: cliente, Riffy, Mongo, Express y registro de comandos
commands/
  admins/                ban, unban, config-guild, filter, lavalink-node, load-users, support-panel
  config/                help, ping, avatar, invites, cmd-count, translate
  funny/                 dice, say, tic-tac-toe, color-brightness, color-dominant, color-palette, birthday
  music/                 play, pause, resume, skip, queue, loop, volume
events/
  client/                Eventos de discord.js (ready, interacciones, mensajes, miembros, invites...)
  riffy/                 Eventos de audio (trackStart, trackEnd, queueEnd, nodos...)
interactions/            Handlers de botones y select menus (customId = nombre del archivo)
db/                      Acceso a datos (guilds, usuarios, tickets, cumpleaños, filtros)
models/                  Esquemas Mongoose (Guild, User, Ticket, RuntimeState)
utils/functions/         Helpers (dashboard, failover, actividad, filtros, colores...)
utils/canvas/            Generación de imágenes
public/                  Landing (index.html) y dashboard (dashboard.html + dashboard.js)
assets/                  Fuentes e imágenes
config.json              IDs, colores, filtros por defecto y nodos Lavalink
```

Detalles de carga:
- Los comandos se indexan al arrancar (solo metadata) y el módulo se carga en el primer uso (lazy loading + caché).
- Los eventos se cargan por nombre de archivo.
- Los handlers de `interactions/` se resuelven por `customId` (admite sufijos como `customId:extra`).
- El servidor HTTP arranca en paralelo con el login, para que el dashboard siga disponible aunque Discord tarde en conectar.
- El registro de comandos usa un hash guardado en MongoDB (`RuntimeState`) para omitirlo si no cambiaron.

## Requisitos

- Node.js 20.x
- Bot de Discord + aplicación OAuth2 (mismo `client_id` y `client_secret`)
- MongoDB accesible
- Nodos Lavalink v4 (para música)
- API key de DeepL (solo para `/translate`)

## Instalación

```bash
git clone https://github.com/LUKSROB/LuksBOT.git
cd LuksBOT
npm install
```

Crea un `.env` en la raíz:

```env
PORT=4000
DISCORD_ID=...
DISCORD_KEY=...
DISCORD_SECRET=...
DISCORD_REDIRECT_URI=https://tu-dominio.com/auth/discord/callback
MONGO_CLIENT=mongodb+srv://...
DEEPL_KEY=...
WEBSITE_URL=https://tu-dominio.com
ACTIVITY_NAME=LuksBOT
```

Inicia el bot:

```bash
node index.js
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DISCORD_KEY` | ✅ | Token del bot. |
| `DISCORD_ID` | ✅ | Application ID (registro de comandos y OAuth). |
| `MONGO_CLIENT` | ✅ | URI de MongoDB. |
| `DISCORD_SECRET` | Dashboard | Client secret de OAuth2. |
| `DISCORD_REDIRECT_URI` | Dashboard | Debe coincidir con `<base>/auth/discord/callback` y estar registrada en el portal de Discord. |
| `WEBSITE_URL` | Recomendada | URL pública; se usa para OAuth y presencia. |
| `DEEPL_KEY` | `/translate` | API key de DeepL. |
| `ACTIVITY_NAME` | No | Texto de presencia por defecto. |
| `PORT` | No | Puerto HTTP (por defecto `4000`). |

> `config.json` ya **no** contiene credenciales: token, Mongo y API keys viven en `.env`.
> Si usás algunas variables heredadas (`KICK`, `PALETTE_RAPIDAPI`, `WEB` o `TWITCH` en `.env`), ten en cuenta que el código actual no las lee.

## config.json

- `GUILD_ID`: servidor donde se registran los slash commands y donde se migran una sola vez los ajustes legacy.
- `COLORS`: paleta usada en embeds e imágenes.
- `WORDS_FILTER` / `WEBS_FILTER`: filtros iniciales al crear un guild.
- `NODES`: nodos Lavalink (`host`, `port`, `password`, `secure`, `name` opcional).
- `WEB`: HTML de respaldo para `/` (la landing actual vive en `public/index.html`).
- `WEBSITE_URL` / `TWITCH`: opcionales para presencia/OAuth.

> Los slash commands se registran como comandos de guild en `GUILD_ID`, no globalmente.

## Dashboard web

Rutas:
- `GET /` → landing (`public/index.html`).
- `GET /dashboard` → panel de administración.
- `GET /auth/discord` → inicia OAuth2 con scope `identify guilds`.
- `GET /auth/discord/callback` → crea la sesión (cookie `luks_session`, 24 h).
- `GET /api/auth/me`, `POST /api/auth/logout`.
- `GET /api/dashboard/guilds` → servidores donde el usuario puede administrar y el bot está presente.
- `GET /api/dashboard/guild/:guildId/meta` → canales y roles.
- `GET|PUT /api/dashboard/config/:guildId` → canales, rol de moderación y listas de filtro.
- `GET|PUT /api/dashboard/content-filter/:guildId` → filtro de contenido completo.
- `POST|DELETE /api/dashboard/content-filter/:guildId/word[/:word]`.
- `POST|DELETE /api/dashboard/content-filter/:guildId/web[/:web]`.
- `PATCH /api/dashboard/content-filter/:guildId/toggle`.

Notas:
- Solo se puede administrar un servidor si el usuario tiene `ADMINISTRATOR` o `MANAGE_GUILD`.
- Las sesiones viven en memoria: al reiniciar el bot hay que volver a iniciar sesión.
- Para OAuth en producción, `DISCORD_REDIRECT_URI` debe coincidir exactamente con la URL registrada.
- El panel actual edita canales de bienvenida/despedida/cumpleaños/tickets, rol de moderación y listas de palabras/webs. La API de filtro de contenido ya existe, aunque la UI se puede ampliar.
- Si un log de OAuth menciona `DISCORD_KEY` al faltar el secret, en realidad se refiere a `DISCORD_SECRET` (mensaje heredado).

## Comandos (27)

### Administración (`admins`)
- `/ban` — `user`, `reason`, `duration` · requiere `BanMembers`.
- `/unban` — `user`, `reason` · requiere `BanMembers`.
- `/config-guild` — subcomandos `ver`, `canal`, `rol`, `quitar` · `ManageGuild`.
- `/filter` — subcomandos `estado`, `activar`, `desactivar`, `agregarpalabra`, `removerpalabra`, `agregarweb`, `removerweb`, `listar` · `ManageGuild`.
- `/lavalink-node` — subcomandos `status`, `switch`, `mark-functional` · `ManageGuild`.
- `/load-users` — opción `include-bots` · `ManageGuild`.
- `/support-panel` — `ManageGuild`.

### Configuración / utilidad (`config`)
- `/help`
- `/ping`
- `/avatar` — `user`
- `/invites`
- `/cmd-count` — `user`
- `/translate` — `text`, `target_language`

### Diversión (`funny`)
- `/dice`
- `/say` — `message`
- `/tic-tac-toe` — `opponent`
- `/color-brightness` — `color`, `amount`, `isdark`
- `/color-dominant` — `url` o `image`
- `/color-palette` — `colors`, `url` o `image`
- `/birthday` — subcomandos `set`, `get`, `upcoming`, `config`, `set-role`, `clear-role`, `set-channel`, `clear-channel`, `add-role`, `remove-role`, `delete`

### Música (`music`)
- `/play` — `query`, `volume`
- `/pause`
- `/resume`
- `/skip`
- `/queue`
- `/loop` — `mode` (`track`, `queue`, `none`)
- `/volume` — `nivel`

Botones de reproducción: `stop`, `loop`, `pause`, `skip`, `queue`.

## Modelo de datos (resumen)

- `Guild`: `guildId`, `guildName`, canales/roles configurados, `invites`, `bans[]`, `contentFilter`.
- `User`: `userId`, `guildId`, `commandCount`, `lastInteractionAt`, `birthday`, `lastCelebratedYear`, `roles`.
- `Ticket`: `guildId`, `channelId`, `ownerId`, `type`, `status`, `openedAt`, `closedAt`, cierre y motivo.
- `RuntimeState`: pares clave/valor; se usa para omitir el registro de comandos si el hash no cambió.

## Seguridad y privacidad

- No subas `.env` ni credenciales al repositorio.
- Si un token o API key se expone, revocalo y generá uno nuevo de inmediato.
- [Política de privacidad](./PRIVACY.md) · [Términos de servicio](./TERMS.md)

## Estado del proyecto

Versión **1.8.7**. Proyecto en evolución; los comandos y funciones pueden cambiar con nuevas versiones.