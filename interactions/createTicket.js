// Interaction handler for creating a ticket for the user

// Import necessary modules
const { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require("discord.js");
const { COLORS } = require("../config.json");
const { getGuildSettings } = require("../db/guild");
const { getOpenTicketByUser, registerTicketOpen } = require("../db/tickets");
const { sanitizePart } = require("../utils/functions/messages");

// Export the interaction handler for creating a ticket
module.exports = async (interaction) => {

    const closeButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('closeTicket')
                .setLabel('Cerrar ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
    );

    try {
        const {user, guild} = interaction;
        const ticketType = interaction.values[0] || 'soporte';

        const settings = await getGuildSettings(guild.id);
        const ticketCategoryId = settings.ticketChannelId;
        const modRoleId = settings.modRoleId;

        const existingDbTicket = await getOpenTicketByUser(guild.id, user.id);
        if (existingDbTicket) {
            return interaction.reply({ content: 'Ya tienes un ticket abierto.', flags: MessageFlags.Ephemeral });
        }

        const existingChannel = ticketCategoryId
            ? guild.channels.cache
                .filter((channel) => channel.parentId === ticketCategoryId)
                .some((channel) => channel.topic && channel.topic.includes(`owner:${user.id}`))
            : false;

        if (existingChannel) {
            return interaction.reply({ content: 'Ya tienes un ticket abierto.', flags: MessageFlags.Ephemeral });
        }

        await interaction.reply({ content: 'Creando ticket...', flags: MessageFlags.Ephemeral });

        const safeType = sanitizePart(ticketType, 'soporte', 10);
        const safeUser = sanitizePart(user.username, 'usuario', 12);
        const channelName = `${safeType}-${safeUser}`;

        const permissionOverwrites = [
            { id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
            {
                id: user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles
                ]
            }
        ];

        if (modRoleId) {
            permissionOverwrites.push({
                id: modRoleId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            });
        }

        const channel = await guild.channels.create({
            name: channelName,
            topic: `owner:${user.id}|type:${safeType}`,
            type: ChannelType.GuildText,
            parent: ticketCategoryId || undefined,
            permissionOverwrites
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
            content: modRoleId ? `${user} <@&${modRoleId}>` : `${user}`,
            embeds: [supportEmbed],
            components: [closeButton]
        });

        await interaction.editReply({ content: `Tu ticket fue creado: ${channel}` });

    } catch (error) {
        console.error('Error en createTicket:', error);

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'Hubo un error creando tu ticket.' }).catch(() => null);
        } else {
            await interaction.reply({ content: 'Hubo un error creando tu ticket.', flags: MessageFlags.Ephemeral }).catch(() => null);
        }
    }

};