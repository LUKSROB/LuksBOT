// Functions to register dashboard routes with Discord OAuth and guild config management

// Import necessary modules
const path = require('path');
const crypto = require('crypto');
const Guild = require('../../models/guild');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const STATE_TTL_MS = 10 * 60 * 1000;

const sessions = new Map();
const oauthStates = new Map();

function parseCookies(cookieHeader = '') {
    const cookies = {};
    if (!cookieHeader) {
        return cookies;
    }
    
    for (const pair of String(cookieHeader).split(';')) {
        const trimmed = pair.trim();
        if (!trimmed) {
            continue;
        }
        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex === -1) {
            continue;
        }
        const key = trimmed.substring(0, equalsIndex);
        const value = trimmed.substring(equalsIndex + 1);
        if (key) {
            try {
                cookies[key] = decodeURIComponent(value);
            } catch {
                cookies[key] = value;
            }
        }
    }
    return cookies;
}

function cleanupExpiredMaps() {
    const now = Date.now();

    for (const [token, session] of sessions.entries()) {
        if (!session || session.expiresAt <= now) {
            sessions.delete(token);
        }
    }

    for (const [state, createdAt] of oauthStates.entries()) {
        if (!createdAt || now - createdAt > STATE_TTL_MS) {
            oauthStates.delete(state);
        }
    }
}

function hasManageAccess(permissionValue) {
    const permissions = BigInt(permissionValue || '0');
    const admin = (permissions & 0x8n) !== 0n;
    const manageGuild = (permissions & 0x20n) !== 0n;
    return admin || manageGuild;
}

function getAppBaseUrl(config, req) {
    const configured = process.env.WEBSITE_URL || config.WEBSITE_URL;
    if (configured) {
        return configured.endsWith('/') ? configured.slice(0, -1) : configured;
    }

    return `${req.protocol}://${req.get('host')}`;
}

function requireSession(req, res, next) {
    cleanupExpiredMaps();

    const sessionToken = req.cookies?.luks_session;

    if (!sessionToken) {
        console.warn('[dashboard] No session token found in cookies');
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No session token' });
    }

    if (!sessions.has(sessionToken)) {
        console.warn('[dashboard] Session token not found in sessions map');
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Session not found' });
    }

    const session = sessions.get(sessionToken);
    if (!session) {
        console.warn('[dashboard] Session is null');
        sessions.delete(sessionToken);
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Session is null' });
    }

    if (session.expiresAt <= Date.now()) {
        console.warn('[dashboard] Session expired');
        sessions.delete(sessionToken);
        return res.status(401).json({ error: 'SESSION_EXPIRED', message: 'Session has expired' });
    }

    req.sessionToken = sessionToken;
    req.sessionData = session;
    return next();
}

function canManageGuild(sessionData, guildId) {
    return sessionData.guilds.some((guild) => guild.id === guildId && hasManageAccess(guild.permissions));
}

function getGuildConfigPayload(guildDoc) {
    return {
        guildId: guildDoc?.guildId || null,
        guildName: guildDoc?.guildName || null,
        welcomeChannelId: guildDoc?.welcomeChannelId || null,
        goodbyeChannelId: guildDoc?.goodbyeChannelId || null,
        birthdayChannelId: guildDoc?.birthdayChannelId || null,
        birthdayRoleId: guildDoc?.birthdayRoleId || null,
        ticketChannelId: guildDoc?.ticketChannelId || null,
        modRoleId: guildDoc?.modRoleId || null,
        wordsFilter: Array.isArray(guildDoc?.wordsFilter) ? guildDoc.wordsFilter : [],
        websFilter: Array.isArray(guildDoc?.websFilter) ? guildDoc.websFilter : [],
        contentFilter: guildDoc?.contentFilter || {
            enabled: true,
            words: [],
            webs: []
        }
    };
}

function normalizeStringId(value) {
    const normalized = String(value || '').trim();
    return normalized || null;
}

function normalizeFilterList(value) {
    if (Array.isArray(value)) {
        return [...new Set(value.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean))];
    }

    if (typeof value === 'string') {
        return [...new Set(
            value
                .split(/[\n,]/g)
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean)
        )];
    }

    return [];
}

