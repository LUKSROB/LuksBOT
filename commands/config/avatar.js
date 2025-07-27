// Command avatar: Displays the avatar of a user

// Import necessary modules
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

// Export the avatar command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Display the avatar of a user')
        .addUserOption(option => 
            option.setName('user')
                  .setDescription('User to display the avatar')
        ),
    // Execute the command
    execute: async (interaction) => {
        const { user, guild } = interaction;
        const image = { size: 512, dynamic: true };
        const target = interaction.options.getUser('user') || user;

        const member = await guild.members.fetch(target.id);

        const avatar = member.avatarURL(image) || member.user.avatarURL(image);

        if (!avatar) return interaction.reply('This user not have an avatar');
        
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `Requested by ${user.username}`,
                iconURL: user.avatarURL()
            })
            .setTitle(`@${member.user.globalName}'s avatar`)
            .setColor('#335577')
            .setImage(avatar)

        interaction
            .reply({ embeds : [embed] })
            .catch(console.error);
    }
}