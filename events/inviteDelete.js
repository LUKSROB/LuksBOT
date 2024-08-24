

const invites = require("../utils/functions/invites");

module.exports = async (invite) => {
    invites.updateCache(invite.client);
};