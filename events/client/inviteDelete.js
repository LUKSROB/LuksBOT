// Event handler for invite deletion

// Import necessary modules
const { EmbedBuilder } = require('discord.js');
const { updateCache } = require('../../utils/functions/invites');
const { getGuildSettings } = require('../../db/guild');
const { COLORS } = require('../../config.json');

// Export the invite delete event handler
module.exports = async (invite) => {

    updateCache(invite.client);

    if (!invite.guild) {
        return;
    }

    const settings = await getGuildSettings(invite.guild.id);
    if (!settings.invitesChannelId) {
        return;
    }

    const channel = await invite.guild.channels.fetch(settings.invitesChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(COLORS.DANGER)
        .setTitle('🗑️ Invitación eliminada')
        .addFields(
            { name: 'Código', value: `\`${invite.code}\``, inline: true },
            { name: 'Creada por', value: invite.inviter ? `${invite.inviter}` : 'Desconocido', inline: true }
        )
        .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => null);

};
