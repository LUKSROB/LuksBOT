// File index for the bot

// Dependencies
const Discord = require('discord.js');
const mongoose = require('mongoose');
const deepl = require('deepl-node');
const config = require('./config.json');

const fs = require('fs');
const path = require('path');
const express = require('express')

const app = express()
const port = process.env.PORT || 4000;

// Create a new Discord client
const client = new Discord.Client({
    intents: 53608447
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

// Load events
fs.readdirSync('./events/client')
  .filter((filename) => filename.endsWith('.js'))
  .forEach((filename) => {
    try {
        const listener = require(`./events/client/${filename}`);
        const eventName = path.basename(filename, '.js');

        client.on(eventName, listener);
    } catch (err) {
        console.log(`Error loading event ${filename}`, err);
    }
});

// Conect to Discord
client.login(config.BOT_TOKEN);

// Express server for health check
app.get('/', (req, res) => {
    res.send('Hello World!')

    const fullUrl = req.get('host') + req.originalUrl;
        
    client.user.setActivity({
        name: fullUrl,
        type: 3,
        status: 'online',
    });
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});

