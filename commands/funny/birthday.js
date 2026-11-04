const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType
} = require('discord.js');
const {
    setBirthday,
    getBirthday,
    delBirthday,
    getUpcomingBirthdays,
    getBirthdaySettings,
    setBirthdayRole,
    clearBirthdayRole,
    setBirthdayChannel,
    clearBirthdayChannel
} = require('../../db/birthday');
const { COLORS } = require('../../config.json');
const { getMonths } = require('../../utils/functions/months');

function isValidBirthday(day, month, year) {
    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function formatBirthday(day, month, year) {
    return `${day} de ${getMonths(month)} de ${year}`;
}

async function ensureAdmin(interaction, errorMessage) {
    if (interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return true;
    }

    await interaction.reply({
        content: errorMessage,
        flags: MessageFlags.Ephemeral
    });

    return false;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Gestiona cumpleaños y configuración de cumpleaños en el servidor')
        .addSubcommand((option) =>
            option.setName('set')
                .setDescription('Establece tu fecha de cumpleaños')
                .addNumberOption((opt) =>
                    opt.setName('day')
                        .setDescription('Día del cumpleaños')
                        .setMinValue(1)
                        .setMaxValue(31)
                        .setRequired(true)
                )
                .addNumberOption((opt) =>
                    opt.setName('month')
                        .setDescription('Mes del cumpleaños')
                        .setMinValue(1)
                        .setMaxValue(12)
                        .setRequired(true)
                )
                .addNumberOption((opt) =>
                    opt.setName('year')
                        .setDescription('Año del cumpleaños')
                        .setMinValue(1900)
                        .setMaxValue(new Date().getFullYear())
                        .setRequired(true)
                )
        )
        .addSubcommand((option) =>
            option.setName('get')
                .setDescription('Obtiene la fecha de cumpleaños de un usuario')
                .addUserOption((opt) =>
                    opt.setName('user')
                        .setDescription('Usuario a consultar')
                        .setRequired(false)
                )
        )
        .addSubcommand((option) =>
            option.setName('upcoming')
                .setDescription('Muestra los próximos cumpleaños del servidor')
                .addIntegerOption((opt) =>
                    opt.setName('limit')
                        .setDescription('Cantidad máxima a mostrar (1-20)')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(false)
                )
        )
        .addSubcommand((option) =>
            option.setName('config')
                .setDescription('Muestra el estado de la agenda de cumpleaños de este servidor')
        )
        .addSubcommand((option) =>
            option.setName('set-role')
                .setDescription('Configura el rol que se asignará en cumpleaños')
                .addRoleOption((opt) =>
                    opt.setName('role')
                        .setDescription('Rol de cumpleaños')
                        .setRequired(true)
                )
        )
        .addSubcommand((option) =>
            option.setName('clear-role')
                .setDescription('Elimina la configuración del rol de cumpleaños')
        )
        .addSubcommand((option) =>
            option.setName('set-channel')
                .setDescription('Configura el canal de felicitaciones de cumpleaños')
                .addChannelOption((opt) =>
                    opt.setName('channel')
                        .setDescription('Canal de felicitaciones')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true)
                )
        )
        .addSubcommand((option) =>
            option.setName('clear-channel')
                .setDescription('Elimina la configuración del canal de felicitaciones')
        )
        .addSubcommand((option) =>
            option.setName('add-role')
                .setDescription('Asigna manualmente el rol de cumpleaños a un usuario')
                .addUserOption((opt) =>
                    opt.setName('user')
                        .setDescription('Usuario al que se le asignará el rol')
                        .setRequired(true)
                )
        )
        .addSubcommand((option) =>
            option.setName('remove-role')
                .setDescription('Quita manualmente el rol de cumpleaños a un usuario')
                .addUserOption((opt) =>
                    opt.setName('user')
                        .setDescription('Usuario al que se le quitará el rol')
                        .setRequired(true)
                )
        )
        .addSubcommand((option) =>
            option.setName('delete')
                .setDescription('Elimina tu fecha de cumpleaños del servidor')
        ),

    execute: async (interaction) => {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        switch (subcommand) {
            case 'set': {
                const day = interaction.options.getNumber('day');
                const month = interaction.options.getNumber('month');
                const year = interaction.options.getNumber('year');

                if (!isValidBirthday(day, month, year)) {
                    await interaction.reply({
                        content: 'La fecha ingresada no es válida. Revisa día, mes y año.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const existing = await getBirthday(interaction.user.id, interaction.user.username, guildId);
                await setBirthday( interaction.user.id, interaction.user.username, guildId, { day, month, year });

                const reply = existing
                    ? `Tu cumpleaños se actualizó: ${formatBirthday(day, month, year)}.`
                    : `Tu cumpleaños se registró: ${formatBirthday(day, month, year)}.`;

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: `Solicitado por ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTitle(reply)
                    .setDescription('Tu fecha quedó guardada en el modelo de usuario para este servidor.')
                    .setColor(COLORS.PRIMARY);

                await interaction.reply({ embeds: [embed] });
                break;
            }

            case 'get': {
                const user = interaction.options.getUser('user') || interaction.user;
                const birth = await getBirthday(user.id, user.username, guildId);

                if (!birth) {
                    const embed = new EmbedBuilder()
                        .setColor(COLORS.PRIMARY)
                        .setTitle(
                            user.id === interaction.user.id
                                ? 'No has establecido tu fecha de cumpleaños todavía.'
                                : `${user.username} aún no ha establecido su cumpleaños.`
                        );

                    await interaction.reply({ embeds: [embed] });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setColor(COLORS.PRIMARY)
                    .setTitle(
                        user.id === interaction.user.id
                            ? `Tu cumpleaños es el ${birth[0]} de ${getMonths(birth[1])}.`
                            : `El cumpleaños de ${user.username} es el ${birth[0]} de ${getMonths(birth[1])}.`
                    );

                await interaction.reply({ embeds: [embed] });
                break;
            }

            case 'upcoming': {
                const limit = interaction.options.getInteger('limit') || 10;
                const birthdays = await getUpcomingBirthdays(guildId, limit);

                if (birthdays.length === 0) {
                    await interaction.reply({
                        content: 'No hay cumpleaños registrados en este servidor.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const lines = birthdays.map((birthday, index) => {
                    const when = birthday.daysUntil === 0 ? 'hoy' : `en ${birthday.daysUntil} día(s)`;
                    return `${index + 1}. <@${birthday.userId}> — ${birthday.day} de ${getMonths(birthday.month)} (${when})`;
                });

                const embed = new EmbedBuilder()
                    .setTitle('🎂 Próximos cumpleaños')
                    .setDescription(lines.join('\n'))
                    .setColor(COLORS.SUCCESS);

                await interaction.reply({ embeds: [embed] });
                break;
            }

            case 'config': {
                const settings = await getBirthdaySettings(guildId);
                const roleText = settings.birthdayRoleId ? `<@&${settings.birthdayRoleId}>` : 'No configurado';
                const channelText = settings.birthdayChannelId ? `<#${settings.birthdayChannelId}>` : 'No configurado';

                const embed = new EmbedBuilder()
                    .setTitle('⚙️ Configuración de cumpleaños')
                    .addFields(
                        { name: 'Rol de cumpleaños', value: roleText, inline: true },
                        { name: 'Canal de felicitaciones', value: channelText, inline: true }
                    )
                    .setColor(COLORS.PRIMARY);

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }

            case 'set-role': {
                const canContinue = await ensureAdmin(
                    interaction,
                    'Necesitas permisos de "Gestionar servidor" para configurar el rol de cumpleaños.'
                );
                if (!canContinue) {
                    return;
                }

                const role = interaction.options.getRole('role');
                await setBirthdayRole(guildId, role.id);

                await interaction.reply({
                    content: `Rol de cumpleaños configurado correctamente: ${role}.`,
                    flags: MessageFlags.Ephemeral
                });
                break;
            }

            case 'clear-role': {
                const canContinue = await ensureAdmin(
                    interaction,
                    'Necesitas permisos de "Gestionar servidor" para eliminar el rol de cumpleaños.'
                );
                if (!canContinue) {
                    return;
                }

                await clearBirthdayRole(guildId);
                await interaction.reply({
                    content: 'Configuración del rol de cumpleaños eliminada.',
                    flags: MessageFlags.Ephemeral
                });
                break;
            }

            case 'set-channel': {
                const canContinue = await ensureAdmin(
                    interaction,
                    'Necesitas permisos de "Gestionar servidor" para configurar el canal de felicitaciones.'
                );
                if (!canContinue) {
                    return;
                }

                const channel = interaction.options.getChannel('channel');
                await setBirthdayChannel(guildId, channel.id);

                await interaction.reply({
                    content: `Canal de felicitaciones configurado correctamente: ${channel}.`,
                    flags: MessageFlags.Ephemeral
                });
                break;
            }

            case 'clear-channel': {
                const canContinue = await ensureAdmin(
                    interaction,
                    'Necesitas permisos de "Gestionar servidor" para eliminar el canal de felicitaciones.'
                );
                if (!canContinue) {
                    return;
                }

                await clearBirthdayChannel(guildId);
                await interaction.reply({
                    content: 'Canal de felicitaciones eliminado de la configuración.',
                    flags: MessageFlags.Ephemeral
                });
                break;
            }

            case 'add-role': {
                const canContinue = await ensureAdmin(
                    interaction,
                    'Necesitas permisos de "Gestionar servidor" para asignar el rol de cumpleaños manualmente.'
                );
                if (!canContinue) {
                    return;
                }

                const settings = await getBirthdaySettings(guildId);
                if (!settings.birthdayRoleId) {
                    await interaction.reply({
                        content: 'No hay rol de cumpleaños configurado. Usa `/birthday set-role` primero.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const role = interaction.guild.roles.cache.get(settings.birthdayRoleId)
                    || await interaction.guild.roles.fetch(settings.birthdayRoleId).catch(() => null);

                if (!role) {
                    await interaction.reply({
                        content: 'El rol configurado ya no existe. Configúralo nuevamente.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const user = interaction.options.getUser('user');
                const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                if (!member) {
                    await interaction.reply({
                        content: 'No pude encontrar al miembro en este servidor.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if (member.roles.cache.has(role.id)) {
                    await interaction.reply({
                        content: `${member} ya tiene el rol ${role}.`,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                await member.roles.add(role, `Asignado manualmente por ${interaction.user.tag}`);
                await interaction.reply({
                    content: `Rol ${role} asignado a ${member}.`,
                    flags: MessageFlags.Ephemeral
                });
                break;
            }

            case 'remove-role': {
                const canContinue = await ensureAdmin(
                    interaction,
                    'Necesitas permisos de "Gestionar servidor" para quitar el rol de cumpleaños manualmente.'
                );
                if (!canContinue) {
                    return;
                }

                const settings = await getBirthdaySettings(guildId);
                if (!settings.birthdayRoleId) {
                    await interaction.reply({
                        content: 'No hay rol de cumpleaños configurado. Usa `/birthday set-role` primero.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const role = interaction.guild.roles.cache.get(settings.birthdayRoleId)
                    || await interaction.guild.roles.fetch(settings.birthdayRoleId).catch(() => null);

                if (!role) {
                    await interaction.reply({
                        content: 'El rol configurado ya no existe. Configúralo nuevamente.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const user = interaction.options.getUser('user');
                const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                if (!member) {
                    await interaction.reply({
                        content: 'No pude encontrar al miembro en este servidor.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if (!member.roles.cache.has(role.id)) {
                    await interaction.reply({
                        content: `${member} no tiene el rol ${role}.`,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                await member.roles.remove(role, `Retirado manualmente por ${interaction.user.tag}`);
                await interaction.reply({
                    content: `Rol ${role} retirado de ${member}.`,
                    flags: MessageFlags.Ephemeral
                });
                break;
            }

            case 'delete': {
                await delBirthday( interaction.user.id, interaction.user.username, guildId);
                await interaction.reply({
                    content: 'Tu fecha de cumpleaños se eliminó correctamente.',
                    flags: MessageFlags.Ephemeral
                });
                break;
            }

            default:
                await interaction.reply({
                    content: 'Subcomando no reconocido.',
                    flags: MessageFlags.Ephemeral
                });
        }
    }
};
