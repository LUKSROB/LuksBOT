const { EmbedBuilder } = require('discord.js');

module.exports = {
    description: 'Display the avatar of a user',
    run: async (message) => {
        const target = message.mentions.users.first() || message.author;
        const member = await message.guild.members.fetch(target.id);

        if (!member) return message.reply('User not ');
        
        const avatar = member.user.displayAvatarURL({ size: 512 });
        const embed = new EmbedBuilder()
            .setTitle(`@${member.user.displayName}'s avatar`)
            .setImage(avatar)
            .setColor('#335577')

        message.reply({ embeds : [embed] });
    }
}