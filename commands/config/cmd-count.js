// command cmdCount: Shows the number of commands used by the user

// Import dependencies
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('cmd-count')
        .setDescription('Muestra la cantidad de comandos utilizados por el usuario'),
    // Execute the command
    execute: async (interaction, userData) => {
        const cmdCount = userData.commandCount == undefined ? 0 : userData.commandCount;

        await interaction.reply(`¡Hola ${interaction.user.username}! tienes un total de ${cmdCount} comandos utilizados.`);
    },
}