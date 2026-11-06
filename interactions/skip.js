// Interaction handler for skipping music

// Import necessary modules
const { MessageFlags } = require('discord.js');
const { skip } = require('../utils/functions/music');

// Export the interaction handler for skipping music
module.exports = async (interaction) => {

    const { guild, client } = interaction;
        
    let player = client.riffy.players.get(guild.id);

    await interaction.deferReply();

    try {
        if (!player || !guild.members.me.voice.channel) {
            return await interaction.editReply({ content: 'No estoy reproduciendo nada actualmente.', flags: MessageFlags.Ephemeral });
        }

        await skip(interaction, player);

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'Error al saltar la canción ❌', flags: MessageFlags.Ephemeral });
    }

}