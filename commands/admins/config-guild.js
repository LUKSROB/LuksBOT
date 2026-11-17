// Command config-guild: configure per-guild channels and roles from Discord itself

// Import necessary modules
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType,
    EmbedBuilder
} = require('discord.js');
const {
    getGuildSettings,
    updateGuildSettings,
    clearGuildSetting
} = require('../../db/guild');
const { COLORS = {} } = require('../../config.json');

// Map of configurable channels: subcommand value -> setting key + validation
const CHANNEL_SETTINGS = {
    bienvenidas: { key: 'welcomeChannelId', label: 'Canal de bienvenidas', kind: 'text' },
    despedidas: { key: 'goodbyeChannelId', label: 'Canal de despedidas', kind: 'text' },
    invitaciones: { key: 'invitesChannelId', label: 'Canal de invitaciones', kind: 'text' },
    mensajes: { key: 'messagesChannelId', label: 'Canal de mensajes', kind: 'text' },
    cumpleanos: { key: 'birthdayChannelId', label: 'Canal de cumpleaños', kind: 'text' },
    tickets: { key: 'ticketChannelId', label: 'Categoría de tickets', kind: 'category' },
    'logs-tickets': { key: 'ticketLogChannelId', label: 'Canal de logs de tickets', kind: 'text' }
};

// Map of configurable roles
const ROLE_SETTINGS = {
    moderacion: { key: 'modRoleId', label: 'Rol de moderación' },
    cumpleanos: { key: 'birthdayRoleId', label: 'Rol de cumpleaños' }
};

// Human labels for every setting key
const SETTING_LABELS = {
    welcomeChannelId: 'Canal de bienvenidas',
    goodbyeChannelId: 'Canal de despedidas',
    invitesChannelId: 'Canal de invitaciones',
    messagesChannelId: 'Canal de mensajes',
    birthdayChannelId: 'Canal de cumpleaños',
    birthdayRoleId: 'Rol de cumpleaños',
    ticketChannelId: 'Categoría de tickets',
    ticketLogChannelId: 'Canal de logs de tickets',
    modRoleId: 'Rol de moderación'
};

const CHANNEL_CHOICES = Object.entries(CHANNEL_SETTINGS).map(([value, meta]) => ({
    name: meta.label,
    value
}));

const ROLE_CHOICES = Object.entries(ROLE_SETTINGS).map(([value, meta]) => ({
    name: meta.label,
    value
}));

const CLEAR_CHOICES = Object.keys(SETTING_LABELS).map((key) => ({
    name: SETTING_LABELS[key],
    value: key
}));

function formatChannel(channelId) {
    return channelId ? `<#${channelId}>` : '`No configurado`';
}

function formatRole(roleId) {
    return roleId ? `<@&${roleId}>` : '`No configurado`';
}

function buildOverviewEmbed(settings) {
    return new EmbedBuilder()
        .setTitle('⚙️ Configuración del servidor')
        .setDescription('Estos valores se guardan en la base de datos del bot y reemplazan a `config.json`.')
        .setColor(COLORS.PRIMARY || '#0070C9')
        .addFields(
            { name: '👋 Bienvenidas', value: formatChannel(settings.welcomeChannelId), inline: true },
            { name: '🚪 Despedidas', value: formatChannel(settings.goodbyeChannelId), inline: true },
            { name: '📨 Invitaciones', value: formatChannel(settings.invitesChannelId), inline: true },
            { name: '💬 Mensajes', value: formatChannel(settings.messagesChannelId), inline: true },
            { name: '🎂 Cumpleaños', value: formatChannel(settings.birthdayChannelId), inline: true },
            { name: '🎭 Rol de cumpleaños', value: formatRole(settings.birthdayRoleId), inline: true },
            { name: '🎫 Categoría de tickets', value: formatChannel(settings.ticketChannelId), inline: true },
            { name: '🧾 Logs de tickets', value: formatChannel(settings.ticketLogChannelId), inline: true },
            { name: '🛡️ Rol de moderación', value: formatRole(settings.modRoleId), inline: true }
        )
        .setFooter({ text: 'Usa /config-guild canal o /config-guild rol para cambiar un valor.' })
        .setTimestamp();
}

