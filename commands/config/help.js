// Command help: Provides a help center for beginners (commands, channels, and buttons)

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');
const { createHelpHomePayload } = require('../../utils/functions/helpCenter');

// Export the help command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Centro de ayuda para principiantes (comandos, canales y botones)'),
    // Execute the command when invoked
    execute: async (interaction) => {
        await interaction.reply(createHelpHomePayload(interaction.client));
    }
};