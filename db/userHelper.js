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
    let created = 0;
    let updated = 0;

    for (const [, member] of members) {
        if (!includeBots && member.user.bot) continue;

        const payload = {
            userName: member.user.username,
            nickname: member.nickname || null,
            isBot: member.user.bot,
            joinedAt: member.joinedAt,
            roles: member.roles.cache.map((role) => ({
                id: role.id,
                name: role.name
            }))
        };

        const existing = await User.findOne({ userId: member.id, guildId: guild.id });

        if (!existing) {
            await new User({
                userId: member.id,
                userName: member.user.username,
                guildId: guild.id,
                nickname: member.nickname || null,
                isBot: member.user.bot,
                joinedAt: member.joinedAt,
                roles: member.roles.cache.map((role) => ({
                    id: role.id,
                    name: role.name
                })),
                lastInteractionAt: new Date(),
                commandCount: 0
            }).save();
            created++;
            continue;
        }

        existing.userName = member.user.username;
        existing.nickname = member.nickname || null;
        existing.isBot = member.user.bot;
        existing.joinedAt = member.joinedAt;
        existing.roles = member.roles.cache.map((role) => ({
            id: role.id,
            name: role.name
        }));
        existing.lastInteractionAt = new Date();
        await existing.save();
        updated++;
    }

    return { created, updated, total: created + updated };
}

// Export the user helper functions for use in other modules
module.exports = {
    getUser,
    upsertUser,
    loadGuildUsers
};