// Interaction handler for looping music

// Import necessary modules
const { loop } = require('../utils/functions/music');

// Export the interaction handler for looping music
module.exports = async (interaction) => {
    const { guild, client } = interaction;

    let player = client.riffy.players.get(guild.id);

    if (!player || !guild.members.me.voice.channel) {
        return interaction.reply({ content: 'No estoy reproduciendo nada actualmente.', flags: 64 });
    }

    loop(interaction, player);

}