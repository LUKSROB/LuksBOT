// Function to generate and update a music card image for the currently playing track

// Import necessary modules
const { Bloom } = require("musicard");
const { convertTime, musicProgress } = require("../../utils/functions/convertTime");
const { COLORS } = require("../../config.json");

function normalizeAlbumArtUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
        return null;
    }

    let url = rawUrl.trim();

    if (url.startsWith('//')) {
        url = `https:${url}`;
    }

    if (url.includes('ytimg.com/vi_webp/')) {
        url = url.replace('/vi_webp/', '/vi/').replace('.webp', '.jpg');
    }

    if (!/^https?:\/\//i.test(url)) {
        return null;
    }

    return url;
}

// Function to create or update the music card
async function updateMusicard(track, player, init = false, color) {

    const albumArt = normalizeAlbumArtUrl(track?.info?.thumbnail);

    if (!albumArt) {
        return null;
    }

    try {
        const musicLength = convertTime(track.info.length);
        const timeProgress = convertTime(player.position);
        const percProgress = musicProgress(player.position, track.info.length);

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
            progressBar: init ? 0 : percProgress,
            volume: 0,
            backgroundColor: COLORS.BKMUSIC
        })
        
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