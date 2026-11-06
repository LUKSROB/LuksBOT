const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder
} = require('discord.js');
const { COLORS } = require('../../config.json');

function formatMs(ms) {
    if (!ms || ms <= 0) {
        return '0s';
    }

    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lavalink-node')
        .setDescription('Gestiona manualmente nodos Lavalink y failover')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((option) =>
            option.setName('status')
                .setDescription('Muestra estado de nodos Lavalink y cooldowns')
        )
        .addSubcommand((option) =>
            option.setName('switch')
                .setDescription('Cambia manualmente al nodo indicado')
                .addStringOption((opt) =>
                    opt.setName('node')
                        .setDescription('Nombre o índice del nodo (ej: 1, 2, 3 o nombre)')
                        .setRequired(true)
                )
                .addBooleanOption((opt) =>
                    opt.setName('force')
                        .setDescription('Ignora cooldown del nodo/host para este cambio')
                        .setRequired(false)
                )
        )
        .addSubcommand((option) =>
            option.setName('mark-functional')
                .setDescription('Marca un nodo como funcional (limpia su cooldown/fallas)')
                .addStringOption((opt) =>
                    opt.setName('node')
                        .setDescription('Nombre o índice del nodo')
                        .setRequired(true)
                )
        ),

    execute: async (interaction) => {
        const failover = interaction.client?.lavalinkFailover;
        if (!failover) {
            await interaction.reply({
                content: 'El gestor de failover Lavalink no está inicializado.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'status') {
            const snapshot = failover.getStatusSnapshot();
            const lines = snapshot.nodes.map((node) => {
                const connected = node.connected ? '🟢 conectado' : '🔴 desconectado';
                const nodeCd = node.cooldownNodeMs > 0 ? `nodeCD=${formatMs(node.cooldownNodeMs)}` : 'nodeCD=0s';
                const hostCd = node.cooldownHostMs > 0 ? `hostCD=${formatMs(node.cooldownHostMs)}` : 'hostCD=0s';
                return `**${node.index}. ${node.name}** (${node.host}:${node.port})\n${connected} • fail=${node.failures} • ${nodeCd} • ${hostCd}`;
            });

            const embed = new EmbedBuilder()
                .setTitle('Estado de Lavalink')
                .setColor(snapshot.ready ? COLORS.SUCCESS : COLORS.WARNING)
                .addFields(
                    { name: 'Nodo activo', value: snapshot.activeNodeName || 'Ninguno', inline: true },
                    { name: 'Failover', value: snapshot.switching ? 'Conmutando...' : 'Estable', inline: true },
                    { name: 'Ready', value: snapshot.ready ? 'Sí' : 'No', inline: true },
                    { name: 'Nodos', value: lines.join('\n\n') || 'Sin nodos configurados' }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        if (subcommand === 'mark-functional') {
            const nodeRef = interaction.options.getString('node', true);
            const reset = failover.resetNodeHealth(nodeRef, { clearHostCooldown: true });

            if (!reset) {
                await interaction.reply({
                    content: `No encontré el nodo "${nodeRef}".`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            await interaction.reply({
                content: `Nodo **${reset.index}. ${reset.name}** marcado como funcional (cooldown y fallas limpiadas).`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (subcommand === 'switch') {
            const nodeRef = interaction.options.getString('node', true);
            const force = interaction.options.getBoolean('force') ?? false;

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const result = await failover.switchToNode(nodeRef, {
                force,
                timeoutMs: 20000,
                actor: interaction.user.tag
            });

            if (!result.ok && !result.pending) {
                await interaction.editReply({
                    content: result.reason || 'No se pudo cambiar de nodo.'
                });
                return;
            }

            if (result.pending) {
                await interaction.editReply({
                    content: `Cambio iniciado hacia **${result.targetNodeName}**. Aún no confirmó conexión, el failover seguirá intentando.`
                });
                return;
            }

            if (result.alreadyActive) {
                await interaction.editReply({
                    content: `El nodo **${result.activeNodeName}** ya estaba activo.`
                });
                return;
            }

            await interaction.editReply({
                content: `Cambio completado ✅ Nodo activo: **${result.activeNodeName || result.targetNodeName}**`
            });
        }
    }
};
