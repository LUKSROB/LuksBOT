// Model for user data in MongoDB

const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    guildName: { type: String, required: true },
    invites: { type: Object, default: {} },
}, { strict: false});

module.exports = mongoose.model('Guild', guildSchema);