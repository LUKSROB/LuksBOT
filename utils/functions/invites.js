// Functions to manage Discord invites

// Import necessary modules
const { Client } = require("discord.js");
const { setInvites, getInvites } = require('../../db/invites');
const Guild = require('../../models/guild');
const INVITES_FETCH_CONCURRENCY = 4;
let cacheUpdatePromise = null;

// Function to run tasks with a concurrency limit
async function runWithConcurrency(items, limit, worker) {
    const queue = [...items];
    const workers = [];

    const workerFn = async () => {
        while (queue.length > 0) {
            const item = queue.shift();
            if (!item) {
                continue;
            }

            await worker(item);
        }
    };

    const count = Math.max(1, Math.min(limit, queue.length || 1));
    for (let index = 0; index < count; index++) {
        workers.push(workerFn());
    }

    await Promise.all(workers);
}

// Function to refresh the invites for a specific guild
async function refreshGuildInvites(guild) {
    await Guild.updateOne(
        { guildId: guild.id },
        { $set: { invites: [] }},
        { upsert: true }
    );

    const fetched = await guild.invites.fetch();
    for (const invite of fetched.values()) {
        if (!invite.inviter) continue;
        await setInvites(guild.id, invite);
    }
}
/**
 * Update the cache with the current invites
 * @param {Client} client
 */

// Function to update the invite cache for all guilds the bot is in.
async function updateCache(client) {
    if (!client || !client.guilds) {
        return;
    }

    if (cacheUpdatePromise) {
        return cacheUpdatePromise;
    }

    const guilds = [...client.guilds.cache.values()];

    cacheUpdatePromise = runWithConcurrency(guilds, INVITES_FETCH_CONCURRENCY, async (guild) => {
        try {
            await refreshGuildInvites(guild);
        } catch (error) {
            console.error(`[Invites] Error updating invite cache for guild ${guild.id}:`, error.message);
        }
    }).finally(() => {
        cacheUpdatePromise = null;
    });

    return cacheUpdatePromise;
}

/**
 * Obtain the last used invite
 * @param {Guild} guild
 */

// Function to get the last used invite in a guild.
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
        if (!guildInvite) {
            continue;
        }
        
        if (updatedInvite && updatedInvite.uses > guildInvite.uses) {
            usedInvite = updatedInvite;
            break;
        }
    }
    
    return usedInvite;

}

// Export the functions for use in other modules
module.exports = {
    runWithConcurrency,
    refreshGuildInvites,
    updateCache,
    getLastUsed
};