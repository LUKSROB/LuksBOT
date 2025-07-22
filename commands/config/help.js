// Command to show all commands and their descriptions

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all commands and their descriptions'),

    execute: async (interaction) => {
        const { commands } = interaction.client;

        const reply = commands.map(command => `**/${command.data.name}**: ${command.data.description}`).join('\n');

        interaction
            .reply(reply)
            .catch(console.error);
    }
}