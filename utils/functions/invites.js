// 

const { Collection, Client, Guild } = require("discord.js");
const invites = new Collection();
const inviteCache = new Collection();
/**
 * Update the cache with the current invites
 * @param {Client} client
 */

async function updateCache(client) {
    const guilds = client.guilds.cache;

    for (const guild of guilds.values()) {
        invites.set(guild.id, await guild.invites.fetch());
    };
}

/**
 * Obtain the last used invite
 * @param {Guild} guild
 */

async function getLastUsed(guild) {
    const guildCacheInvites = await inviteCache.get(guild.id)?.fetch();
    const guildUpdatedInvites = await guild.invites.fetch();

    if (!guildCacheInvites) {
        await updateCache(guild.client);
        return;
    }

    let usedInvite;
    for (const invite of guildCacheInvites.values()) {
        const updatedInvite = guildUpdatedInvites.get(invite.code);
        
        if (updatedInvite && updatedInvite.uses !== invite.uses) {
            usedInvite = updatedInvite || invite;
        }
    }

    await updateCache(guild.client);
    return usedInvite;
}

module.exports = { updateCache, getLastUsed };