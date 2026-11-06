// File index for the bot

// Prevent bot from crashing on unhandled errors (e.g. Riffy voice disconnects)
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION]', err);
});

// Dependencies
const Discord = require('discord.js');
const mongoose = require('mongoose');
const deepl = require('deepl-node');
const { Riffy } = require('riffy');
const { patchRiffyRest } = require('./utils/functions/patchRiffyRest');
const { prepareLavalinkNodes, createLavalinkFailoverManager } = require('./utils/functions/lavalinkFailover');
const { createActivityManager } = require('./utils/functions/activity');
const { indexCommands, loadEventHandlers } = require('./utils/functions/handler');
const config = require('./config.json');

const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 4000;

console.clear();

(async () => {
    // Patch Riffy REST to handle transient network errors gracefully
    patchRiffyRest();
    
    // Create a new Discord client
    const client = await new Discord.Client({
        intents: 53608447 // All intents enabled for the client
    });
    
    // Default activity: webpage
    const pageUrl =
        process.env.WEBSITE_URL ||
        config.WEBSITE_URL ||
        `http://localhost:${port}`;

    client.activityManager = createActivityManager(client, {
        defaultName: config.ACTIVITY_PAGE_NAME || pageUrl,
        defaultType: Discord.ActivityType.Watching,
        defaultUrl: pageUrl,
        status: 'online',
    });

    // Create Riffy instance
    const nodes = prepareLavalinkNodes(config.NODES);

    client.riffy = new Riffy(client, [], {
        send: (payload) => {
            const guild = client.guilds.cache.get(payload.d.guild_id);
            if (guild) guild.shard.send(payload);
        },
        defaultSearchPlatform: "ytmsearch",
        restVersion: "v4",
        migrateOnDisconnect: false,
        migrateOnFailure: false,
        bypassChecks: {
            nodeFetchInfo: true
        }
    });

    // Create Lavalink failover manager
    client.lavalinkFailover = createLavalinkFailoverManager(client, nodes, {
        connectAttemptTimeoutMs: 12000,
        retryRoundDelayMs: 3000,
        failureBaseCooldownMs: 15000,
        failureMaxCooldownMs: 300000,
        rateLimitCooldownMs: 600000,
        ignoreFailureWindowMs: 8000
    });

    // Connect to MongoDB 
    (async () => {
        try {
            await mongoose.connect(config.MONGO_URL);
            console.log('Connected to MongoDB');
        } catch (err) {
            console.error('Error connecting to Mongoose:', err);
        }
    })();

    // Set up DeepL translator
    client.translator = new deepl.Translator(config.DeepL_API_KEY);
    console.log('DeepL Translator initialized');

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
            const command = require(meta.modulePath);

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

    // Register commands with Discord
    const REST = new Discord.REST().setToken(config.BOT_TOKEN);

    (async () => {
        try {
            if (commandData.length === 0) {
                console.warn('No valid commands found to register');
                return;
            }
            
            await REST.put(
                Discord.Routes.applicationGuildCommands(config.APP_ID, config.GUILD_ID),
                { body: commandData }
            );
            console.log(`Registered ${commandData.length} commands on Discord`);
        } catch (err) {
            console.log('Error registering commands');
            console.error(err);
        }
    })();

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
    app.get('/', (req, res) => {
        res.send(config.WEB)

        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

        if (client.isReady() && client.activityManager) {
            client.activityManager.setDefault({
                name: config.ACTIVITY_PAGE_NAME || fullUrl,
                type: Discord.ActivityType.Watching
            })
        }
    });

    // Start the Express server and login the bot to Discord
    app.listen(port, () => {
        console.log(`App listening on port ${port}`)

        client.login(config.BOT_TOKEN)
            .then(() => console.log('Bot logged in to Discord successfully!'))
            .catch(err => {
                console.error('ERROR: Failed to login to Discord:', err);
                process.exit(1);
            });
    });
})();
