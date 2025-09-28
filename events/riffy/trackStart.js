// Event handler for track start event

// Import necessary modules
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { updateMusicard } = require("../../utils/canvas/updateMusicard");
const { getDominantColor, rgbToHex, isDarkHex, brightnessHex } = require("../../utils/functions/colors");

// Export the track start event handler
module.exports = async (player, track, payload, client) => {

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

    const { r, g, b } = await getDominantColor(track.info.thumbnail);
    let color = rgbToHex(r, g, b);
    const isDark = isDarkHex(color);
    color = isDark ? brightnessHex(color, 1.7) : color;

    const channel = client?.channels?.cache?.get(player.textChannel);
    const musicard = await updateMusicard(track, player, true, color);

    client.user.setActivity({
        name: track.info.title,
        type: 1,
        status: 'online'
    });

    if (musicard) {
        const attachment = new AttachmentBuilder(musicard, { name: 'musicard.png' });
        if (player.message) {
            player.message.edit({ files: [attachment] });
        } else {
            const message = await channel.send({ files: [attachment], components: [buttons] });
            player.message = message;
        }
    }

    player.musicInterval = setInterval(async () => {
        try {
            const updatedMusicard = await updateMusicard(track, player, false, color);
            if (updatedMusicard) {
                const updatedAttachment = new AttachmentBuilder(updatedMusicard, { name: 'musicard.png' });
                await player.message.edit({ files: [updatedAttachment] });
            }
        } catch (error) {
            console.error('Error updating music card:', error);
        }

    }, 7000);

};