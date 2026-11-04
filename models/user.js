// Model for user data in MongoDB

// Import dependencies
const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    guildId: { type: String, required: true },
    lastInteractionAt: { type: Date, default: Date.now, index: true },
    birthday: { type: [Number], default: [] },
    lastCelebratedYear: { type: [Number], default: [] }
}, { strict: false });

// Export the user model
module.exports = mongoose.model('User', userSchema);