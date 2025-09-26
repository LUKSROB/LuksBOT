// Interaction handler for looping music

// Import necessary modules
const { loop } = require('../utils/functions/music');

// Export the interaction handler for looping music
module.exports = async (interaction) => {
    const { guild, client } = interaction;

    let player = client.riffy.players.get(guild.id);

    interaction.deferReply();

    if (!player || !guild.members.me.voice.channel) {
        return interaction.editReply({ content: 'No estoy reproduciendo nada actualmente.', flags: 64 });
    }

    await loop(interaction, player);

}