const { SlashCommandBuilder } = require('discord.js');
const { createHelpHomePayload } = require('../../utils/functions/helpCenter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Centro de ayuda para principiantes (comandos, canales y botones)'),
    execute: async (interaction) => {
        await interaction.reply(createHelpHomePayload(interaction.client));
    }
};