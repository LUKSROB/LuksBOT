# Política de Privacidad de LuksBot

**Última actualización:** 17 de noviembre de 2026
**Versión del servicio:** 1.8.7

Esta política explica qué datos trata LuksBot, con qué finalidad, dónde se almacenan, cuánto tiempo se conservan y qué opciones tienen los usuarios y administradores de servidores.

## 1. Alcance y responsable

LuksBot es un bot de Discord que ofrece música, utilidades, moderación, filtros automáticos, cumpleaños, tickets y un dashboard web.

El responsable del tratamiento es el desarrollador y operador del bot (Luksrob). Contacto: [lukasrob025@gmail.com](mailto:lukasrob025@gmail.com).

Esta política aplica a:

- El uso del bot dentro de Discord: comandos slash, botones, menús y funciones automáticas.
- El dashboard web (`/dashboard`) y su inicio de sesión con Discord.
- Los datos que los administradores configuran para su servidor.

No aplica a otros bots, sitios web o servicios de terceros.

## 2. Resumen rápido

- Solo tratamos los datos necesarios para que el bot funcione.
- No vendemos datos ni los usamos para publicidad.
- No almacenamos el contenido de tus mensajes: el filtro automático los evalúa en memoria.
- Las funciones opcionales (como cumpleaños) dependen de datos que aportas voluntariamente.
- Puedes solicitar acceso, corrección o eliminación de tus datos.

## 3. Datos que tratamos

### 3.1 Cuenta e identidad de Discord

- ID de usuario de Discord.
- Nombre de usuario y, cuando corresponde, apodo del servidor.
- Avatar o URL de avatar (por ejemplo, en el seguimiento de invitaciones).
- ID y nombre del servidor.
- IDs de canales y roles necesarios para las funciones configuradas.

### 3.2 Actividad en el bot

- Cantidad de comandos utilizados (métrica interna).
- Fecha de la última interacción con el bot.
- Fecha de ingreso al servidor y lista de roles, cuando se sincronizan miembros (por ejemplo, al entrar al servidor o al ejecutar `/load-users`).
- Un indicador de si la cuenta es un bot, únicamente en las sincronizaciones de miembros.

### 3.3 Cumpleaños (función opcional)

Si ejecutas `/birthday set`, se guarda por servidor:

- Día, mes y año de nacimiento.
- El último año en que el bot registró la celebración.

Ten en cuenta que:

- El año es obligatorio en el comando y la confirmación de `/birthday set` se publica en el canal, incluyendo la fecha completa.
- `/birthday get` y `/birthday upcoming` muestran el día y el mes a los miembros del servidor.
- Puedes eliminar tu fecha en ese servidor con `/birthday delete`.

### 3.4 Contenido de mensajes y filtro automático

- El bot recibe el contenido de los mensajes de los servidores donde está instalado para aplicar el filtro de palabras y dominios configurado por los administradores.
- El contenido se evalúa en memoria; **no se guarda en la base de datos**.
- Si un mensaje coincide con el filtro, se elimina y el bot publica un aviso mencionando al autor.
- El bot no lee mensajes directos entrantes. Sí puede enviarte un mensaje directo en acciones concretas, como el cierre de un ticket.

### 3.5 Moderación y tickets

- Baneos: ID y nombre del usuario sancionado, ID y nombre del moderador, canal donde se aplicó, motivo, duración, fechas de inicio y fin, y datos del desbaneo (tipo, autor y motivo).
- Tickets: ID y nombre del servidor, canal y nombre del ticket, ID y nombre del dueño, tipo de ticket, estado, fechas de apertura/cierre, quién lo cerró y motivo del cierre.
- Los mensajes escritos dentro de un ticket permanecen en Discord; el bot solo guarda los metadatos anteriores.

### 3.6 Invitaciones

- Código de invitación y cantidad de usos.
- ID, nombre de usuario y avatar de quien creó la invitación.
- Estos datos se usan para el top de invitadores y para mostrar quién invitó a un nuevo miembro.

### 3.7 Configuración del servidor

- Canales y roles configurados: bienvenidas, despedidas, invitaciones, mensajes, cumpleaños, tickets, logs de tickets y rol de moderación.
- ID del mensaje del panel de tickets.
- Filtros de palabras y sitios web bloqueados.
- Fecha de la última actualización de la configuración.

### 3.8 Música y multimedia

- Metadatos de reproducción: título, autor, URL, miniatura, duración y posición en la cola.
- La cola y el estado del reproductor se mantienen en memoria mientras el bot está en línea.
- Las miniaturas pueden descargarse y cachearse en memoria para generar la tarjeta de reproducción; no se almacenan en la base de datos.
- En los comandos de color, las imágenes se descargan para analizarlas y no se conservan.
- Las imágenes de bienvenida y de soporte se generan y se envían al canal; no se guardan en la base de datos.

### 3.9 Dashboard web y sesión

- Al iniciar sesión con Discord, el bot consulta tu perfil y la lista de servidores para mostrar únicamente aquellos donde puedes administrar.
- Esa información se mantiene **en memoria** durante la sesión (máximo 24 horas) y no se guarda en la base de datos.
- La sesión se identifica con una cookie llamada `luks_session`, con un identificador aleatorio, `HttpOnly`, `SameSite=Lax` y `Secure` cuando el sitio usa HTTPS.
- El token de acceso de OAuth se usa solo para consultar tu perfil y tus servidores; no se almacena en la base de datos.
- Al cerrar sesión o reiniciar el bot, la sesión en memoria se pierde y deberás volver a iniciar sesión.

