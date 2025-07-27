// 

const { Client } = require("discord.js");
const { setInvites, getInvites } = require('../../db/invites');
const Guild = require('../../models/guild');
/**
 * Update the cache with the current invites
 * @param {Client} client
 */

async function updateCache(client) {
    const guildId = client.guilds.cache.first()?.id;

    await Guild.updateOne(
        { guildId },
        { $set: { invites: [] }},
    );

    const guilds = client.guilds.cache;

    for (const guild of guilds.values()) {
        const fetched = await guild.invites.fetch();
        for (const invite of fetched.values()) {
            if (!invite.inviter) continue;
            await setInvites(guild.id, invite);
        }
    }
}

/**
 * Obtain the last used invite
 * @param {Guild} guild
 */

async function getLastUsed(guild) {
    const guildInvites = await getInvites(guild.id);
    const guildInvitesUpdated = await guild.invites.fetch();

    if (!guildInvites) {
        return null;
    }

    let usedInvite;
    for (const invite of guildInvitesUpdated.values()) {

        const updatedInvite = guildInvitesUpdated.get(invite.code);
        const guildInvite = guildInvites.find(inv => inv.code === invite.code);
        
        if (updatedInvite && updatedInvite.uses > guildInvite.uses) {
            usedInvite = updatedInvite;
            break; // Solo necesitas la primera que cambió
        }
    }
    
    return usedInvite;
}

module.exports = { updateCache, getLastUsed };