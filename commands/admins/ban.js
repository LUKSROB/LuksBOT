// Command ban: Ban a user from the server

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { COLORS } = require('../../config.json');
const { createBanRecord } = require('../../db/guild');
const { formatDuration } = require('../../utils/functions/convertTime');

// Export the ban command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea un usuario del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Usuario a banear')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Razón del baneo')
                .setRequired(false)
                .setMaxLength(250)
        )
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Duración del baneo (opcional, si se omite es permanente)')
                .setRequired(false)
                .setChoices(
                    { name: '10 minutos', value: '600' },
                    { name: '30 minutos', value: '1800' },
                    { name: '1 hora', value: '3600' },
                    { name: '6 horas', value: '21600' },
                    { name: '12 horas', value: '43200' },
                    { name: '1 día', value: '86400' },
                    { name: '3 días', value: '259200' },
                    { name: '5 días', value: '432000' },
                    { name: '7 días', value: '604800' },
                    { name: '14 días', value: '1209600' },
                    { name: '30 días', value: '2592000' })
        ),
    // Execute the command when invoked
    execute: async (interaction) => {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No se especifica la razón del baneo';
        const duration = interaction.options.getString('duration');
        const durationSeconds = duration ? Number(duration) : null;
        const durationLabel = formatDuration(durationSeconds);
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        if (user.id === interaction.client.user.id) {
            return interaction.reply({ content: 'No puedo banearme a mí mismo.', flags: MessageFlags.Ephemeral });
        }

        if (member && member.id == interaction.user.id) {
            return interaction.reply({ content: 'No puedes banearte a ti mismo.', flags: MessageFlags.Ephemeral });
        }

        if (member && member.id == interaction.guild.ownerId) {
            return interaction.reply({ content: 'No puedes banear al propietario del servidor.', flags: MessageFlags.Ephemeral });
        }

        try {
            let userDMerror = '';

            try {
                const userDM = new EmbedBuilder()
                    .setTitle(`Has sido baneado de ${interaction.guild.name}`)
                    .setDescription(`
                        **Razón:** ${reason}\n
                        **Duración:** ${durationLabel}
                    `)
                    .setColor(COLORS.DANGER)
                    .setFooter({ text: 'Si crees que esto es un error, contacta con un administrador.' });

                await user.send({ embeds: [userDM] });
            } catch (err) {
                userDMerror = 'No se pudo enviar el mensaje de su baneo';
            }

            if (member) {
                await member.ban({ reason });
            } else {
                await interaction.guild.bans.create(user.id, { reason });
            }

            let storageError = false;

            try {
                await createBanRecord(interaction.guildId, {
                    guildName: interaction.guild.name,
                    channelId: interaction.channelId,
                    userId: user.id,
                    userTag: user.tag,
                    moderatorId: interaction.user.id,
                    moderatorTag: interaction.user.tag,
                    reason,
                    durationSeconds
                });
            } catch (dbError) {
                storageError = true;
                console.error('[ban] No se pudo guardar el registro del baneo:', dbError);
            }

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${interaction.user.username} acaba de banear a un usuario`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true})
                })
                .setTitle(`Usuario baneado`)
                .setDescription(`
                    **Usuario:** ${user.tag}\n
                    **ID:** ${user.id}\n
                    **Razón:** ${reason}\n
                    **Duración:** ${durationLabel}
                    ${storageError ? '\n⚠️ No se pudo guardar el registro del baneo; el desbaneo automático podría no ejecutarse.' : ''}
                    ${userDMerror ? `\n${userDMerror}` : ''}
                `)
                .setColor(COLORS.DANGER);

            interaction
                .reply({ embeds : [embed] })
                .catch(console.error);

            // Respaldo en memoria si la base de datos falló y el baneo es temporal
            if (durationSeconds && storageError) {
                setTimeout(() => {
                    interaction.guild.bans.remove(user.id, 'Desbaneo automático (respaldo)')
                        .catch(() => {});
                }, durationSeconds * 1000);
            }

        } catch (error) {
            console.error('Error al banear al usuario:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Ocurrió un error al intentar banear al usuario.', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.followUp({ content: 'Ocurrió un error al intentar banear al usuario.', flags: MessageFlags.Ephemeral }).catch(() => {});
            };
        }
    }
};
