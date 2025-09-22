// Event handler for queue end event

// Import necessary modules
const { EmbedBuilder } = require('discord.js');

// Export the queue end event handler
module.exports = async (player, client) => {

    const channel = client?.channels?.cache?.get(player.textChannel);
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('📭 Cola vacía')
        .setDescription('No hay más canciones en la cola.')
        .setTimestamp();
    
    channel.send({ embeds: [embed] });
    player.destroy();

};