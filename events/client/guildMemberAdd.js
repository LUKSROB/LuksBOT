// Event handler for new guild member joining

// Import necessary modules
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { WELCOME_CHANNEL } = require('../../config.json');
const welcomeImage = require('../../utils/canvas/welcomeImage');
const invites = require('../../utils/functions/invites');
const messages = require('../../utils/functions/messages');
const { COLORS } = require('../../config.json');

// Export the guildMemberAdd event handler
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
        .setColor(COLORS.WELCOMEIMG);

    if (usedInvite && usedInvite.inviter) {
        embed.setFooter({
            text: `Invited by ${usedInvite.inviter.username}`,
            iconURL: usedInvite.inviter.displayAvatarURL({ dynamic: true })
        })
    }

    await getUser(member);

    channel.send({
        content: `<@${member.id}>`,
        embeds: [embed],
        files: [attachment]
    });

    await invites.updateCache(member.client);
    
}