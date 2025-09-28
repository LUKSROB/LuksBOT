// Event handler for queue end event

// Import necessary modules
const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config.json');

// Export the queue end event handler
module.exports = async (player, client) => {

    const channel = client?.channels?.cache?.get(player.textChannel);
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle('Lista de reproducción vacía')
        .setDescription('No hay más canciones en la cola.')
        .setTimestamp();

    clearInterval(player.musicInterval);

    if (player.message) {
        await player.message.edit({ components: []}).catch((e) => {
            console.log("No pude editar el mensaje anterior.", e);
        });
    }
    
    setTimeout(() => {
        channel.send({ embeds: [embed] });
        player.destroy();
    }, 5000);
};