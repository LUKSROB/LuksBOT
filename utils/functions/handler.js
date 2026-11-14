// Function to handle command indexing and event loading for the bot

// Import required modules
const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const commandModuleCache = new Map();

// Function to get a cached command module or require it if not cached
function getCommandModule(modulePath) {
    if (commandModuleCache.has(modulePath)) {
        return commandModuleCache.get(modulePath);
    }

    const command = require(modulePath);
    commandModuleCache.set(modulePath, command);
    return command;
}

// Function to index commands and load event handlers for the bot
async function indexCommands() {

    const commands = new Discord.Collection();
    const commandData = [];
    const commandsRoot = path.join(__dirname, '../../commands');
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
            const command = getCommandModule(modulePath);

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

// Function to load event handlers from a specified directory
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

// Export the handlers functions for use in other modules
module.exports = {
    getCommandModule,
    indexCommands,
    loadEventHandlers
};