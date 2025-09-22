// Event handler for track start event

// Import necessary modules
const { AttachmentBuilder } = require("discord.js");
const { updateMusicard } = require("../../utils/functions/updateMusicard");

// Export the track start event handler
module.exports = async (player, track, payload, client) => {

    const channel = client?.channels?.cache?.get(player.textChannel);
    
    const musicard = await updateMusicard(track, player);

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
        const updatedMusicard = await updateMusicard(track, player);
        if (updatedMusicard) {
            const updatedAttachment = new AttachmentBuilder(updatedMusicard, { name: 'musicard.png' });
            await musicardMessage.edit({ files: [updatedAttachment] });
        }
    }, 1000);
    
};