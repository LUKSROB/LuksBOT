// Model for guild data in MongoDB

// Import necessary modules
const mongoose = require('mongoose');

// Define the embedded ban schema
const banRecordSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userTag: { type: String, default: null },
    moderatorId: { type: String, required: true },
    moderatorTag: { type: String, default: null },
    channelId: { type: String, default: null },
    reason: { type: String, default: 'No se especifica la razón del baneo' },
    durationSeconds: { type: Number, default: null },
    bannedAt: { type: Date, required: true, default: Date.now },
    unbanAt: { type: Date, default: null },
    isBanned: { type: Boolean, required: true, default: true },
    unbannedAt: { type: Date, default: null },
    unbanType: {
        type: String,
        enum: ['manual', 'automatic', 'external', null],
        default: null
    },
    unbannedById: { type: String, default: null },
    unbannedByTag: { type: String, default: null },
    unbanReason: { type: String, default: null }
}, { _id: true });

// Define the guild schema
const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    guildName: { type: String, required: true },
    invites: { type: Object, default: {} },
    birthdayRoleId: { type: String, default: null },
    birthdayChannelId: { type: String, default: null },
    bans: { type: [banRecordSchema], default: [] }
}, { strict: false});

// Create indexes for efficient querying of bans within guilds
guildSchema.index({ 'bans.isBanned': 1, 'bans.unbanAt': 1 });
guildSchema.index({ 'bans.userId': 1 });

// Export the guild model
module.exports = mongoose.model('Guild', guildSchema);