// Event handler for queue end event

// Import necessary modules
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../../config.json');

// Export the queue end event handler
module.exports = async (player, client) => {

    const channel = client?.channels?.cache?.get(player.textChannel);
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle('Lista de reproducción vacía')
        .setDescription('No hay más canciones en la cola.')
        .setTimestamp();
    
    channel.send({ embeds: [embed] });
    player.destroy();

};