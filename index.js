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
const config = require('./config.json');

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 4000;

console.clear();

async function indexCommands() {
    const commands = new Discord.Collection();
    const commandData = [];
    const commandsRoot = path.join(__dirname, 'commands');
    let totalIndexed = 0;
    let totalInvalid = 0;

    let folders = [];

    try {
        const commandEntries = await fsp.readdir(commandsRoot, { withFileTypes: true });
        folders = commandEntries.filter((entry) => entry.isDirectory());
    } catch (err) {
        console.error('Error reading command folders:', err);
        return { commands, commandData };
    }

    const filesByFolder = await Promise.all(
        folders.map(async (folder) => {
            const folderPath = path.join(commandsRoot, folder.name);

            try {
                const fileEntries = await fsp.readdir(folderPath, { withFileTypes: true });
                return fileEntries
                    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
                    .map((entry) => path.join(folderPath, entry.name));
            } catch (err) {
                console.error(`Error reading command folder ${folderPath}:`, err.message);
                totalInvalid++;
                return [];
            }
        })
    );

    for (const modulePath of filesByFolder.flat()) {
        try {
            delete require.cache[require.resolve(modulePath)];
            const command = require(modulePath);

            const isValid =
                command &&
                command.data &&
                command.data.name &&
                typeof command.execute === 'function' &&
                typeof command.data.toJSON === 'function';

            if (!isValid) {
                console.warn(`Invalid command: ${modulePath}`);
                totalInvalid++;
                continue;
            }

            if (commands.has(command.data.name)) {
                console.warn(`Duplicate command: ${command.data.name} (${modulePath})`);
                totalInvalid++;
                continue;
            }

            const json = command.data.toJSON();

            commands.set(command.data.name, {
                modulePath,
                data: json
            });
            commandData.push(json);
            totalIndexed++;

            // Clave para lazy real: descargar del cache tras indexar metadata
            delete require.cache[require.resolve(modulePath)];
        } catch (err) {
            console.error(`Error indexing ${modulePath}:`, err.message);
            totalInvalid++;
        }
    }

    console.log(`Commands indexed: ${totalIndexed}`);
    if (totalInvalid > 0) {
        console.warn(`Files invalid/erroneous: ${totalInvalid}`);
    }

    return { commands, commandData };
}

async function loadEventHandlers(emitter, eventsPath, client, emitterLabel) {
    let eventEntries = [];

    try {
        eventEntries = await fsp.readdir(eventsPath, { withFileTypes: true });
    } catch (err) {
        console.error(`Error reading events from ${emitterLabel}:`, err);
        return;
    }

    const eventFiles = eventEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.js'));

    for (const file of eventFiles) {
        const modulePath = path.join(eventsPath, file.name);

        try {
            const listener = require(modulePath);
            const eventName = path.basename(file.name, '.js');

            emitter.on(eventName, (...args) => listener(...args, client));
        } catch (err) {
            console.log(`Error loading ${emitterLabel} event ${file.name}`, err);
        }
    }
}

(async () => {
    // Patch Riffy REST to handle transient network errors gracefully
    patchRiffyRest();
    
    // Create a new Discord client
    const client = await new Discord.Client({
        intents: 53608447 // All intents enabled for the client
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
        migrateOnDisconnect: true,
        migrateOnFailure: true,
        bypassChecks: {
            nodeFetchInfo: true
        }
    });

    client.lavalinkFailover = createLavalinkFailoverManager(client, nodes, {
        connectAttemptTimeoutMs: 15000,
        retryRoundDelayMs: 5000
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

        const fullUrl = req.get('host') + req.originalUrl;

        if (client.isReady()) {
            setTimeout(() => {
                client.user.setActivity({
                    name: fullUrl,
                    type: 3,
                    status: 'online',
                });
            }, 1000);
        }
    });

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
