// Model for guild data in MongoDB

// Import necessary modules
const mongoose = require('mongoose');

// Define the user schema
// Define the guild schema
const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    guildName: { type: String, required: true },
    invites: { type: Object, default: {} },
    birthdayRoleId: { type: String, default: null },
    birthdayChannelId: { type: String, default: null }
}, { strict: false});

// Export the guild model
module.exports = mongoose.model('Guild', guildSchema);