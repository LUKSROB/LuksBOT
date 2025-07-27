// Model for user data in MongoDB

// Import dependencies
const mongoose = require('mongoose');

// Define the user schema
const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    guildName: { type: String, required: true },
    invites: { type: Object, default: {} },
}, { strict: false});

// Export the guild model
module.exports = mongoose.model('Guild', guildSchema);