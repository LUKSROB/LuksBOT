// File index for the bot

// Dependencies
const Discord = require('discord.js');
const mongoose = require('mongoose');
const deepl = require('deepl-node');
const { Riffy } = require('riffy');
const config = require('./config.json');
const { setGuild } = require('./db/guild')
const { updateCache } = require('./utils/functions/invites')

const fs = require('fs');
const path = require('path');
const express = require('express')

const app = express()
const port = process.env.PORT || 4000;

// Create a new Discord client
const client = new Discord.Client({
    intents: 53608447
});

// Create Riffy instance
const nodes = config.NODES;

client.riffy = new Riffy(client, nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4",
    bypassChecks: {
        nodeFetchInfo: false // o true, según tu necesidad
    }
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
console.log('DeepL Translator initialized')

// Load commands
client.commands = new Discord.Collection();

fs.readdirSync('./commands')
  .forEach((commandfile) => {
    const cmd = fs.readdirSync(`./commands/${commandfile}`);

    for (const file of cmd) {
        const command = require(`./commands/${commandfile}/${file}`);

        client.commands.set(command.data.name, command);
    }
});

// Charge commands
const REST = new Discord.REST().setToken(config.BOT_TOKEN);

(async () => {
    try {
        await REST.put(
            Discord.Routes.applicationGuildCommands(config.APP_ID, config.GUILD_ID),
            { body: client.commands.map(cmd => cmd.data.toJSON())}
        );
        console.log(`Loaded ${client.commands.size} commands`);
    } catch (err) {
        console.log('Error loading commands');
        console.error(err);
    }
})();

// Load Client events
fs.readdirSync('./events/client')
  .filter((filename) => filename.endsWith('.js'))
  .forEach((filename) => {
    try {
        const listener = require(`./events/client/${filename}`);
        const eventName = path.basename(filename, '.js');

        client.on(eventName, (...args) => listener(...args, client));
    } catch (err) {
        console.log(`Error loading event ${filename}`, err);
    }
});

// Load Riffy events
fs.readdirSync('./events/riffy')
  .filter((filename) => filename.endsWith('.js'))
  .forEach((filename) => {
    try {
        const listener = require(`./events/riffy/${filename}`);
        const eventName = path.basename(filename, '.js');

        client.riffy.on(eventName, (...args) => listener(...args, client));
    } catch (err) {
        console.log(`Error loading event ${filename}`, err);
    }
});

// Event handler for bot ready event
client.once("clientReady", () => {
    client.riffy.init(client.user.id);
    console.log(`Connected to Discord! as ${client.user.username}`);

    client.guilds.cache.map(async guild => {
        await setGuild(guild);
    });

    updateCache(client);
});

// Event handler for raw event
client.on("raw", (d) => {
    if (![Discord.GatewayDispatchEvents.VoiceStateUpdate, Discord.GatewayDispatchEvents.VoiceServerUpdate,].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});

// Conect to Discord
client.login(config.BOT_TOKEN);

// Express server for health check
app.get('/', (req, res) => {
    res.send(config.WEB)

    const fullUrl = req.get('host') + req.originalUrl;
        
    setTimeout(() => {
        client.user.setActivity({
            name: fullUrl,
            type: 3,
            status: 'online',
        });
    }, 1000);
    
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});

