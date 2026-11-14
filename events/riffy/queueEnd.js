// Event handler for queue end event

// Import necessary modules
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { destroy } = require('../../utils/functions/music');
const updateMusicard = require('../../utils/canvas/updateMusicard');
const { COLORS } = require('../../config.json');

// Export the queue end event handler
module.exports = async (player, client) => {

    client.activityManager?.clearMusic(player.guildId);

    const channel = client?.channels?.cache?.get(player.textChannel);
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle('Lista de reproducción vacía')
        .setDescription('No hay más canciones en la cola.')

    clearInterval(player.IntervalMusicCard);
    player._musicardState = null;

    if (player.message) {
        const currentTrack = player.current || player.previous;
        if (currentTrack) {
            const finalMusicard = await updateMusicard(currentTrack, player, false, null, {
                forceComplete: true
            });

            if (finalMusicard) {
                const finalAttachment = new AttachmentBuilder(finalMusicard, { name: 'musicard.png' });
                await player.message.edit({ files: [finalAttachment], components: [] }).catch(() => null);
            }
        }

        await player.message.edit({ components: [] }).catch((e) => {
            console.log("No pude editar el mensaje anterior.", e);
        });
    }

    setTimeout(async () => {
        if (player.playing === false) {
            await destroy(player, channel, embed);
        }
        
    }, 10000, player);

};