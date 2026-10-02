// Function to generate and update a music card image for the currently playing track

// Import necessary modules
const { Bloom, initializeFonts, registerFont } = require("musicard");
const { convertTime, musicProgress } = require("../../utils/functions/convertTime");
const { brightnessHex } = require("../functions/colors");
const { COLORS } = require("../../config.json");

// Function to create or update the music card
async function updateMusicard(track, player, init = false, color) {

    initializeFonts();

    if (!track?.info?.thumbnail) {
        return null;
    }

    try {
        const musicLength = convertTime(track.info.length);
        const timeProgress = convertTime(player.position);
        const percProgress = musicProgress(player.position, track.info.length);
        const colorBright = brightnessHex(color || COLORS.MUSIC, 0.3);

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
                    textColor: COLORS.ARTMUSIC
                },
                trackStyle: {
                    textColor: color || COLORS.MUSIC
                },
                progressBarStyle: {
                    barColor: color || COLORS.MUSIC
                },
            },
            progressBar: init ? 0 : percProgress,
            volume: 0,
            backgroundColor: COLORS.BKMUSIC
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