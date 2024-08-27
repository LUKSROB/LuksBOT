const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { execute } = require('./random');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Display the avatar of a user')
        .addUserOption(option => 
            option.setName('user')
                  .setDescription('User to display the avatar')
        ),

    execute: async (interaction) => {
        const { user, client, guild } = interaction;
        const image = { size: 512, dynamic: true };
        const target = interaction.options.getUser('user') || user;

        const member = await guild.members.fetch(target.id);

        const avatar = member.avatarURL(image) || member.user.avatarURL(image);

        if (!avatar) return interaction.reply('This user not have an avatar');

        console.log(member.user);
        
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `Requested by ${user.username}`,
                iconURL: user.avatarURL()
            })
            .setTitle(`@${member.user.globalName}'s avatar`)
            .setColor('#335577')
            .setImage(avatar)
            .setFooter({
                text: client.user.username,
                iconURL: client.user.avatarURL()
            })

        interaction
            .reply({ embeds : [embed] })
            .catch(console.error);
    }
}