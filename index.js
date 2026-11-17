// File index for the bot

// Prevent bot from crashing on unhandled errors (e.g. Riffy voice disconnects)
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION]', err);
});

// Dependencies
require('dotenv').config();
const Discord = require('discord.js');
const mongoose = require('mongoose');
const { createHash } = require('crypto');
const { Riffy } = require('riffy');
const { patchRiffyRest } = require('./utils/functions/patchRiffyRest');
const { prepareLavalinkNodes, createLavalinkFailoverManager } = require('./utils/functions/lavalinkFailover');
const { createActivityManager } = require('./utils/functions/activity');
const { indexCommands, indexInteractions, loadEventHandlers, getCommandModule, resolveInteractionHandler } = require('./utils/functions/handler');
const { createContentFilter } = require('./utils/functions/contentFilter');
const { registerDashboardRoutes } = require('./utils/functions/dashboard');
const { getStateValue, setStateValue } = require('./db/runtimeState');
const config = require('./config.json');

const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 4000;
const DISCORD_ID = process.env.DISCORD_ID;
const WEBSITE_URL = process.env.WEBSITE_URL;
const ACTIVITY_NAME = process.env.ACTIVITY_NAME;

app.set('trust proxy', 1);

console.clear();

function startHttpServer() {
    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, () => {
            console.log(`App listening on port ${PORT}`);
            resolve(server);
        });

        server.on('error', reject);
    });
}

function commandHash(commandData = []) {
    const normalized = [...commandData]
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map((item) => JSON.stringify(item))
        .join('\n');

    return createHash('sha256').update(normalized).digest('hex');
}

async function registerCommandsIfChanged(rest, commandData) {
    if (!Array.isArray(commandData) || commandData.length === 0) {
        console.warn('No valid commands found to register');
        return;
    }

    const currentHash = commandHash(commandData);
    const stateKey = `discord:commands:${DISCORD_ID}:${config.GUILD_ID}`;

    let previousHash = null;
    try {
        previousHash = await getStateValue(stateKey);
    } catch (error) {
        console.warn('[Commands] No se pudo leer hash previo de comandos:', error.message || error);
    }

    if (previousHash && previousHash === currentHash) {
        console.log('Commands unchanged. Discord registration skipped.');
        return;
    }

    await rest.put(
        Discord.Routes.applicationGuildCommands(DISCORD_ID, config.GUILD_ID),
        { body: commandData }
    );
    console.log(`Registered ${commandData.length} commands on Discord`);

    try {
        await setStateValue(stateKey, currentHash);
    } catch (error) {
        console.warn('[Commands] No se pudo guardar hash de comandos:', error.message || error);
    }
}