### 3.10 Registros técnicos

- Podemos generar registros de ejecución con IDs de Discord, errores, eventos de conexión y diagnóstico del dashboard.
- Estos registros se usan para mantener la estabilidad y seguridad del servicio, no para elaborar perfiles.
- Su conservación depende del entorno de hosting utilizado por el operador.

## 4. Finalidades y bases del tratamiento

Usamos los datos para:

- Ejecutar comandos y funciones del bot.
- Guardar configuraciones por servidor.
- Ofrecer funciones opcionales solicitadas por los usuarios o administradores.
- Aplicar filtros de contenido y sanciones configuradas por el servidor.
- Gestionar tickets y brindar soporte.
- Medir uso, prevenir abuso y mejorar la estabilidad del servicio.
- Cumplir obligaciones legales aplicables.

Las bases pueden incluir la ejecución del servicio aceptado, el consentimiento para funciones opcionales (como cumpleaños), el interés legítimo en seguridad y prevención de abuso, y obligaciones legales cuando correspondan.

## 5. Qué no hacemos

- No vendemos datos personales.
- No usamos datos para publicidad ni perfilado comercial.
- No almacenamos el contenido de mensajes ni adjuntos.
- No leemos mensajes directos entrantes.
- No solicitamos contraseñas, códigos de acceso ni datos de tarjetas.
- No procesamos pagos dentro del bot.

## 6. Servicios y proveedores externos

| Servicio | Datos involucrados | Cuándo |
|---|---|---|
| Discord API | Cuenta, servidores, canales, roles, mensajes y voz | Uso normal del bot |
| Nodos Lavalink | Consultas de búsqueda, metadatos de pistas y datos de conexión de voz | Reproducción de música |
| DeepL | Texto enviado al comando `/translate` | Uso de traducción |
| MongoDB (proveedor de base de datos) | Datos descritos en esta política | Persistencia del bot |
| Hosting del bot/dashboard | Direcciones IP y registros técnicos | Acceso web y ejecución |

Los nodos Lavalink pueden ser operados por terceros. Cada proveedor aplica sus propios términos y políticas de privacidad. Al usar funciones que dependen de ellos, aceptas ese flujo de datos.

## 7. Conservación de datos

- No existe un borrado automático general.
- Los datos se conservan mientras el bot esté operativo y la función o el servidor los mantenga.
- La fecha de cumpleaños se conserva hasta que la elimines con `/birthday delete` o solicites su eliminación.
- Los historiales de baneos y los metadatos de tickets se conservan para trazabilidad y seguridad.
- Expulsar el bot de un servidor **no elimina automáticamente** los datos asociados; puedes solicitar su eliminación.
- Los registros técnicos se conservan según la configuración del hosting.

## 8. Seguridad

Aplicamos medidas razonables para proteger la información:

- Credenciales y claves en variables de entorno, fuera del repositorio.
- Acceso restringido a la base de datos y al dashboard.
- Sesiones del dashboard en memoria, con cookie `HttpOnly`.
- Recomendación de usar HTTPS en producción.

Ningún sistema es completamente infalible. Si detectas un incidente o acceso no autorizado, contáctanos para revisarlo.

## 9. Compartición de datos

- No compartimos datos con terceros para fines comerciales.
- Solo se comparten con los proveedores necesarios para operar las funciones descriptas, o cuando exista una obligación legal o un requerimiento válido de autoridad.
- Podemos usar la información para investigar abuso, proteger derechos o responder a reclamos.

## 10. Derechos y solicitudes

Puedes solicitar:

- Acceso a los datos asociados a tu cuenta.
- Rectificación de información incorrecta.
- Eliminación de tus datos.
- Limitación u oposición al tratamiento, cuando la normativa aplicable lo permita.
- Retiro del consentimiento para funciones opcionales.

Para ejercer estos derechos, escribí a [lukasrob025@gmail.com](mailto:lukasrob025@gmail.com) indicando tu ID de Discord y el servidor correspondiente. Podemos pedirte una verificación razonable de identidad. Algunos datos son necesarios para que el bot funcione; si se eliminan, ciertas funciones dejarán de estar disponibles.

## 11. Menores de edad

LuksBot funciona en Discord y está sujeto a la edad mínima de la plataforma (13 años o la que exija la ley de tu país). Si sos menor de esa edad, no uses el bot. Si detectas uso indebido relacionado con menores, contactanos para revisar el caso.

## 12. Transferencias internacionales

Los proveedores externos pueden procesar datos en países distintos al tuyo. Cuando corresponda, se aplican las garantías y mecanismos que cada proveedor publique en sus propias políticas.

## 13. Cambios en esta política

Podemos actualizar esta política para reflejar cambios técnicos, legales o funcionales. La versión vigente será la publicada en este archivo, con su fecha de actualización. Si los cambios son relevantes, procuraremos informarlo por los canales habituales del proyecto.

## 14. Contacto

Para consultas, solicitudes de datos o reportes de seguridad:
[lukasrob025@gmail.com](mailto:lukasrob025@gmail.com)