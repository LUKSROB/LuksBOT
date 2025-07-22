const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
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
                    { name: '1 día', value: '86400' },
                    { name: '3 días', value: '259200' },
                    { name: '5 días', value: '432000' },
                    { name: '7 días', value: '604800' })
        ),
    execute: async (interaction) => {
        const user = interaction.options.getUser('user');
        
        try {
            const member = await interaction.guild.members.fetch(user.id);
            const reason = interaction.options.getString('reason') || 'No se especifica la razón del baneo';
            const duration = interaction.options.getString('duration') || 0;
            
            if (member.id == interaction.user.id) {
                return interaction.reply({ content: 'No puedes banearte a ti mismo.', ephemeral: true });
            }

            if (member.id == interaction.guild.ownerId) {
                return interaction.reply({ content: 'No puedes banear al propietario del servidor.', ephemeral: true });
            }

            await member.ban({ reason, deleteMessageSeconds: duration });

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
                    **Duración:** ${duration} días
                `)
                .setColor('#FF0000');

            interaction
                .reply({ embeds : [embed] })
                .catch(console.error);
       
        } catch (error) {
            console.error('Error al banear al usuario:', error);
            await interaction.reply({ content: 'Ocurrió un error al intentar banear al usuario.', ephemeral: true });
        }
    }
};
