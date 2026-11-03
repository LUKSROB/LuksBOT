const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    guildName: { type: String, required: true },
    channelId: { type: String, required: true, unique: true, index: true },
    channelName: { type: String, required: true },

    ownerId: { type: String, required: true, index: true },
    ownerTag: { type: String, required: true },

    type: { type: String, required: true, default: 'soporte' },
    status: { type: String, required: true, enum: ['open', 'closed'], default: 'open', index: true },

    openedAt: { type: Date, required: true, default: Date.now },
    closedAt: { type: Date, default: null },

    closedById: { type: String, default: null },
    closedByTag: { type: String, default: null },
    closeReason: { type: String, default: null }
}, { timestamps: true });

ticketSchema.index({ guildId: 1, ownerId: 1, status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);