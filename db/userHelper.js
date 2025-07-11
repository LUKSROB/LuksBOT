const User = require('../models/user');

async function getOrCreateUser(userId, serverId) {
    let user = await User.findOne({ userId, serverId });

    if (!user) {
        user = new User({
            userId,
            serverId
        });
        await user.save();
    }
        return user;
}

async function incrementCommandCount(userId, serverId) {
    await User.updateOne(
        { userId, serverId },
        { $inc: { commandCount: 1 } }
    );
}

module.exports = { getOrCreateUser, incrementCommandCount };