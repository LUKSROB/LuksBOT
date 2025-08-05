// Event handler for when a guild is created

// Import necessary modules
const invites = require("../../utils/functions/invites");

// Export the guildCreate event handler
module.exports = async (guild) => {

    invites.updateCache(guild.client);
    
};