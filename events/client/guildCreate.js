// Event handler for when a guild is created

// Import necessary modules
const { updateCache } = require("../../utils/functions/invites");

// Export the guildCreate event handler
module.exports = async (guild) => {

    updateCache(guild.client);

};