(async () => {
    // Patch Riffy REST to handle transient network errors gracefully
    patchRiffyRest();
    
    // Create a new Discord client
    const client = await new Discord.Client({
        intents: [
            Discord.GatewayIntentBits.Guilds,
            Discord.GatewayIntentBits.GuildMembers,
            Discord.GatewayIntentBits.GuildModeration,
            Discord.GatewayIntentBits.GuildInvites,
            Discord.GatewayIntentBits.GuildVoiceStates,
            Discord.GatewayIntentBits.GuildMessages,
            Discord.GatewayIntentBits.MessageContent,
            // Discord.GatewayIntentBits.GuildEmojisAndStickers,
            // Discord.GatewayIntentBits.GuildIntegrations,
            // Discord.GatewayIntentBits.GuildWebhooks,
            // Discord.GatewayIntentBits.GuildPresences,
            // Discord.GatewayIntentBits.GuildMessageReactions,
            // Discord.GatewayIntentBits.GuildMessageTyping,
            // Discord.GatewayIntentBits.DirectMessages,
            // Discord.GatewayIntentBits.DirectMessageReactions,
            // Discord.GatewayIntentBits.DirectMessageTyping,
            // Discord.GatewayIntentBits.GuildScheduledEvents,
            // Discord.GatewayIntentBits.AutoModerationConfiguration,
            // Discord.GatewayIntentBits.AutoModerationExecution,
            // Discord.GatewayIntentBits.GuildMessagePolls,
            // Discord.GatewayIntentBits.DirectMessagePolls
        ]
    });

    client.contentFilter = null;
    
    // Default activity: webpage
    const pageUrl =
        WEBSITE_URL ||
        config.WEBSITE_URL ||
        `http://localhost:${PORT}`;

    client.activityManager = createActivityManager(client, {
        defaultName: ACTIVITY_NAME || pageUrl,
        defaultType: Discord.ActivityType.Watching,
        defaultUrl: pageUrl,
        status: 'online',
    });

    // Create Riffy instance
    const nodes = prepareLavalinkNodes(config.NODES);
    if (!Array.isArray(nodes) || nodes.length === 0) {
        console.error('[Lavalink] No hay nodos válidos configurados en config.NODES');
    }

    client.riffy = new Riffy(client, [], {
        send: (payload) => {
            const guild = client.guilds.cache.get(payload.d.guild_id);
            if (guild) guild.shard.send(payload);
        },
        defaultSearchPlatform: "ytmsearch",
        restVersion: "v4",
        migrateOnDisconnect: false,
        migrateOnFailure: false
    });

    // Create Lavalink failover manager
    client.lavalinkFailover = createLavalinkFailoverManager(client, nodes, {
        connectAttemptTimeoutMs: 10000,
        retryRoundDelayMs: 15000,
        failureBaseCooldownMs: 60000,
        failureMaxCooldownMs: 300000,
        rateLimitCooldownMs: 600000,
        ignoreFailureWindowMs: 8000
    });

    // Connect to MongoDB 
    const mongoConnectPromise = mongoose.connect(process.env.MONGO_CLIENT, {
        maxPoolSize: 20,
        minPoolSize: 5
    })
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((err) => {
            console.error('Error connecting to Mongoose:', err);
            throw err;
        });

    // Set up DeepL translator with lazy singleton
    let deeplTranslatorInstance = null;
    client.getTranslator = () => {
        if (!process.env.DEEPL_KEY) {
            throw new Error('DeepL API key is not configured');
        }

        if (!deeplTranslatorInstance) {
            const deepl = require('deepl-node');
            deeplTranslatorInstance = new deepl.Translator(process.env.DEEPL_KEY);
            console.log('DeepL Translator initialized (lazy)');
        }

        return deeplTranslatorInstance;
    };

    // Load commands with Hybrid System
    console.log('Indexing commands for lazy loading...');
    const { commands: commandIndex, commandData } = await indexCommands();
    client.commands = commandIndex;

    const commandCache = new Map();

    client.getCommand = (commandName) => {
        if (commandCache.has(commandName)) {
            return commandCache.get(commandName);
        }

        const meta = client.commands.get(commandName);
        if (!meta) {
            return null;
        }

        try {
            const command = getCommandModule(meta.modulePath);

            if (!command || typeof command.execute !== 'function') {
                console.error(`Invalid command when loading at runtime: ${commandName}`);
                return null;
            }

            commandCache.set(commandName, command);
            console.log(`⚡ Lazy loaded: ${commandName}`);
            return command;
        } catch (err) {
            console.error(`Error doing lazy load of "${commandName}":`, err);
            return null;
        }
    };

    console.log('Indexing interaction handlers...');
    client.interactions = await indexInteractions();
    client.getInteractionHandler = (customId) => {
        return resolveInteractionHandler(client.interactions, customId);
    };

    // Register commands with Discord
    const REST = new Discord.REST().setToken(process.env.DISCORD_KEY);

    try {
        await mongoConnectPromise;
    } catch (error) {
        console.warn('[Startup] MongoDB no disponible para comparar hash; se registrarán comandos igual.');
    }

    try {
        await registerCommandsIfChanged(REST, commandData);
    } catch (err) {
        console.log('Error registering commands');
        console.error(err);
    }

    // Load events
    await Promise.all([
        loadEventHandlers(client, path.join(__dirname, 'events', 'client'), client, 'client'),
        loadEventHandlers(client.riffy, path.join(__dirname, 'events', 'riffy'), client, 'riffy')
    ]);

    // Event handler for raw event
    client.on("raw", (d) => {
        if (![
            Discord.GatewayDispatchEvents.VoiceStateUpdate,
            Discord.GatewayDispatchEvents.VoiceServerUpdate
        ].includes(d.t)) return;
        client.riffy.updateVoiceState(d);
    });

    // Express server for health check
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    // Cookie parser middleware - MUST be before routes
    app.use((req, res, next) => {
        const cookieHeader = req.headers.cookie || '';
        req.cookies = {};
        if (cookieHeader) {
            cookieHeader.split(';').forEach((cookie) => {
                const [key, val] = cookie.trim().split('=');
                if (key) {
                    try {
                        req.cookies[key] = decodeURIComponent(val || '');
                    } catch {
                        req.cookies[key] = val || '';
                    }
                }
            });
        }
        next();
    });
    
    app.use(express.static(path.join(__dirname, 'public')));

    registerDashboardRoutes(app, client, config);

    app.get('/', (req) => {

        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

        if (client.isReady() && client.activityManager) {
            client.activityManager.setDefault({
                name: ACTIVITY_NAME || fullUrl,
                type: Discord.ActivityType.Watching
            })
        }
    });

    // Start Express and login in parallel to keep health endpoint available even if login fails
    await Promise.all([
        startHttpServer(),
        client.login(process.env.DISCORD_KEY)
            .then(() => console.log('Bot logged in to Discord successfully!'))
            .catch((err) => {
                console.error('ERROR: Failed to login to Discord:', err);
            })
    ]);
})();
