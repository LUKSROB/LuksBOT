const { Client, Events } = require("discord.js");
const config = require('./config.json');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: 53608447
});

// Load events
fs.readdirSync('./events')
  .filter((filename) => filename.endsWith('.js'))
  .forEach((filename) => {
    try {
        const listener = require(`./events/${filename}`);
        const eventName = path.basename(filename, '.js');

        client.on(eventName, listener);
    } catch (err) {
        console.log(`Error loading event ${filename}`, err);
    }
});

// Conect to Discord
client.login(config.BOT_TOKEN);
