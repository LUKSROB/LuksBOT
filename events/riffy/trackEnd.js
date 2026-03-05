// Event handler for track end event

// Export the track end event handler
module.exports = async (player) => {

    clearInterval(player.musicInterval);

    // If the voice connection was lost, destroy the player to avoid crash
    if (!player.connected) {
        player.destroy();
    }

}