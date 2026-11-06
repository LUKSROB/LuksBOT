// Event handler for music error event

// import necessary modules
const { MessageFlags } = require('discord.js');

// Export the track error event handler
module.exports = ( player, track, error, client ) => {

    const channel = client?.channels?.cache?.get(player.textChannel);

    if (channel) channel.send({ content: `Hubo un error al reproducir: **${track.info.title}**`, flags: MessageFlags.Ephemeral });

    player.stop();

};