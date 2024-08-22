// Join member to guild

const { EmbedBuilder } = require("@discordjs/builders");
const welcomeImage = require('../utils/canvas/welcomeImage');

module.exports = async (member) => {
    const { client } = member;
    const channelWelcome = '1275997705302446080';
    const channel = await client.channels.fetch(channelWelcome);

    const buffer = await welcomeImage(member);
    const attachment = new MessageAttachment(
        buffer, 
        {
            name: 'welcome-image.png'
        }
    );

    const embed = new EmbedBuilder()
        .setTitle(`Welcome to the server, ${member.user.displayname}!`)
        .setColor('GREEN')
        .setDescription(`Welcome to the server, ${member}!`)
        .setImage('attachment://welcome-image.png')
        
    channel.send({
        content: `<@${member.user.id}>`,
        embeds: [embed],
        files: [attachment]
    });
}