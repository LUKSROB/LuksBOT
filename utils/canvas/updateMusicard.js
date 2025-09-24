// Function to generate and update a music card image for the currently playing track

// Import necessary modules
const { Classic } = require("musicard");
const { convertTime, musicProgress } = require("../functions/convertTime");

// Function to update the music card with current track info and progress
async function updateMusicard(track, player, init = false) {
    const musicLength = convertTime(track.info.length);
    const timeProgress = convertTime(player.position);

    const percProgress = musicProgress(player.position, track.info.length);

    const musicard = await Classic({
        thumbnailImage: track.info.thumbnail,
        backgroundColor: '#070707',
        progress: init ? 0 :percProgress,
        progressColor: '#FF7A00',
        progressBarColor: '#5F2D00',
        name: track.info.title,
        nameColor: '#FF7A00',
        author: track.info.author,
        authorColor: '#696969',
        startTime: timeProgress,
        endTime: musicLength,
        timeColor: '#FF7A00',
    });

    return musicard;
}

// Export the function for use in other modules
module.exports = {
    updateMusicard
};