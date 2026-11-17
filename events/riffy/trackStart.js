// Event handler for track start event

// Import necessary modules
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const updateMusicard = require("../../utils/canvas/updateMusicard");
const { getDominantColor, rgbToHex, isVeryDarkHex, isDarkHex, brightnessHex } = require("../../utils/functions/colors");
const { downloadImage, cacheImageInPlayer } = require("../../utils/functions/imageDownload");
const { normalizeAlbumArtUrl } = require("../../utils/functions/messages");
const { COLORS } = require("../../config.json");

// Export the track start event handler
module.exports = async (player, track, payload, client) => {
    const RENDER_THRESHOLD_MS = 6000;
    const RENDER_INTERVAL_MS = 7000;
    const MAX_CONSECUTIVE_ERRORS = 3;

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('stop')
            .setStyle(4)
            .setEmoji(`⏹️`),
        new ButtonBuilder()
            .setCustomId('loop')
            .setStyle(2)
            .setEmoji('🔁'),
        new ButtonBuilder()
            .setCustomId('pause')
            .setStyle(2)
            .setEmoji('⏯️'),
        new ButtonBuilder()
            .setCustomId('skip')
            .setStyle(2)
            .setEmoji('⏭️'),
        new ButtonBuilder()
            .setCustomId('queue')
            .setStyle(2)
            .setEmoji('📃')
    )

    const dominantColor = await getDominantColor(track.info.thumbnail);
    let color = dominantColor ? rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b) : COLORS.MUSIC;
    const isDark = isDarkHex(color);
    const isVeryDark = isVeryDarkHex(color);
    color = isVeryDark ? brightnessHex(color, 6) : (isDark ? brightnessHex(color, 3) : color);

    const channel = client?.channels?.cache?.get(player.textChannel);
    
    const albumArtUrl = normalizeAlbumArtUrl(track?.info?.thumbnail);
    if (albumArtUrl) {
        const imageBuffer = await downloadImage(albumArtUrl);
        if (imageBuffer) {
            cacheImageInPlayer(player, albumArtUrl, imageBuffer, color);
        }
    }
    
    const musicard = await updateMusicard(track, player, true, color);

    client.activityManager?.setMusic(player.guildId, track);

    if (musicard) {
        const attachment = new AttachmentBuilder(musicard, { name: 'musicard.png' });
        if (player.message) {
            await player.message.edit({ files: [attachment], components: [buttons] });
        } else {
            const message = await channel.send({ files: [attachment], components: [buttons] });
            player.message = message;
        }
    } else {
        console.error('Error: Musicard not generated');
    }

    player._musicardState = {
        rendering: false,
        lastRenderedPosition: Number(player?.position ?? 0),
        consecutiveErrors: 0,
        loopActive: true
    };

    if (player.IntervalMusicCard) {
        clearInterval(player.IntervalMusicCard);
    }

    player.IntervalMusicCard = setInterval(async () => {
        const state = player._musicardState || {
            rendering: false,
            lastRenderedPosition: 0,
            consecutiveErrors: 0,
            loopActive: true
        };

        if (!state.loopActive) {
            return;
        }

        const currentPosition = Number(player?.position ?? 0);
        const delta = Math.abs(currentPosition - Number(state.lastRenderedPosition ?? 0));

        if (state.rendering || delta < RENDER_THRESHOLD_MS) {
            return;
        }

        state.rendering = true;
        player._musicardState = state;

        try {
            const updatedMusicard = await updateMusicard(track, player, false, color);
            if (updatedMusicard) {
                const updatedAttachment = new AttachmentBuilder(updatedMusicard, { name: 'musicard.png' });
                await player.message.edit({ files: [updatedAttachment] });
                state.lastRenderedPosition = currentPosition;
                state.consecutiveErrors = 0;
            }
        } catch (error) {
            state.consecutiveErrors++;
            console.error(`[MusicCard] Error updating (${state.consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error.message || error);
            
            if (state.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                console.warn(`[MusicCard] Loop detenido después de ${MAX_CONSECUTIVE_ERRORS} errores consecutivos`);
                state.loopActive = false;
            }
        } finally {
            state.rendering = false;
            player._musicardState = state;
        }

    }, RENDER_INTERVAL_MS);

};