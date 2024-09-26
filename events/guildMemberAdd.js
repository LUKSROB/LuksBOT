// Join member to guild

const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { WELCOME_CHANNEL } = require('../config.json');
const welcomeImage = require('../utils/canvas/welcomeImage');
const invites = require('../utils/functions/invites');
const messages = require('../utils/functions/messages');

module.exports = async (member) => {
    const { client } = member;
    const channelWelcome = WELCOME_CHANNEL;
    const channel = await client.channels.fetch(channelWelcome);

    const usedInvite = await invites.getLastUsed(member.guild);

    const buffer = await welcomeImage(member);
    const attachment = new AttachmentBuilder(
        buffer, 
        {
            name: 'welcome-image.png'
        }
    );

    const embed = new EmbedBuilder()
        .setTitle(messages.welcomeMessage(member))
        .setDescription(messages.descriptionMessage())
        .setImage('attachment://welcome-image.png')
        .setColor('#4B054F')
    
    if (usedInvite && usedInvite.inviter) {
        embed.setFooter({
            text: `Invited by ${usedInvite.inviter.username}`,
        })
    }

    channel.send({
        content: `<@${member.user.id}>`,
        embeds: [embed],
        files: [attachment]
    });
}