// Event handler for invite creation

const { updateCache } = require("../utils/functions/invites");

module.exports = async (invite) => {

    updateCache(invite.client);
    
};