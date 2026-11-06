const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { COLORS } = require('../../config');
// Command support-panel: Publishes the support panel for creating tickets

// Import necessary modules
const supportImage = require('../../utils/canvas/supportImage');

// Export the support-panel command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('support-panel')
        .setDescription('Publica el panel de soporte para crear tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // Execute the command when invoked
    execute: async (interaction) => {
        const imageBuffer = await supportImage();
        const file = new AttachmentBuilder(imageBuffer, { name: 'support.png' });

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🆘 Centro de soporte')
            .setDescription('Selecciona una categoría para abrir un ticket con el staff.')
            .setImage('attachment://support.png')
            .addFields({
                name: 'Categorías disponibles',
                value: [
                    '• Soporte general',
                    '• Reporte de bug',
                    '• Compras / Donaciones'
                ].join('\n')
            });

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('createTicket')
                .setPlaceholder('Elige el tipo de ticket')
                .addOptions(
                    { label: 'Soporte general', value: 'soporte', emoji: '💬' },
                    { label: 'Reporte de bug', value: 'bug', emoji: '🐞' },
                    { label: 'Compras / Donaciones', value: 'compras', emoji: '💳' }
                )
        );

        await interaction.channel.send({
            embeds: [embed],
            components: [row],
            files: [file]
        });

        await interaction.reply({ content: 'Panel de soporte publicado.', ephemeral: true });
    }
};