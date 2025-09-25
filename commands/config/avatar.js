// Command avatar: Displays the avatar of a user

// Import necessary modules
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { COLORS } = require('../../config.json');

// Export the avatar command module
module.exports = {
    // Define the command structure
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Muestra el avatar de un usuario')
        .addUserOption(option => 
            option.setName('user')
                  .setDescription('Usuario del que mostrar el avatar')
        ),
    // Execute the command
    execute: async (interaction) => {
        const { user, guild } = interaction;
        const image = { size: 512, dynamic: true };
        const target = interaction.options.getUser('user') || user;

        const member = await guild.members.fetch(target.id);

        const avatar = member.avatarURL(image) || member.user.avatarURL(image);

        if (!avatar) return interaction.reply('Este usuario no tiene un avatar');

        const embed = new EmbedBuilder()
            .setAuthor({
                name: `Solicitado por ${user.username}`,
                iconURL: user.avatarURL()
            })
            .setTitle(`Avatar de @${member.user.globalName}`)
            .setColor(COLORS.PRIMARY)
            .setImage(avatar)

        interaction
            .reply({ embeds : [embed] })
            .catch(console.error);
    }
}