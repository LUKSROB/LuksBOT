const User = require('../models/user');

async function getUser(serverId, userId) {
    let user = await User.findOne({ serverId, userId });

    if (!user) {
        user = new User({
            serverId,
            userId,
        });
        await user.save();
    }
        return user;
}

async function incCmdCount(serverId, userId) {
    await User.updateOne(
        { serverId, userId },
        { $inc: { commandCount: 1 } }
    );
}

module.exports = { getUser, incCmdCount };