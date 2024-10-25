// Message when the bot is ready

const invites = require("../utils/functions/invites");

module.exports = async (client) => {
        
    console.log(`Connected to Discord! as ${client.user.username}`);

    await invites.updateCache(client);
};