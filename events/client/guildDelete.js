// Event handler for when a guild is deleted

// Import necessary modules
const { updateCache } = require("../../utils/functions/invites");

// Export the guildDelete event handler
module.exports = async (guild) => {

    updateCache(guild.client);
    
};