// Model for user data in MongoDB

// Import dependencies
const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    serverId: { type: String, required: true },
}, { strict: false });

// Export the user model
module.exports = mongoose.model('User', userSchema);