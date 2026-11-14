// Event handler for new guild member joining

// Import necessary modules
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { WELCOME_CHANNEL } = require('../../config.json');
const welcomeImage = require('../../utils/canvas/welcomeImage');
const invites = require('../../utils/functions/invites');
const messages = require('../../utils/functions/messages');
const { getUser } = require('../../db/userHelper');
const { COLORS } = require('../../config.json');

// Export the guild member add event handler
module.exports = async (member) => {

    const { client } = member;
    const channelWelcome = WELCOME_CHANNEL;
    const channel = await client.channels.fetch(channelWelcome).catch(() => null);

    if (!channel || !channel.isTextBased()) {
        console.warn(`[guildMemberAdd] Canal de bienvenida inválido o no accesible: ${channelWelcome}`);
        return;
    }

    let usedInvite = null;
    try {
        usedInvite = await invites.getLastUsed(member.guild);
    } catch (error) {
        console.warn('[guildMemberAdd] No se pudo obtener la invitación usada:', error.message || error);
    }

    let attachment = null;
    try {
        const buffer = await welcomeImage(member);
        attachment = new AttachmentBuilder(
            buffer, 
            {
                name: 'welcome-image.png'
            }
        );
    } catch (error) {
        console.warn('[guildMemberAdd] No se pudo generar la imagen de bienvenida:', error.message || error);
    }

    const embed = new EmbedBuilder()
        .setTitle(messages.welcomeMessage(member))
        .setDescription(messages.descriptionMessage())
        .setColor(COLORS.WELCOME);
    
    if (attachment) {
        embed.setImage('attachment://welcome-image.png');
    }

    if (usedInvite && usedInvite.inviter) {
        embed.setFooter({
            text: `Invited by ${usedInvite.inviter.username}`,
            iconURL: usedInvite.inviter.displayAvatarURL({ dynamic: true })
        })
    }

    await getUser(
        member.id,
        member.user.username,
        member.guild.id,
        {
            nickname: member.nickname || null,
            isBot: member.user.bot,
            joinedAt: member.joinedAt,
            roles: member.roles.cache.map((role) => ({
                id: role.id,
                name: role.name
            }))
        }
    );

    await channel.send({
        content: `<@${member.id}>`,
        embeds: [embed],
        files: attachment ? [attachment] : []
    });

    await invites.updateCache(member.client).catch((error) => {
        console.warn('[guildMemberAdd] No se pudo actualizar el cache de invitaciones:', error.message || error);
    });
    
}