// Function to register dashboard and OAuth routes
function registerDashboardRoutes(app, client, config) {
    const dashboardFile = path.join(__dirname, '../../public/dashboard.html');

    setInterval(cleanupExpiredMaps, 30 * 60 * 1000).unref();

    app.get('/dashboard', (_req, res) => {
        res.sendFile(dashboardFile);
    });

    app.get('/auth/discord', (req, res) => {
        const clientId = process.env.DISCORD_ID;
        const clientSecret = process.env.DISCORD_SECRET;
        
        if (!clientId) {
            console.error('[OAuth] DISCORD_ID no configurado');
            return res.status(500).send('DISCORD_ID no está configurado.');
        }

        if (!clientSecret) {
            console.error('[OAuth] DISCORD_KEY no configurado. Define la variable de entorno.');
            return res.status(500).send('DISCORD_KEY no está configurado. Define la variable de entorno.');
        }

        const state = crypto.randomUUID();
        oauthStates.set(state, Date.now());

        const redirectUri = process.env.DISCORD_REDIRECT_URI;

        try {
            const requestOrigin = `${req.protocol}://${req.get('host')}`;
            const redirectOrigin = new URL(redirectUri).origin;
            if (requestOrigin !== redirectOrigin) {
                console.warn('[OAuth] ATENCIÓN: redirect_uri apunta a otro origen que el dashboard.', {
                    requestOrigin,
                    redirectOrigin,
                    source: process.env.DISCORD_REDIRECT_URI ? 'DISCORD_REDIRECT_URI' : (process.env.WEBSITE_URL ? 'env.WEBSITE_URL' : 'config.WEBSITE_URL')
                });
            }
        } catch {
        }

        console.log('[OAuth] Iniciando OAuth:', { clientId, redirectUri });

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'identify guilds',
            state
        });

        return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
    });

    app.get('/auth/discord/callback', async (req, res) => {
        const code = String(req.query.code || '');
        const state = String(req.query.state || '');
        const oauthError = String(req.query.error || '');
        const oauthErrorDescription = String(req.query.error_description || '');
        const clientId = process.env.DISCORD_ID || config.APP_ID;
        const clientSecret = process.env.DISCORD_SECRET;
        const redirectUri = process.env.DISCORD_REDIRECT_URI || `${getAppBaseUrl(config, req)}/auth/discord/callback`;

        console.log('[OAuth] Callback recibido:', {
            url: req.originalUrl,
            code: code ? 'present' : 'missing',
            state: state ? 'present' : 'missing',
            oauthError: oauthError || null,
            oauthErrorDescription: oauthErrorDescription || null
        });

        // Discord devuelve ?error=... cuando el usuario cancela o algo falla
        if (oauthError) {
            console.warn('[OAuth] Discord devolvió error:', oauthError, oauthErrorDescription);
            return res.redirect('/dashboard?auth=error');
        }

        // Si no hay code/state es porque NO venimos del redirect de Discord
        // (visita directa a la URL, refresco, health check, etc.)
        if (!code || !state) {
            console.warn('[OAuth] Code o state faltante. URL recibida:', req.originalUrl);
            return res.redirect('/dashboard?auth=missing_params');
        }

        if (!oauthStates.has(state)) {
            console.warn('[OAuth] State no encontrado o expirado');
            return res.status(400).send('OAuth state inválido o expirado.');
        }

        oauthStates.delete(state);

        if (!clientId || !clientSecret) {
            console.error('[OAuth] Falta configuración: clientId o clientSecret');
            return res.status(500).send('Falta configuración de Discord OAuth.');
        }

        try {
            console.log('[OAuth] Solicitando token a Discord...');
            console.log('[OAuth] Parámetros:', { clientId: clientId ? 'present' : 'MISSING', clientSecret: clientSecret ? 'present' : 'MISSING', redirectUri, code: code ? 'present' : 'missing' });
            
            if (!clientSecret) {
                console.error('[OAuth] clientSecret es undefined/null. Verificar DISCORD_CLIENT_SECRET en env');
                throw new Error('DISCORD_CLIENT_SECRET no está configurado en variables de entorno');
            }
            
            const tokenParams = new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            });

            const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenParams.toString()
            });

            if (!tokenRes.ok) {
                const body = await tokenRes.text();
                console.error('[OAuth] Error token:', { status: tokenRes.status, body });
                throw new Error(`Error obteniendo token OAuth (${tokenRes.status}): ${body}`);
            }

            const tokenData = await tokenRes.json();
            const accessToken = tokenData.access_token;
            if (!accessToken) {
                console.error('[OAuth] No access_token en respuesta');
                throw new Error('Respuesta OAuth sin access_token');
            }

            console.log('[OAuth] Token obtenido, solicitando user y guilds...');

            const [userRes, guildsRes] = await Promise.all([
                fetch('https://discord.com/api/users/@me', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }),
                fetch('https://discord.com/api/users/@me/guilds', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ]);

            if (!userRes.ok) {
                const body = await userRes.text();
                console.error('[OAuth] Error user:', { status: userRes.status, body });
                throw new Error(`Error obteniendo usuario (${userRes.status}): ${body}`);
            }

            if (!guildsRes.ok) {
                const body = await guildsRes.text();
                console.error('[OAuth] Error guilds:', { status: guildsRes.status, body });
                throw new Error(`Error obteniendo guilds (${guildsRes.status}): ${body}`);
            }

            const user = await userRes.json();
            const guilds = await guildsRes.json();

            console.log('[OAuth] User y guilds obtenidos:', { userId: user.id, guildCount: Array.isArray(guilds) ? guilds.length : 0 });

            const sessionToken = crypto.randomUUID();
            sessions.set(sessionToken, {
                user,
                guilds: Array.isArray(guilds) ? guilds : [],
                expiresAt: Date.now() + SESSION_TTL_MS
            });

            console.log('[OAuth] Session creada:', sessionToken);

            const forwardedProto = String(req.headers['x-forwarded-proto'] || '');
            const secureCookie = req.secure || forwardedProto.includes('https');
            
            console.log('[OAuth] Seteando cookie:', { secure: secureCookie, sameSite: 'lax', httpOnly: true });

            res.cookie('luks_session', sessionToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: secureCookie,
                maxAge: SESSION_TTL_MS,
                path: '/'
            });

            console.log('[OAuth] Éxito, redirigiendo a /dashboard');
            return res.redirect('/dashboard');
        } catch (error) {
            console.error('[OAuth] Error en callback:', error.message, error.stack);
            return res.status(500).send(`Error completando autenticación con Discord: ${error.message}`);
        }
    });

    app.post('/api/auth/logout', (req, res) => {
        const sessionToken = req.cookies?.luks_session;
        
        if (sessionToken) {
            sessions.delete(sessionToken);
        }
        
        res.clearCookie('luks_session', { path: '/' });
        return res.json({ ok: true });
    });

    app.get('/api/auth/me', (req, res) => {
        const sessionToken = req.cookies?.luks_session;
        
        if (!sessionToken || !sessions.has(sessionToken)) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }
        
        const session = sessions.get(sessionToken);
        if (!session || session.expiresAt <= Date.now()) {
            if (sessionToken) {
                sessions.delete(sessionToken);
            }
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }
        
        const { user } = session;
        return res.json({
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            discriminator: user.discriminator || '0'
        });
    });

    app.get('/api/dashboard/guilds', requireSession, (req, res) => {
        const manageableGuilds = req.sessionData.guilds
            .filter((guild) => hasManageAccess(guild.permissions))
            .filter((guild) => client.guilds.cache.has(guild.id))
            .map((guild) => ({
                id: guild.id,
                name: guild.name,
                icon: guild.icon
                    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
                    : null
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return res.json({ guilds: manageableGuilds });
    });

    app.get('/api/dashboard/guild/:guildId/meta', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'GUILD_NOT_FOUND' });
        }

        const channels = guild.channels.cache
            .filter((channel) => typeof channel.isTextBased === 'function' && channel.isTextBased())
            .map((channel) => ({ id: channel.id, name: channel.name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const roles = guild.roles.cache
            .filter((role) => !role.managed && role.name !== '@everyone')
            .map((role) => ({ id: role.id, name: role.name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return res.json({ channels, roles });
    });

    app.get('/api/dashboard/config/:guildId', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        const guildDoc = await Guild.findOne({ guildId }).lean();
        return res.json({ config: getGuildConfigPayload(guildDoc) });
    });

    app.put('/api/dashboard/config/:guildId', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'GUILD_NOT_FOUND' });
        }

        const update = {
            guildName: guild.name,
            welcomeChannelId: normalizeStringId(req.body.welcomeChannelId),
            goodbyeChannelId: normalizeStringId(req.body.goodbyeChannelId),
            birthdayChannelId: normalizeStringId(req.body.birthdayChannelId),
            birthdayRoleId: normalizeStringId(req.body.birthdayRoleId),
            ticketChannelId: normalizeStringId(req.body.ticketChannelId),
            modRoleId: normalizeStringId(req.body.modRoleId),
            wordsFilter: normalizeFilterList(req.body.wordsFilter),
            websFilter: normalizeFilterList(req.body.websFilter)
        };

        await Guild.updateOne(
            { guildId },
            {
                $set: update,
                $setOnInsert: { guildId }
            },
            { upsert: true }
        );

        const updated = await Guild.findOne({ guildId }).lean();
        return res.json({ ok: true, config: getGuildConfigPayload(updated) });
    });

    // Endpoint para obtener filtro de contenido por guild
    app.get('/api/dashboard/content-filter/:guildId', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        const guildDoc = await Guild.findOne({ guildId }).lean();
        const contentFilter = guildDoc?.contentFilter || {
            enabled: true,
            words: [],
            webs: []
        };

        return res.json({ 
            guildId,
            contentFilter 
        });
    });

    // Endpoint para actualizar filtro de contenido completo
    app.put('/api/dashboard/content-filter/:guildId', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        const { enabled, words, webs } = req.body;

        const updated = await Guild.findOneAndUpdate(
            { guildId },
            {
                $set: {
                    'contentFilter.enabled': enabled !== undefined ? enabled : true,
                    'contentFilter.words': normalizeFilterList(words),
                    'contentFilter.webs': normalizeFilterList(webs),
                    'contentFilter.updatedAt': new Date()
                },
                $setOnInsert: { guildId }
            },
            { new: true, upsert: true, lean: true }
        );

        return res.json({ 
            ok: true, 
            contentFilter: updated.contentFilter 
        });
    });

    // Endpoint para agregar palabra al filtro
    app.post('/api/dashboard/content-filter/:guildId/word', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        const word = String(req.body.word || '').trim().toLowerCase();
        if (!word) {
            return res.status(400).json({ error: 'WORD_REQUIRED' });
        }

        const updated = await Guild.findOneAndUpdate(
            { guildId },
            {
                $addToSet: { 'contentFilter.words': word },
                $set: { 'contentFilter.updatedAt': new Date() },
                $setOnInsert: { guildId }
            },
            { new: true, upsert: true, lean: true }
        );

        return res.json({ 
            ok: true, 
            contentFilter: updated.contentFilter 
        });
    });

    // Endpoint para remover palabra del filtro
    app.delete('/api/dashboard/content-filter/:guildId/word/:word', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        const word = String(req.params.word || '').trim().toLowerCase();

        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        if (!word) {
            return res.status(400).json({ error: 'WORD_REQUIRED' });
        }

        const updated = await Guild.findOneAndUpdate(
            { guildId },
            {
                $pull: { 'contentFilter.words': word },
                $set: { 'contentFilter.updatedAt': new Date() }
            },
            { new: true, lean: true }
        );

        return res.json({ 
            ok: true, 
            contentFilter: updated?.contentFilter || {} 
        });
    });

    // Endpoint para agregar sitio web al filtro
    app.post('/api/dashboard/content-filter/:guildId/web', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        const web = String(req.body.web || '').trim().toLowerCase();
        if (!web) {
            return res.status(400).json({ error: 'WEB_REQUIRED' });
        }

        const updated = await Guild.findOneAndUpdate(
            { guildId },
            {
                $addToSet: { 'contentFilter.webs': web },
                $set: { 'contentFilter.updatedAt': new Date() },
                $setOnInsert: { guildId }
            },
            { new: true, upsert: true, lean: true }
        );

        return res.json({ 
            ok: true, 
            contentFilter: updated.contentFilter 
        });
    });

    // Endpoint para remover sitio web del filtro
    app.delete('/api/dashboard/content-filter/:guildId/web/:web', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        const web = String(req.params.web || '').trim().toLowerCase();

        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        if (!web) {
            return res.status(400).json({ error: 'WEB_REQUIRED' });
        }

        const updated = await Guild.findOneAndUpdate(
            { guildId },
            {
                $pull: { 'contentFilter.webs': web },
                $set: { 'contentFilter.updatedAt': new Date() }
            },
            { new: true, lean: true }
        );

        return res.json({ 
            ok: true, 
            contentFilter: updated?.contentFilter || {} 
        });
    });

    // Endpoint para toggle enable/disable del filtro
    app.patch('/api/dashboard/content-filter/:guildId/toggle', requireSession, async (req, res) => {
        const guildId = String(req.params.guildId || '');
        if (!canManageGuild(req.sessionData, guildId)) {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }

        const guildDoc = await Guild.findOne({ guildId });
        if (!guildDoc) {
            return res.status(404).json({ error: 'GUILD_NOT_FOUND' });
        }

        const newEnabled = !guildDoc.contentFilter?.enabled;
        guildDoc.contentFilter = {
            ...guildDoc.contentFilter,
            enabled: newEnabled,
            updatedAt: new Date()
        };

        await guildDoc.save();

        return res.json({ 
            ok: true, 
            contentFilter: guildDoc.contentFilter 
        });
    });
}

// Export dashboard route registration
module.exports = {
    registerDashboardRoutes
};
