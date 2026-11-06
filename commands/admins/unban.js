// Command unban: Unbans a user from the server

// Import necessary modules
const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, DiscordAPIError, MessageFlags } = require('discord.js');
const { COLORS } = require('../../config.json');
const { markActiveBansAsUnbanned } = require('../../db/guild');

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

            await interaction.guild.bans.remove(user.id, reason);

            await markActiveBansAsUnbanned(interaction.guildId, user.id, {
                unbanType: 'manual',
                unbannedById: interaction.user.id,
                unbannedByTag: interaction.user.tag,
                unbanReason: reason
            }).catch((dbError) => {
                console.error('[unban] No se pudo actualizar el registro del baneo:', dbError);
            });

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
                await markActiveBansAsUnbanned(interaction.guildId, user.id, {
                    unbanType: 'external',
                    unbanReason: 'El usuario ya no estaba baneado en Discord',
                    unbannedByTag: 'Fuera del bot / Discord'
                }).catch((dbError) => {
                    console.error('[unban] No se pudo actualizar el registro del baneo:', dbError);
                });

                return interaction.reply({ content: 'El usuario no está baneado.', flags: MessageFlags.Ephemeral });
            }

            console.error('Error al desbanear al usuario:', error);

            return interaction.reply({
                content: 'Ocurrió un error al intentar desbanear al usuario.',
                flags: MessageFlags.Ephemeral
            }).catch(() => {});
        }
    }
};
