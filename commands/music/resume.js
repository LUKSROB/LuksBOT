// Command resume: Resume the current song

// Import necessary modules
const { SlashCommandBuilder } = require('discord.js');
const { resume } = require('../../utils/functions/music');

// Export the resume command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Reanuda la pista actual'),
    // Execute the command
    execute: async (interaction) => {
        const { guild, client } = interaction;

        let player = client.riffy.players.get(guild.id);

        interaction.deferReply();

        try {
            if (!player || !guild.members.me.voice.channel) {
                return interaction.editReply({ content: 'No estoy reproduciendo nada actualmente.', flags: 64 });
            }

            await resume(interaction, player);

        } catch (error) {
            console.error(error);
            interaction.editReply({ content: '❌ ¡Error al reanudar la música!', flags: 64 });
        }

    }
}