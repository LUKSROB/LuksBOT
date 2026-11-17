// Event handler for track end event

// Import necessary modules
const { clearPlayerImageCache } = require("../../utils/functions/imageDownload");

// Export the track end event handler
module.exports = async (player, _track, _payload, client) => {

    clearInterval(player.IntervalMusicCard);
    player._musicardState = null;

    clearPlayerImageCache(player);

    if (!player.connected) {
        client.activityManager?.clearMusic(player.guildId);
        player.destroy();
    }

}