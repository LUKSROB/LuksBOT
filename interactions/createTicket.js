// Interaction handler for creating a ticket for the user

// Import necessary modules
const { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { TICKET_CHANNEL, MOD_ROLE } = require("../config.json");

const closeButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId('closeTicket')
        .setLabel('Cerrar ticket')
        .setStyle('2')
        .setEmoji('🔒')
);

// Export the interaction handler for creating a ticket
module.exports = async (interaction) => {

    const {user, guild} = interaction;
    const ticketType = interaction.values[0];

    const ticket = guild.channels.cache.filter(channel => channel.parentId === TICKET_CHANNEL);

    if (ticket.some(ticket => ticket.topic === user.id)) return interaction.reply({content: 'Ya tienes un ticket abierto!', ephemeral: true});
    
    interaction.reply({content: 'Ticket creado!', ephemeral: true})
        .then(() => {
            guild.channels.create({
                name: ticketType + '-' + user.username.slice(0, 25 - ticketType.length),
                topic: user.id,
                type: ChannelType.GuildText,
                parent: TICKET_CHANNEL,
                permissionOverwrites : [
                    { id : interaction.guild.roles.everyone, deny : [PermissionsBitField.Flags.ViewChannel] },
                    { id : MOD_ROLE, allow : [PermissionsBitField.Flags.ViewChannel] },
                    { id : interaction.user.id, allow : [PermissionsBitField.Flags.ViewChannel] }
                ]
            }).then(channel => {
                interaction.editReply({content: `Tu ticket fue creado: ${channel}`});
                channel.send({
                    content : `Bienvenido ${user}, \n El staff te respondera en unos instantes!`,
                    components : [closeButton]
                });
            });
        });
        
};