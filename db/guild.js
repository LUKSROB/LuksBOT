// guild: Handler for guild-related database operations

// Import necessary modules
const Guild = require('../models/guild');

// Function to compute the unban date based on the ban date and duration
function computeUnbanAt(bannedAt, durationSeconds) {
    if (!durationSeconds) {
        return null;
    }

    return new Date(bannedAt.getTime() + Number(durationSeconds) * 1000);
}

// Function to set or create a guild in the database
async function setGuild(guild) {
    await Guild.updateOne(
        { guildId: guild.id },
        {
            $set: { guildName: guild.name },
            $setOnInsert: { guildId: guild.id }
        },
        { upsert: true }
    );
}

// Function to get a guild by its ID
async function getGuild(guildId) {
    let guild = await Guild.findOne({ guildId });

    return guild ? guild : undefined;
}

// Function to update a guild's data
async function updateGuild(guildId, data) {
    await Guild.updateOne(
        { guildId },
        { $set: data }
    );
}

// Add a ban record to a guild
async function createBanRecord(guildId, data) {
    const bannedAt = data.bannedAt || new Date();
    const durationSeconds = data.durationSeconds ? Number(data.durationSeconds) : null;

    const ban = {
        userId: data.userId,
        userTag: data.userTag || null,
        moderatorId: data.moderatorId,
        moderatorTag: data.moderatorTag || null,
        channelId: data.channelId || null,
        reason: data.reason || 'No se especifica la razón del baneo',
        durationSeconds,
        bannedAt,
        unbanAt: computeUnbanAt(bannedAt, durationSeconds),
        isBanned: true,
        unbannedAt: null,
        unbanType: null,
        unbannedById: null,
        unbannedByTag: null,
        unbanReason: null
    };

    const updatedGuild = await Guild.findOneAndUpdate(
        { guildId },
        {
            $setOnInsert: {
                guildId,
                guildName: data.guildName || 'Unknown Guild'
            },
            $push: { bans: ban }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return updatedGuild?.bans?.[updatedGuild.bans.length - 1] || null;
}

// Get the active ban of a user in a guild
async function getActiveBan(guildId, userId) {
    const guild = await Guild.findOne({ guildId }, { bans: 1 }).lean();

    if (!guild || !Array.isArray(guild.bans)) {
        return null;
    }

    return guild.bans
        .filter((ban) => ban.userId === userId && ban.isBanned)
        .sort((a, b) => new Date(b.bannedAt).getTime() - new Date(a.bannedAt).getTime())[0] || null;
}

// Get all bans of a guild
async function getGuildBans(guildId, { activeOnly = false } = {}) {
    const guild = await Guild.findOne({ guildId }, { bans: 1 }).lean();

    if (!guild || !Array.isArray(guild.bans)) {
        return [];
    }

    const bans = activeOnly
        ? guild.bans.filter((ban) => ban.isBanned)
        : guild.bans;

    return [...bans].sort((a, b) => new Date(b.bannedAt).getTime() - new Date(a.bannedAt).getTime());
}

// Get the ban history of a user in a guild
async function getUserBanHistory(guildId, userId) {
    const guild = await Guild.findOne({ guildId }, { bans: 1 }).lean();

    if (!guild || !Array.isArray(guild.bans)) {
        return [];
    }

    return guild.bans
        .filter((ban) => ban.userId === userId)
        .sort((a, b) => new Date(b.bannedAt).getTime() - new Date(a.bannedAt).getTime());
}

// Get all temporary bans whose time has expired
async function getDueBans(now = new Date()) {
    const guilds = await Guild.find(
        {
            bans: {
                $elemMatch: {
                    isBanned: true,
                    unbanAt: { $ne: null, $lte: now }
                }
            }
        },
        { guildId: 1, guildName: 1, bans: 1 }
    ).lean();

    const nowMs = now.getTime();
    const dueBans = [];

    for (const guild of guilds) {
        for (const ban of guild.bans || []) {
            if (!ban.isBanned || !ban.unbanAt) {
                continue;
            }

            if (new Date(ban.unbanAt).getTime() > nowMs) {
                continue;
            }

            dueBans.push({
                guildId: guild.guildId,
                guildName: guild.guildName,
                ...ban
            });
        }
    }

    return dueBans.sort((a, b) => new Date(a.unbanAt).getTime() - new Date(b.unbanAt).getTime());
}

// Mark a specific ban record as unbanned
async function markBanAsUnbanned(guildId, banId, data = {}) {
    const result = await Guild.updateOne(
        { guildId, bans: { $elemMatch: { _id: banId, isBanned: true } } },
        {
            $set: {
                'bans.$.isBanned': false,
                'bans.$.unbannedAt': data.unbannedAt || new Date(),
                'bans.$.unbanType': data.unbanType || 'automatic',
                'bans.$.unbannedById': data.unbannedById || null,
                'bans.$.unbannedByTag': data.unbannedByTag || null,
                'bans.$.unbanReason': data.unbanReason || null
            }
        }
    );

    return result.modifiedCount > 0;
}

// Mark all active bans of a user in a guild as unbanned
async function markActiveBansAsUnbanned(guildId, userId, data = {}) {
    const result = await Guild.updateOne(
        { guildId },
        {
            $set: {
                'bans.$[ban].isBanned': false,
                'bans.$[ban].unbannedAt': data.unbannedAt || new Date(),
                'bans.$[ban].unbanType': data.unbanType || 'manual',
                'bans.$[ban].unbannedById': data.unbannedById || null,
                'bans.$[ban].unbannedByTag': data.unbannedByTag || null,
                'bans.$[ban].unbanReason': data.unbanReason || null
            }
        },
        {
            arrayFilters: [
                { 'ban.userId': userId, 'ban.isBanned': true }
            ]
        }
    );

    return result.modifiedCount > 0;
}

// Export the guild functions for use in other modules
module.exports = {
    setGuild,
    getGuild,
    updateGuild,
    createBanRecord,
    getActiveBan,
    getGuildBans,
    getUserBanHistory,
    getDueBans,
    markBanAsUnbanned,
    markActiveBansAsUnbanned
};