// Event handler for invite creation

// Import necessary modules
const { updateCache } = require("../../utils/functions/invites");

// Export the inviteCreate event handler
module.exports = async (invite) => {

    updateCache(invite.client);
    
};