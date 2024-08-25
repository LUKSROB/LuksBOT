// Join member to guild

const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const welcomeImage = require('../utils/canvas/welcomeImage');
const invites = require('../utils/functions/invites');
const messages = require('../utils/functions/messages');

module.exports = async (member) => {
    const { client } = member;
    const channelWelcome = '1275997705302446080';
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
        .setTitle(`Welcome to the server, ${member.user.username}!`)
        .setDescription(`We are glad to have you here!`)
        .setImage('attachment://welcome-image.png')
    
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