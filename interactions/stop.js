// Interaction handler for stopping music

// Import necessary modules
const { stop } = require('../utils/functions/music');

// Export the interaction handler for stopping music
module.exports = async (interaction) => {
    const { guild, client } = interaction;
        
    let player = client.riffy.players.get(guild.id);

    try {
        if (!player || !guild.members.me.voice.channel) {
            return interaction.reply({ content: 'No estoy reproduciendo nada actualmente.', flags: 64 });
        }

        stop(interaction, player);

    } catch (error) {
    }
}