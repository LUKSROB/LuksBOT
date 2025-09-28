// Event handler for track end event

// Export the track end event handler
module.exports = async (player) => {

    clearInterval(player.musicInterval);

}