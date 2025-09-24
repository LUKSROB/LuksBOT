// Event handler for track start event

// Import necessary modules
const { AttachmentBuilder } = require("discord.js");
const { updateMusicard } = require("../../utils/canvas/updateMusicard");

// Export the track start event handler
module.exports = async (player, track, payload, client) => {

    const channel = client?.channels?.cache?.get(player.textChannel);
    
    const musicard = await updateMusicard(track, player, true);

    client.user.setActivity({
        name: track.info.title,
        type: 1,
        status: 'online'
    });

    let musicardMessage = null

    if (musicard) {
        const attachment = new AttachmentBuilder(musicard, { name: 'musicard.png' });
        musicardMessage = await channel.send({ files: [attachment] });
    }

    player.musicInterval = setInterval(async () => {
        try {
            const updatedMusicard = await updateMusicard(track, player);
            if (updatedMusicard) {
                const updatedAttachment = new AttachmentBuilder(updatedMusicard, { name: 'musicard.png' });
                await musicardMessage.edit({ files: [updatedAttachment] });
            }
        } catch (error) {
            console.error('Error updating music card:', error);
        }

    }, 5000);

};