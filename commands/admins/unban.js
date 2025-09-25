// Command unban: Unbans a user from the server

// Import necessary modules
const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, DiscordAPIError } = require('discord.js');
const { COLORS } = require('../../../config.json');

// Export the unban command module
module.exports = {
    // Define the command structure
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
    // Execute the command
    execute: async (interaction) => {
        const user = interaction.options.getUser('user');
        
        try {
            const reason = interaction.options.getString('reason') || 'No se especifica la razón del desbaneo';

            await interaction.guild.bans.remove(user.id);
            
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${interaction.user.username} acaba de desbanear a un usuario`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true})
                })
                .setTitle(`Usuario desbaneado`)
                .setDescription(`
                    **Usuario:** ${user.tag}\n
                    **ID:** ${user.id}\n
                    **Razón:** ${reason}\n
                `)
                .setColor(COLORS.SUCCESS);

            interaction
                .reply({ embeds : [embed] })
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
