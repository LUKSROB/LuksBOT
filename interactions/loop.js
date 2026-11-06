// Interaction handler for looping music

// Import necessary modules
const { MessageFlags } = require('discord.js');
const { loop } = require('../utils/functions/music');

// Export the interaction handler for looping music
module.exports = async (interaction) => {

    const { guild, client } = interaction;

    let player = client.riffy.players.get(guild.id);

    await interaction.deferReply();

    if (!player || !guild.members.me.voice.channel) {
        return await interaction.editReply({ content: 'No estoy reproduciendo nada actualmente.', flags: MessageFlags.Ephemeral });
    }

    await loop(interaction, player);

}