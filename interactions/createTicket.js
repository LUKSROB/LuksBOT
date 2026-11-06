// Interaction handler for creating a ticket for the user

// Import necessary modules
const { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { TICKET_CHANNEL, MOD_ROLE, COLORS } = require("../config.json");
const { getOpenTicketByUser, registerTicketOpen } = require("../db/tickets");

const closeButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel('Cerrar ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
);

function sanitizePart(value, fallback = 'ticket', max = 20) {
    return (value || fallback)
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '')
        .slice(0, max) || fallback;
}

// Export the interaction handler for creating a ticket
module.exports = async (interaction) => {
    try {
        const {user, guild} = interaction;
        const ticketType = interaction.values[0] || 'soporte';

        const existingDbTicket = await getOpenTicketByUser(guild.id, user.id);
        if (existingDbTicket) {
            return interaction.reply({ content: 'Ya tienes un ticket abierto.', ephemeral: true });
        }

        const existingChannel = guild.channels.cache
            .filter((channel) => channel.parentId === TICKET_CHANNEL)
            .some((channel) => channel.topic && channel.topic.includes(`owner:${user.id}`));

        if (existingChannel) {
            return interaction.reply({ content: 'Ya tienes un ticket abierto.', ephemeral: true });
        }

        await interaction.reply({ content: 'Creando ticket...', ephemeral: true });

        const safeType = sanitizePart(ticketType, 'soporte', 10);
        const safeUser = sanitizePart(user.username, 'usuario', 12);
        const channelName = `${safeType}-${safeUser}`;

        const channel = await guild.channels.create({
            name: channelName,
            topic: `owner:${user.id}|type:${safeType}`,
            type: ChannelType.GuildText,
            parent: TICKET_CHANNEL,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
                {
                    id: MOD_ROLE,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AttachFiles
                    ]
                }
            ]
        });

        await registerTicketOpen({
            guildId: guild.id,
            guildName: guild.name,
            channelId: channel.id,
            channelName: channel.name,
            ownerId: user.id,
            ownerTag: user.tag || `${user.username}`,
            type: safeType
        });

        const supportEmbed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🎫 Ticket de soporte creado')
            .setDescription(`Hola ${user}, gracias por contactar al staff.`)
            .addFields(
                { name: '🧾 Tipo', value: `\`${safeType}\``, inline: true },
                { name: '📌 Estado', value: 'Abierto', inline: true },
                {
                    name: '✅ Qué incluir para ayudarte más rápido',
                    value: [
                        '• Explica claramente el problema',
                        '• Agrega capturas o pasos para reproducir',
                        '• Indica desde cuándo sucede'
                    ].join('\n')
                }
            )
            .setFooter({ text: 'Usa el botón de abajo cuando el caso esté resuelto.' })
            .setTimestamp();

        await channel.send({
            content: `${user} <@&${MOD_ROLE}>`,
            embeds: [supportEmbed],
            components: [closeButton]
        });

        await interaction.editReply({ content: `Tu ticket fue creado: ${channel}` });

    } catch (error) {
        console.error('Error en createTicket:', error);

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'Hubo un error creando tu ticket.' }).catch(() => null);
        } else {
            await interaction.reply({ content: 'Hubo un error creando tu ticket.', ephemeral: true }).catch(() => null);
        }
    }

};