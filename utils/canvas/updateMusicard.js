// Create and update a music card image for the currently playing track

// Import necessary modules
const { Bloom } = require("musicard");
const { convertTime, musicProgress } = require("../../utils/functions/convertTime");
const { normalizeAlbumArtUrl } = require("../../utils/functions/messages");
const { COLORS } = require("../../config.json");

// Function to create or update the music card
module.exports = async (track, player, init = false, color, options = {}) => {

    const albumArt = normalizeAlbumArtUrl(track?.info?.thumbnail);

    if (!albumArt) {
        return null;
    }

    try {
        const trackLength = Number(track?.info?.length) || 0;
        const safeDuration = trackLength > 0 ? trackLength : 1;
        const forcedPosition = typeof options.forcePositionMs === 'number' ? options.forcePositionMs : null;
        const sourcePosition = forcedPosition ?? Number(player?.position ?? 0);
        const clampedPosition = Math.min(Math.max(sourcePosition, 0), safeDuration);
        const finalPosition = options.forceComplete ? safeDuration : clampedPosition;

        const musicLength = convertTime(safeDuration);
        const timeProgress = convertTime(finalPosition);
        const percProgress = options.forceComplete
            ? 100
            : musicProgress(finalPosition, safeDuration);

        const musicard = await Bloom({
            trackName: track.info.title,
            artistName: track.info.author,
            albumArt: albumArt,
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
                timeStyle: {
                    textColor: color || COLORS.MUSIC
                },
                progressBarStyle: {
                    barColor: color || COLORS.MUSIC
                },
            },
            progressBar: init ? 0 : Math.max(0, Math.min(100, percProgress)),
            volume: 0,
            backgroundColor: COLORS.BKMUSIC
        })
        
        return musicard;

    } catch (error) {
        console.warn('[music] No se pudo renderizar la tarjeta de música:', error.message || error);
        return null;
    }

}