// Event handler for invite deletion

const { updateCache } = require("../utils/functions/invites");

module.exports = async (invite) => {

    updateCache(invite.client);
    
};