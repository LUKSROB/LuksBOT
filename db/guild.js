// Handler for guild-related database operations
// guild: Handler for guild-related database operations

// Import necessary modules
const Guild = require('../models/guild');

// Function to set or create a guild in the database
async function setGuild(guild) {
    await Guild.updateOne(
        { guildId: guild.id },
        {
            $set: { guildName: guild.name },
            $setOnInsert: { guildId: guild.id }
        },
        { upsert: true }
    );
}

// Function to get a guild by its ID
async function getGuild(guildId) {
    let guild = await Guild.findOne({ guildId });

    return guild ? guild : undefined;
}

// Function to update a guild's data
async function updateGuild(guildId, data) {
    await Guild.updateOne(
        { guildId },
        { $set: data }
    );
}

// Export the functions for use in other modules
module.exports = {
    setGuild,
    getGuild,
    updateGuild
};