// Interaction handler for stopping music

// Import necessary modules
const { MessageFlags } = require('discord.js');
const { stop } = require('../utils/functions/music');

// Export the interaction handler for stopping music
module.exports = async (interaction) => {

    const { guild, client } = interaction;
        
    let player = client.riffy.players.get(guild.id);

    await interaction.deferReply();

    try {
        if (!player || !guild.members.me.voice.channel) {
            return await interaction.editReply({ content: 'No estoy reproduciendo nada actualmente.', flags: MessageFlags.Ephemeral });
        }

        await stop(interaction, player);

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'Error al detener la música ❌', flags: MessageFlags.Ephemeral });
    }

}