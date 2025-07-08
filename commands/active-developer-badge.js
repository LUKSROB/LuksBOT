const { SlashCommandBuilder, Routes } = require('discord.js');
const { createInterface } = require('node:readline');
const { execSync } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('active-developer-badge')
        .setDescription('Displays the active developer badge'),
    execute: async (interaction) => {
        interaction.reply(`Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency is ${Math.round(interaction.client.ws.ping)}ms`);

        const rl = createInterface({ input: process.stdin, output: process.stdout });

        const question = (q) => new Promise((resolve) => rl.question(q, resolve));
        (async ()=>{
            const token = await question('Application token? ');
            if(!token) throw new Error('Invalid token');

            const ratelimitTest = await fetch(`https://discord.com/api/v9/invites/discord-developers`);

            if(!ratelimitTest.ok) {
                await question(`Uh oh, looks like the node you're on is currently being blocked by Discord. Press the "Enter" button on your keyboard to be reassigned to a new node. (you'll need to rerun the program once you reconnect)`)

                // This kills the container manager on the repl forcing Replit to assign the repl to another node with another IP address (if the ip is globally rate limited)
                //^ in short: Restarts the bot to be used again/attempted to start up again!
                execSync('kill 1');
                return;
            };
            
            await interaction.client.rest.put(
                Routes.applicationCommands(interaction.client.user.id),
                { body: Array.from(interaction.client.commands.values()).map(cmd => cmd.data.toJSON()) });

            console.log('DONE | Application/Bot is up and running. DO NOT CLOSE THIS TAB UNLESS YOU ARE FINISHED USING THE BOT, IT WILL PUT THE BOT OFFLINE.');
        })();
        
    }
};