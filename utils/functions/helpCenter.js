const path = require('path');
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const HELP_CUSTOM_IDS = {
    HOME: 'help_home',
    COMMANDS: 'help_commands',
    GUIDE: 'help_guide'
};

function formatCategoryName(category) {
    if (!category || typeof category !== 'string') {
        return 'General';
    }

    return category.charAt(0).toUpperCase() + category.slice(1);
}

function normalizeCommandEntry(commandName, entry) {
    const data = entry && typeof entry === 'object' ? entry.data : null;
    const name = (data && data.name) || commandName;
    const description = (data && data.description) || 'Sin descripción disponible.';

    let category = 'general';
    if (entry && typeof entry.modulePath === 'string') {
        category = path.basename(path.dirname(entry.modulePath)).toLowerCase();
    }

    return { name, description, category };
}

function buildCommandIndex(client) {
    const byCategory = new Map();

    if (!client || !client.commands || typeof client.commands.forEach !== 'function') {
        return { byCategory, totalCommands: 0 };
    }

    client.commands.forEach((entry, key) => {
        const normalized = normalizeCommandEntry(key, entry);
        const current = byCategory.get(normalized.category) || [];
        current.push(normalized);
        byCategory.set(normalized.category, current);
    });

    for (const [, commands] of byCategory) {
        commands.sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
        byCategory: new Map([...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
        totalCommands: [...byCategory.values()].reduce((acc, list) => acc + list.length, 0)
    };
}

function createNavigationRow(activePage) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(HELP_CUSTOM_IDS.HOME)
            .setLabel('Inicio')
            .setEmoji('🏠')
            .setStyle(activePage === HELP_CUSTOM_IDS.HOME ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(activePage === HELP_CUSTOM_IDS.HOME),
        new ButtonBuilder()
            .setCustomId(HELP_CUSTOM_IDS.COMMANDS)
            .setLabel('Índice de comandos')
            .setEmoji('📚')
            .setStyle(activePage === HELP_CUSTOM_IDS.COMMANDS ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(activePage === HELP_CUSTOM_IDS.COMMANDS),
        new ButtonBuilder()
            .setCustomId(HELP_CUSTOM_IDS.GUIDE)
            .setLabel('Guía práctica')
            .setEmoji('🧭')
            .setStyle(activePage === HELP_CUSTOM_IDS.GUIDE ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(activePage === HELP_CUSTOM_IDS.GUIDE)
    );
}

function createHomeEmbed(client) {
    const { byCategory, totalCommands } = buildCommandIndex(client);

    const indexLines = [...byCategory.entries()].map(([category, commands]) =>
        `• **${formatCategoryName(category)}:** ${commands.length} comando(s)`
    );

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('👋 Centro de ayuda para principiantes')
        .setDescription('Usá los botones de abajo para navegar por la ayuda del servidor y del bot.')
        .addFields(
            {
                name: '🚀 Primeros pasos',
                value: [
                    '1. Escribí `/` en el chat y elegí un comando.',
                    '2. Leé la descripción antes de ejecutarlo.',
                    '3. Si aparece un botón, tocálo para seguir la acción.'
                ].join('\n')
            },
            {
                name: '📌 Índice rápido de comandos',
                value: indexLines.length > 0 ? indexLines.join('\n') : 'Todavía no hay comandos indexados.'
            }
        )
        .setFooter({ text: `Comandos detectados: ${totalCommands}` });

    return embed;
}

function createCommandIndexEmbed(client) {
    const { byCategory, totalCommands } = buildCommandIndex(client);

    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('📚 Índice de comandos')
        .setDescription('Listado de comandos disponibles, organizado por categoría.');

    if (totalCommands === 0) {
        embed.addFields({
            name: 'Sin comandos',
            value: 'No se encontraron comandos disponibles en este momento.'
        });
        return embed;
    }

    for (const [category, commands] of byCategory.entries()) {
        let chunk = '';
        let chunkCount = 0;

        for (const cmd of commands) {
            const line = `• \`/${cmd.name}\` — ${cmd.description}\n`;
            if ((chunk + line).length > 1000) {
                embed.addFields({
                    name: chunkCount === 0
                        ? `📁 ${formatCategoryName(category)}`
                        : `📁 ${formatCategoryName(category)} (cont.)`,
                    value: chunk.trimEnd()
                });
                chunk = line;
                chunkCount++;
            } else {
                chunk += line;
            }
        }

        if (chunk.length > 0) {
            embed.addFields({
                name: chunkCount === 0
                    ? `📁 ${formatCategoryName(category)}`
                    : `📁 ${formatCategoryName(category)} (cont.)`,
                value: chunk.trimEnd()
            });
        }
    }

    embed.setFooter({ text: `Total de comandos: ${totalCommands}` });
    return embed;
}

function createGuideEmbed() {
    return new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle('🧭 Guía práctica: comandos, canales y botones')
        .addFields(
            {
                name: '📝 Cómo usar comandos',
                value: [
                    '• Escribí `/` y seleccioná un comando.',
                    '• Completá las opciones obligatorias.',
                    '• Ejecutá y esperá la respuesta del bot.'
                ].join('\n')
            },
            {
                name: '💬 Cómo usar los canales',
                value: [
                    '• Respetá el tema de cada canal.',
                    '• Evitá spam y mensajes fuera de contexto.',
                    '• Si necesitás soporte, usá el canal o sistema de tickets.'
                ].join('\n')
            },
            {
                name: '🔘 Cómo usar botones',
                value: [
                    '• Los botones ejecutan acciones rápidas sin escribir comandos.',
                    '• Leé siempre el texto del botón antes de pulsarlo.',
                    '• Si un botón no responde, revisá permisos o si la acción expiró.'
                ].join('\n')
            }
        )
        .setFooter({ text: 'Tip: Si te perdés, tocá "Inicio".' });
}

function createHelpHomePayload(client) {
    return {
        embeds: [createHomeEmbed(client)],
        components: [createNavigationRow(HELP_CUSTOM_IDS.HOME)]
    };
}

function createHelpCommandsPayload(client) {
    return {
        embeds: [createCommandIndexEmbed(client)],
        components: [createNavigationRow(HELP_CUSTOM_IDS.COMMANDS)]
    };
}

function createHelpGuidePayload() {
    return {
        embeds: [createGuideEmbed()],
        components: [createNavigationRow(HELP_CUSTOM_IDS.GUIDE)]
    };
}

module.exports = {
    HELP_CUSTOM_IDS,
    createHelpHomePayload,
    createHelpCommandsPayload,
    createHelpGuidePayload
};
