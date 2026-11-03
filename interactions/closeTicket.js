// Interaction handler for closing a ticket

// Export the interaction handler for closing a ticket
const { getTicketByChannel, registerTicketClose } = require('../db/tickets');

module.exports = async (interaction) => {
    const { channel, guild, user } = interaction;

    try {
        const ticketData = await getTicketByChannel(channel.id);

        let ownerId = ticketData?.ownerId || null;
        if (!ownerId && channel.topic) {
            const match = channel.topic.match(/owner:(\d+)/);
            ownerId = match ? match[1] : channel.topic;
        }

        const ticketOwner = ownerId
            ? await guild.members.fetch(ownerId).catch(() => null)
            : null;

        await registerTicketClose({
            channelId: channel.id,
            closedById: user.id,
            closedByTag: user.tag || user.username,
            closeReason: 'manual-close-button'
        });

        await interaction.reply({ content: 'Ticket cerrado. Eliminando canal...', ephemeral: true });

        if (ticketOwner) {
            await ticketOwner.send('Tu ticket fue cerrado por el staff.').catch(() => null);
        }

        setTimeout(() => {
            channel.delete().catch(console.error);
        }, 1500);
    } catch (err) {
        console.error('Error al cerrar ticket:', err);

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: 'No se pudo cerrar el ticket.', ephemeral: true }).catch(() => null);
        } else {
            await interaction.reply({ content: 'No se pudo cerrar el ticket.', ephemeral: true }).catch(() => null);
        }
    }
};