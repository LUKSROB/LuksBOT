// Event handler for bot ready event

// Import necessary modules
const { setGuild } = require('../../db/guild');
const { updateCache } = require('../../utils/functions/invites');

// Export the ready event handler
module.exports = async (client) => {
        
    console.log(`Connected to Discord! as ${client.user.username}`);

    client.guilds.cache.map(async guild => {
        await setGuild(guild);
    });

    updateCache(client);

};