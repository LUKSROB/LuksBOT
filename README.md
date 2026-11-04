# LuksBot

Bot de Discord multipropósito con enfoque en música, utilidades de servidor, comandos divertidos y soporte básico de moderación.

## Características principales

- 🎵 **Música**: reproducción, pausa, reanudación, cola, salto, loop y control de volumen.
- ⚙️ **Configuración y utilidades**: ayuda interactiva, ping, traducción, avatar, invitaciones y contador de comandos.
- 🎮 **Comandos divertidos**: dados, tic-tac-toe, brillo, paleta de colores, detección de color dominante, birthday y más.
- 🛡️ **Administración básica**: ban, unban y panel de soporte/tickets.
- 🌐 **Servicios externos**:
  - DeepL para traducción.
  - Lavalink (Riffy) para audio.
  - MongoDB para persistencia.
- ❤️ **Health check HTTP** con Express para despliegues y monitoreo.

## Arquitectura general

- `index.js`: arranque del bot, registro de comandos, carga de eventos y servidor web.
- `commands/`: comandos slash organizados por categoría:
  - `admins/`
  - `config/`
  - `funny/`
  - `music/`
- `events/`: listeners de Discord y Riffy.
- `utils/`: funciones reutilizables (música, helpers, etc.).
- `models/` y `db/`: persistencia y modelos relacionados.
  - El modelo de usuario incluye `lastInteractionAt` para ordenar y filtrar actividad reciente.

## Requisitos

- **Node.js 20.x**
- Token de bot en Discord Developer Portal
- Instancia de MongoDB
- API key de DeepL
- Nodo Lavalink compatible

## Instalación

1. Clona el repositorio.
2. Instala dependencias:

```bash
npm install
```

3. Configura tus credenciales y IDs en `config.json`.
4. Inicia el bot:

```bash
node index.js
```

## Configuración

El proyecto usa `config.json` para definir:

- IDs de aplicación/servidor/canales/roles.
- `BOT_TOKEN`.
- `MONGO_URL`.
- `DeepL_API_KEY`.
- Configuración del nodo Lavalink (`NODES`).
- Colores de embeds y filtros de palabras/webs.

> Recomendación: no compartas ni publiques valores sensibles (token/API keys/URI privadas).  
> Si alguna credencial se expone accidentalmente, revócala y genera una nueva inmediatamente.

## Comandos incluidos (resumen)

### Música

- `/play`
- `/pause`
- `/resume`
- `/skip`
- `/queue`
- `/loop`
- `/volume`

### Configuración / utilidad

- `/help`
- `/ping`
- `/translate`
- `/avatar`
- `/invites`
- `/cmd-count`

### Diversión

- `/tic-tac-toe`
- `/dice`
- `/say`
- `/brightness`
- `/color-palette`
- `/color-dominant`
- `/birthday`
  - Subcomandos: `set`, `get`, `upcoming`, `set-role`, `clear-role`, `delete`

### Administración

- `/ban`
- `/unban`
- `/support-panel`

## Privacidad y términos

- Consulta la política de privacidad en [PRIVACY.md](./PRIVACY.md)
- Consulta los términos de servicio en [TERMS.md](./TERMS.md)

## Estado del proyecto

Proyecto en evolución. El set de comandos y funciones puede cambiar con nuevas versiones.
