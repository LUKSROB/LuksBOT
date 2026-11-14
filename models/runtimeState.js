// Model for app runtime state persisted in MongoDB

// Import necessary modules
const mongoose = require('mongoose');

// Define the runtime state schema
const runtimeStateSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
});

// Export runtime state model
module.exports = mongoose.model('RuntimeState', runtimeStateSchema);
