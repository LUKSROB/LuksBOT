// Event handler for track end event

// Export the track end event handler
module.exports = async (player) => {

    if (!player) return;

    if (player.message) await player.message.delete();

    clearInterval(player.musicInterval);

}