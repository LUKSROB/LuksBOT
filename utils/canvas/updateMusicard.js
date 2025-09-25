// Function to generate and update a music card image for the currently playing track

// Import necessary modules
const { Classic } = require("musicard");
const { convertTime, musicProgress } = require("../../utils/functions/convertTime");

// Function to create or update the music card
async function updateMusicard(track, player, init = false, color) {
    const musicLength = convertTime(track.info.length);
    const timeProgress = convertTime(player.position);

    const percProgress = musicProgress(player.position, track.info.length);

    const musicard = await Classic({
        thumbnailImage: track.info.thumbnail,
        backgroundColor: '#070707',
        progress: init ? 0 : percProgress,
        progressColor: color || '#FF7A00',
        progressBarColor: color + '33' || '#FF7A0033',
        name: track.info.title,
        nameColor: color || '#FF7A00',
        author: track.info.author,
        authorColor: '#696969',
        startTime: timeProgress,
        endTime: musicLength,
        timeColor: color || '#FF7A00',
    });

    return musicard;
}

// Export the function for use in other modules
module.exports = {
    updateMusicard
};