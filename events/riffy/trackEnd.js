// Event handler for track end event

// Export the track end event handler
module.exports = async (player, client) => {

    clearInterval(player.IntervalMusicCard);

    if (!player.connected) {
        client.activityManager?.clearMusic(player.guildId);
        player.destroy();
    }

}