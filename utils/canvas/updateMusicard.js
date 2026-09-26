// Function to generate and update a music card image for the currently playing track

// Import necessary modules
const { Bloom, initializeFonts, registerFont } = require("musicard");
const { convertTime, musicProgress } = require("../../utils/functions/convertTime");
const { brightnessHex } = require("../functions/colors");

// Function to create or update the music card
async function updateMusicard(track, player, init = false, color) {
    registerFont('YujiSyuku-Regular.ttf', 'YujiSyuku');

    initializeFonts();

    if (!track?.info?.thumbnail) {
        return null;
    }

    try {
        const musicLength = convertTime(track.info.length);
        const timeProgress = convertTime(player.position);
        const percProgress = musicProgress(player.position, track.info.length);
        const colorBright = brightnessHex(color || '#FF7A00', 0.3);

        const musicard = await Bloom({
            trackName: track.info.title,
            artistName: track.info.author,
            albumArt: track.info.thunbnail,
            isExplicit: track,
            timeAdjust: {
                timeStart: timeProgress,
                timeEnd: musicLength,
            },
            styleConfig: {
                artistStyle: {
                    textColor: '#696969'
                },
                trackStyle: {
                    textColor: color || '#FF7A00'
                },
                progressBarStyle: {
                    barColor: color || '#FF7A00'
                },
            },
            progressBar: init ? 0 : percProgress,
            volume: 0,
            backgroundColor: '#070707'
        })
/*
            progressBarColor: colorBright,
            timeColor: color || '#FF7A00',
*/
        return musicard;
    } catch (error) {
        console.warn('[music] No se pudo renderizar la tarjeta de música:', error.message || error);
        return null;
    }
}

// Export the function for use in other modules
module.exports = {
    updateMusicard
};