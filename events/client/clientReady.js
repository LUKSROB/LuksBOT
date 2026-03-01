

const { updateCache } = require('../../utils/functions/invites')
const { setGuild } = require('../../db/guild')

module.exports = (client) => {
    client.riffy.init(client.user.id);
    console.log(`Connected to Discord! as ${client.user.username}`);

    client.guilds.cache.map(async guild => {
        await setGuild(guild);
    });

    updateCache(client);

};