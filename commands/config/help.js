// Command help: Displays all commands and their descriptions

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');

// Export the help command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Muestra todos los comandos y sus descripciones'),
    // Execute the command
    execute: async (interaction) => {
        const { commands } = interaction.client;

        const reply = commands.map(command => `**/${command.data.name}**: ${command.data.description}`).join('\n');

        interaction
            .reply(reply)
            .catch(console.error);
    }
}