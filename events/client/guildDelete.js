// Event handler for when a guild is deleted

// Import necessary modules
const invites = require("../../utils/functions/invites");

// Export the guildDelete event handler
module.exports = async (guild) => {

    invites.updateCache(guild.client);
    
};