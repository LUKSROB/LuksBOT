// Event handler for invite deletion

// Import necessary modules
const { updateCache } = require("../utils/functions/invites");

// Export the inviteDelete event handler
module.exports = async (invite) => {

    updateCache(invite.client);
    
};