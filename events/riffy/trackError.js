// Event handler for music error event

// Export the track error event handler
module.exports = ( player, track, error, client ) => {

    const channel = client?.channels?.cache?.get(player.textChannel);

    if (channel) channel.send(`Hubo un error al reproducir: **${track.info.title}**`);
    
    player.stop();
    
};