// tickets: Handler for ticket-related database operations

// Import necessary modules
const Ticket = require('../models/ticket');

// Function to get an open ticket by user
async function getOpenTicketByUser(guildId, ownerId) {
    return Ticket.findOne({ guildId, ownerId, status: 'open' });
}
// Function to get a ticket by channel
async function getTicketByChannel(channelId) {
    return Ticket.findOne({ channelId });
}
// Function to register a ticket as opened
async function registerTicketOpen(data) {
    const payload = {
        guildId: data.guildId,
        guildName: data.guildName,
        channelId: data.channelId,
        channelName: data.channelName,
        ownerId: data.ownerId,
        ownerTag: data.ownerTag,
        type: data.type || 'soporte',
        status: 'open',
        openedAt: new Date(),
        closedAt: null,
        closedById: null,
        closedByTag: null,
        closeReason: null
    };

    return Ticket.findOneAndUpdate(
        { channelId: data.channelId },
        { $set: payload },
        { upsert: true, new: true }
    );
}
// Function to register a ticket as closed
async function registerTicketClose({ channelId, closedById, closedByTag, closeReason }) {
    return Ticket.updateOne(
        { channelId, status: 'open' },
        {
            $set: {
                status: 'closed',
                closedAt: new Date(),
                closedById: closedById || null,
                closedByTag: closedByTag || null,
                closeReason: closeReason || 'manual-close-button'
            }
        }
    );
}

// Export the ticket functions for use in other modules
module.exports = {
    getOpenTicketByUser,
    getTicketByChannel,
    registerTicketOpen,
    registerTicketClose
};