// Interaction handler for pausing or resuming music

// Import necessary modules
const { pause } = require('../utils/functions/music');

// Export the interaction handler for pausing or resuming music
module.exports = async (interaction) => {
    const { guild, client } = interaction;
        
    let player = client.riffy.players.get(guild.id);

    try {
        if (!player || !guild.members.me.voice.channel) {
            return interaction.reply({ content: 'No estoy reproduciendo nada actualmente.', flags: 64 });
        }

        pause(interaction, player);

    } catch (error) {
    }
}