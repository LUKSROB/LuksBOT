// Command load-users: Load all server users into the database

// Import necessary modules
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { loadGuildUsers } = require('../../db/userHelper');
const { COLORS } = require('../../config.json');

// Export the load-users command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('load-users')
        .setDescription('Carga todos los usuarios del servidor en la base de datos')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addBooleanOption((option) =>
            option
                .setName('include-bots')
                .setDescription('También incluye bots en la carga')
                .setRequired(false)
        ),
    // Execute the command when invoked
    execute: async (interaction) => {
        const includeBots = interaction.options.getBoolean('include-bots') ?? false;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const result = await loadGuildUsers(interaction.guild, { includeBots });

            const embed = new EmbedBuilder()
                .setTitle('Usuarios sincronizados')
                .setDescription(`Se procesaron ${result.total} usuarios del servidor.`)
                .addFields(
                    { name: 'Nuevos', value: String(result.created), inline: true },
                    { name: 'Actualizados', value: String(result.updated), inline: true },
                    { name: 'Bots incluidos', value: includeBots ? 'Sí' : 'No', inline: true }
                )
                .setColor(COLORS.SUCCESS || 0x2ecc71)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error cargando usuarios del servidor:', error);
            await interaction.editReply({
                content: 'Ocurrió un error al cargar los usuarios del servidor.'
            });
        }
    }
};
