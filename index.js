// File index for the bot

// Dependencies
const Discord = require("discord.js");
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

// Load commands
client.commands = new Discord.Collection();

fs.readdirSync('./commands')
  .forEach((commandfile) => {
    const command = require(`./commands/${commandfile}`);
    client.commands.set(command.data.name, command);
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

app.get('/', (req, res) => {
    res.send('Hello World!')
  })

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

// Conect to Discord
client.login(config.BOT_TOKEN);
