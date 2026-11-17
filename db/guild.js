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

// Configurable per-guild settings (channels and roles) that replace config.json
const GUILD_SETTING_KEYS = Object.freeze([
    'welcomeChannelId',
    'goodbyeChannelId',
    'invitesChannelId',
    'messagesChannelId',
    'birthdayChannelId',
    'birthdayRoleId',
    'ticketChannelId',
    'ticketLogChannelId',
    'ticketPanelMessageId',
    'modRoleId'
]);

// Normalize a setting value to a trimmed string or null
function normalizeSettingValue(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized || null;
}

// Function to get the configurable settings of a guild
async function getGuildSettings(guildId) {
    const projection = { guildId: 1, settingsUpdatedAt: 1 };
    for (const key of GUILD_SETTING_KEYS) {
        projection[key] = 1;
    }

    const guild = await Guild.findOne({ guildId }, projection).lean();
    const settings = {};

    for (const key of GUILD_SETTING_KEYS) {
        settings[key] = guild ? (guild[key] ?? null) : null;
    }

    settings.settingsUpdatedAt = guild?.settingsUpdatedAt ?? null;
    return settings;
}

// Function to update one or more configurable settings of a guild
async function updateGuildSettings(guildId, data = {}) {
    const update = {};

    for (const key of GUILD_SETTING_KEYS) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            update[key] = normalizeSettingValue(data[key]);
        }
    }

    if (Object.keys(update).length === 0) {
        return getGuildSettings(guildId);
    }

    update.settingsUpdatedAt = new Date();

    await Guild.updateOne(
        { guildId },
        {
            $set: update,
            $setOnInsert: { guildId, guildName: 'Unknown Guild' }
        },
        { upsert: true }
    );

    return getGuildSettings(guildId);
}

// Function to clear a single configurable setting of a guild
async function clearGuildSetting(guildId, key) {
    if (!GUILD_SETTING_KEYS.includes(key)) {
        throw new Error(`Unknown guild setting: ${key}`);
    }

    await Guild.updateOne(
        { guildId },
        {
            $set: { [key]: null, settingsUpdatedAt: new Date() },
            $setOnInsert: { guildId, guildName: 'Unknown Guild' }
        },
        { upsert: true }
    );

    return getGuildSettings(guildId);
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
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
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
    GUILD_SETTING_KEYS,
    getGuildSettings,
    updateGuildSettings,
    clearGuildSetting,
    createBanRecord,
    getActiveBan,
    getGuildBans,
    getUserBanHistory,
    getDueBans,
    markBanAsUnbanned,
    markActiveBansAsUnbanned
};