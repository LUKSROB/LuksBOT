

const invites = require("../utils/functions/invites");

module.exports = async ( guild ) => {
    invites.updateCache(guild.client);
};