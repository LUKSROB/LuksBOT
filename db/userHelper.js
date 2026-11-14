// userHelper: Handler for user-related database operations

// Import necessary modules
const User = require('../models/user');

// Function to insert or update a user in the database
async function upsertUser(userId, userName, guildId, extraData = {}) {
    const query = { userId, guildId };
    const update = {
        $set: {
            userName,
            guildId,
            lastInteractionAt: new Date(),
            ...extraData
        },
        $inc: { commandCount: 1 }
    };

    const userData = await User.findOneAndUpdate(query, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
    });

    return {
        user: userData,
        created: !!userData.__v || userData.commandCount === 1
    };
}

// Function to get or create a user in the database
async function getUser(userId, userName, guildId, extraData = {}) {
    const existingUser = await User.findOne({ userId, guildId });

    if (!existingUser) {
        const newUser = new User({
            userId,
            userName,
            guildId,
            ...extraData,
            lastInteractionAt: new Date(),
            commandCount: 1
        });
        await newUser.save();
        return newUser;
    }

    existingUser.userName = userName;
    existingUser.lastInteractionAt = new Date();
    if (extraData.nickname !== undefined) existingUser.nickname = extraData.nickname;
    if (extraData.isBot !== undefined) existingUser.isBot = extraData.isBot;
    if (extraData.joinedAt !== undefined) existingUser.joinedAt = extraData.joinedAt;
    if (extraData.roles !== undefined) {
        existingUser.roles = Array.isArray(extraData.roles)
            ? extraData.roles.map((role) => ({
                id: typeof role === 'string' ? role : role?.id,
                name: typeof role === 'string' ? role : role?.name
            })).filter((role) => role.id && role.name)
            : [];
    }

    await existingUser.save();

    return existingUser;
}

// Function to load all users from a guild into the database
async function loadGuildUsers(guild, options = {}) {
    if (!guild || !guild.members || typeof guild.members.fetch !== 'function') {
        throw new Error('Se requiere un guild válido con members.fetch()');
    }

    const includeBots = !!options.includeBots;
    const members = await guild.members.fetch();
    const now = new Date();
    const memberPayloads = [];

    for (const [, member] of members) {
        if (!includeBots && member.user.bot) continue;

        memberPayloads.push({
            userId: member.id,
            userName: member.user.username,
            nickname: member.nickname || null,
            isBot: member.user.bot,
            joinedAt: member.joinedAt,
            roles: member.roles.cache.map((role) => ({
                id: role.id,
                name: role.name
            }))
        });
    }

    if (memberPayloads.length === 0) {
        return { created: 0, updated: 0, total: 0 };
    }

    const userIds = memberPayloads.map((item) => item.userId);
    const existingUsers = await User.find(
        { guildId: guild.id, userId: { $in: userIds } },
        { userId: 1 }
    ).lean();
    const existingUserIds = new Set(existingUsers.map((user) => user.userId));

    const newUsers = [];
    const updateOps = [];

    for (const payload of memberPayloads) {
        if (existingUserIds.has(payload.userId)) {
            updateOps.push({
                updateOne: {
                    filter: { guildId: guild.id, userId: payload.userId },
                    update: {
                        $set: {
                            userName: payload.userName,
                            nickname: payload.nickname,
                            isBot: payload.isBot,
                            joinedAt: payload.joinedAt,
                            roles: payload.roles,
                            lastInteractionAt: now
                        }
                    }
                }
            });
            continue;
        }

        newUsers.push({
            userId: payload.userId,
            userName: payload.userName,
            guildId: guild.id,
            nickname: payload.nickname,
            isBot: payload.isBot,
            joinedAt: payload.joinedAt,
            roles: payload.roles,
            lastInteractionAt: now,
            commandCount: 0
        });
    }

    let created = 0;
    if (newUsers.length > 0) {
        try {
            const inserted = await User.insertMany(newUsers, { ordered: false });
            created = inserted.length;
        } catch (error) {
            if (Array.isArray(error?.writeErrors)) {
                created = Math.max(0, newUsers.length - error.writeErrors.length);
            } else {
                throw error;
            }
        }
    }

    let updated = 0;
    if (updateOps.length > 0) {
        await User.bulkWrite(updateOps, { ordered: false });
        updated = updateOps.length;
    }

    return { created, updated, total: created + updated };
}

// Export the user helper functions for use in other modules
module.exports = {
    getUser,
    upsertUser,
    loadGuildUsers
};