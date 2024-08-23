// 

const { Collection, Client, Guild } = require("discord.js");
const inviteCache = new Collection();

/**
 * @param {Client} client
 */

async function updateCache(client) {
    const guilds = client.guilds.cache;

    for (const guild of guilds) {
        invite.set(guild.id, guild.invites);
    };
}

/**
 * Obtain the last used invite
 * @param {Guild} guild
 */

async function getLastUsed(guild) {
    const guildCacheInvites = await inviteCache.get(guild.id)?.fetch();
    const guildUpdateInvites = await guild.invites.fetch();

    
}