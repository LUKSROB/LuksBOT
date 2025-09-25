// Event handler for track start event

// Import necessary modules
const { AttachmentBuilder } = require("discord.js");
const { updateMusicard } = require("../../utils/canvas/updateMusicard");
const { PALETTE_RAPIDAPI } = require("../../config.json")

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

    const options = {
        method: 'POST',
        headers: {
            'x-rapidapi-key': PALETTE_RAPIDAPI.rapidapi_key,
            'x-rapidapi-host': 'color-detection-from-image.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            imageUrl: track.rawData.info.artworkUrl
        })
    };

    const { url } = PALETTE_RAPIDAPI;
    let color = "#"
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        color += result?.accentColor || 'FF7A00';
    } catch (error) {
        console.error(error);
    }

    const channel = client?.channels?.cache?.get(player.textChannel);

    const musicard = await updateMusicard(track, player, true, color);

    client.user.setActivity({
        name: track.info.title,
        type: 1,
        status: 'online'
    });

    let musicardMessage = null

    if (musicard) {
        const attachment = new AttachmentBuilder(musicard, { name: 'musicard.png' });
        musicardMessage = await channel.send({ files: [attachment], components: [buttons] });
    }

    player.musicInterval = setInterval(async () => {
        try {
            const updatedMusicard = await updateMusicard(track, player, false, color);
            if (updatedMusicard) {
                const updatedAttachment = new AttachmentBuilder(updatedMusicard, { name: 'musicard.png' });
                await musicardMessage.edit({ files: [updatedAttachment] });
            }
        } catch (error) {
            console.error('Error updating music card:', error);
        }

    }, 7000);

};