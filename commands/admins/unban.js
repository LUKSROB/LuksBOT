const { SlashCommandBuilder, PermissionFlagsBits, DiscordAPIError } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Desbanea un usuario del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Usuario a desbanear')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Razón del desbaneo')
                .setRequired(false)
                .setMaxLength(250)
        ),
    execute: async (interaction) => {
        const user = interaction.options.getUser('user');
        
        try {

            await interaction.guild.bans.remove(user.id);
            const reason = interaction.options.getString('reason')
            
            interaction
                .reply(`Se desbaneó a ${user.tag} por: ${reason || 'No se especificó razón'}`)
                .catch(console.error);
       
        } catch (error) {
            if (error instanceof DiscordAPIError && error.code === 10026) {
                return interaction.reply({ content: 'El usuario no está baneado.', ephemeral: true });
            } else {
                console.error('Error al desbanear al usuario:', error);
            }
        }
    }
};
