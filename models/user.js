// Model for user data in MongoDB

// Import necessary modules
const mongoose = require('mongoose');

// Define the role schema and user schema
const roleSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true }
}, { _id: false });

// Define the user schema
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    guildId: { type: String, required: true },
    nickname: { type: String, default: null },
    isBot: { type: Boolean, default: false },
    commandCount: { type: Number, default: 0 },
    lastInteractionAt: { type: Date, default: Date.now, index: true },
    birthday: { type: [Number], default: [] },
    lastCelebratedYear: { type: [Number], default: [] },
    joinedAt: { type: Date, default: null },
    roles: { type: [roleSchema], default: [] }
}, { strict: false });

// Create indexes for efficient querying of users within guilds
userSchema.index({ guildId: 1, userId: 1 }, { unique: true });

// Export the user model
module.exports = mongoose.model('User', userSchema);