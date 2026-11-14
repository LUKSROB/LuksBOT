// runtimeState: Handler for runtime state persistence operations

// Import necessary modules
const RuntimeState = require('../models/runtimeState');

// Function to get a state value by key
async function getStateValue(key) {
    const entry = await RuntimeState.findOne({ key }).lean();
    return entry?.value ?? null;
}

// Function to set a state value by key
async function setStateValue(key, value) {
    await RuntimeState.updateOne(
        { key },
        {
            $set: {
                value: String(value ?? ''),
                updatedAt: new Date()
            },
            $setOnInsert: { key }
        },
        { upsert: true }
    );
}

// Export runtime state functions
module.exports = {
    getStateValue,
    setStateValue
};
