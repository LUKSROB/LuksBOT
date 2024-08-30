// 

const { Events } = require('discord.js');

module.exports = 
async (interaction) => {
    const client = interaction.client;

    try{
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            command.execute(interaction).catch();
        } else {}
    } catch (error) {
        console.error(error);
    }
};