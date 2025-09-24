// Interaction handler for skipping music

// Import necessary modules
const { skip } = require('../utils/functions/music');

// Export the interaction handler for skipping music
module.exports = async (interaction) => {
    const { guild, client } = interaction;
        
    let player = client.riffy.players.get(guild.id);

    try {
        if (!player || !guild.members.me.voice.channel) {
            return interaction.reply({ content: 'No estoy reproduciendo nada actualmente.', flags: 64 });
        }

        skip(interaction, player);

    } catch (error) {
    }
}