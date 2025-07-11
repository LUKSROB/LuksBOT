const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('greet')
        .setDescription('Saluda al usuario'),

    execute: async (interaction, userData) => {

        // Reply with greeting
        await interaction.reply(`¡Hola ${interaction.user.username}! tienes un total de ${userData.commandCount} comandos utilizados.`);
    },
}