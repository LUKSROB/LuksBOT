// Command cmd-count: Shows the number of commands used by the user

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');

// Export the cmdCount command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('cmd-count')
        .setDescription('Muestra la cantidad de comandos utilizados por el usuario'),
    // Execute the command
    // Execute the command when invoked
    execute: async (interaction, userData) => {
        const cmdCount = userData.commandCount == undefined ? 0 : userData.commandCount;

        await interaction.reply(`¡Hola ${interaction.user.username}! tienes un total de ${cmdCount} comandos utilizados.`);
    },
}