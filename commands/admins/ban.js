// Command ban: Bans a user from the server

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Export the ban command module
module.exports = {
    // Define the command structure
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
                .setDescription('Duración del baneo (en días)')
                .setRequired(false)
                .setChoices(
                    { name: '1 Hora', value: '3600' },
                    { name: '1 día', value: '86400' },
                    { name: '3 días', value: '259200' },
                    { name: '5 días', value: '432000' },
                    { name: '7 días', value: '604800' })
        ),
    // Execute the command
    execute: async (interaction) => {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No se especifica la razón del baneo';
        const duration = interaction.options.getString('duration');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        if (user.id === interaction.client.user.id) {
            return interaction.reply({ content: 'No puedo banearme a mí mismo.', flags: 64 });
        }

        if (member && member.id == interaction.user.id) {
            return interaction.reply({ content: 'No puedes banearte a ti mismo.', flags: 64 });
        }

        if (member && member.id == interaction.guild.ownerId) {
            return interaction.reply({ content: 'No puedes banear al propietario del servidor.', flags: 64 });
        }

        try {
            let userDMerror = '';
            let time = '';
            if (duration == '3600') {
                time = duration / 60 / 60 + ' hora';
            } else if (duration == '86400') {
                time = duration / 60 / 24 + ' día';
            } else {
                time = duration / 60 / 24 + ' días';
            }

            try {
                const userDM = new EmbedBuilder()
                    .setTitle(`Has sido baneado de ${interaction.guild.name}`)
                    .setDescription(`
                        **Razón:** ${reason}\n
                        **Duración:** ${duration ? time : 'Permanentemente'}
                    `)
                    .setColor('#FF0000')
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
                    **Duración:** ${duration ? time : 'Permanentemente'}
                    ${userDMerror ? `\n${userDMerror}` : ''}
                `)
                .setColor('#FF0000');

            interaction
                .reply({ embeds : [embed] })
                .catch(console.error);

            if (duration) {
                setTimeout(() => {
                    try {
                        interaction.guild.members.unban(user.id)

                        const embed = new EmbedBuilder()
                                .setTitle(`Usuario desbaneado`)
                                .setDescription(`
                                    **Usuario:** ${user.tag}\n
                                    **ID:** ${user.id}\n
                                    **Razón:** ${reason}\n
                                `)
                                .setColor('#00FF00');

                        interaction.channel.send({ embeds : [embed] })
                    } catch (err) {
                        console.error();
                    }
                }, duration * 1000);
            }

        } catch (error) {
            console.error('Error al banear al usuario:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Ocurrió un error al intentar banear al usuario.', flags: 64 });
            } else {
                await interaction.followUp({ content: 'Ocurrió un error al intentar banear al usuario.', flags: 64 }).catch(() => {});
            };
        }
    }
};
