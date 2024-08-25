//

const goodbyeChannel = '1276696361747615806';

module.exports = async (member) => {
    const { guild } = member;
    const channel = await guild.channels.fetch(goodbyeChannel);
    if (channel) {
        await channel.send(`Ay no..., ${member.user.username} nos hizo la abandonacion.`);
    }
}