// Export the config-guild command module
module.exports = {
    // Define the command data and execution logic
    data: new SlashCommandBuilder()
        .setName('config-guild')
        .setDescription('Configura canales y roles de este servidor (sin config.json)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((sub) =>
            sub
                .setName('ver')
                .setDescription('Muestra la configuración actual del servidor')
        )
        .addSubcommand((sub) =>
            sub
                .setName('canal')
                .setDescription('Configura un canal del servidor')
                .addStringOption((opt) =>
                    opt
                        .setName('tipo')
                        .setDescription('Qué canal configurar')
                        .setRequired(true)
                        .addChoices(...CHANNEL_CHOICES)
                )
                .addChannelOption((opt) =>
                    opt
                        .setName('canal')
                        .setDescription('Canal o categoría a usar')
                        .addChannelTypes(
                            ChannelType.GuildText,
                            ChannelType.GuildAnnouncement,
                            ChannelType.GuildCategory
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName('rol')
                .setDescription('Configura un rol del servidor')
                .addStringOption((opt) =>
                    opt
                        .setName('tipo')
                        .setDescription('Qué rol configurar')
                        .setRequired(true)
                        .addChoices(...ROLE_CHOICES)
                )
                .addRoleOption((opt) =>
                    opt
                        .setName('rol')
                        .setDescription('Rol a usar')
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName('quitar')
                .setDescription('Quita un canal o rol de la configuración')
                .addStringOption((opt) =>
                    opt
                        .setName('ajuste')
                        .setDescription('Qué ajuste quitar')
                        .setRequired(true)
                        .addChoices(...CLEAR_CHOICES)
                )
        ),

    // Execute the command when invoked
    execute: async (interaction) => {
        if (!interaction.guildId) {
            return interaction.reply({
                content: 'Este comando solo funciona dentro de un servidor.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'ver') {
                const settings = await getGuildSettings(guildId);
                return interaction.editReply({ embeds: [buildOverviewEmbed(settings)] });
            }

            if (subcommand === 'canal') {
                const type = interaction.options.getString('tipo');
                const channel = interaction.options.getChannel('canal');
                const meta = CHANNEL_SETTINGS[type];

                if (!meta) {
                    return interaction.editReply({ content: '❌ Tipo de canal inválido.' });
                }

                if (meta.kind === 'category' && channel.type !== ChannelType.GuildCategory) {
                    return interaction.editReply({
                        content: `❌ **${meta.label}** debe ser una **categoría**, no un canal.`
                    });
                }

                if (meta.kind === 'text' && typeof channel.isTextBased === 'function' && !channel.isTextBased()) {
                    return interaction.editReply({
                        content: `❌ **${meta.label}** debe ser un canal de texto.`
                    });
                }

                await updateGuildSettings(guildId, { [meta.key]: channel.id });

                return interaction.editReply({
                    content: `✅ **${meta.label}** configurado en ${channel}.`
                });
            }

            if (subcommand === 'rol') {
                const type = interaction.options.getString('tipo');
                const role = interaction.options.getRole('rol');
                const meta = ROLE_SETTINGS[type];

                if (!meta) {
                    return interaction.editReply({ content: '❌ Tipo de rol inválido.' });
                }

                await updateGuildSettings(guildId, { [meta.key]: role.id });

                return interaction.editReply({
                    content: `✅ **${meta.label}** configurado en ${role}.`
                });
            }

            if (subcommand === 'quitar') {
                const key = interaction.options.getString('ajuste');

                if (!SETTING_LABELS[key]) {
                    return interaction.editReply({ content: '❌ Ajuste inválido.' });
                }

                await clearGuildSetting(guildId, key);

                return interaction.editReply({
                    content: `🗑️ **${SETTING_LABELS[key]}** eliminado de la configuración.`
                });
            }
        } catch (error) {
            console.error('[config-guild] Error:', error);
            return interaction.editReply({
                content: `❌ Error al actualizar la configuración: ${error.message}`
            });
        }
    }
};
