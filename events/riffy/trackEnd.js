// Event handler for track end event

// Export the track end event handler
module.exports = async (player, _track, _payload, client) => {

    clearInterval(player.IntervalMusicCard);

    if (!player.connected) {
        client.activityManager?.clearMusic(player.guildId);
        player.destroy();
    }

}