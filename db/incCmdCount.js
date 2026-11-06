// incCmdCount: Handler for command count-related database operations

// Import necessary modules
const User = require('../models/user');

// Function to increment command count for a user in a server
async function incCmdCount(userId, userName, guildId) {

    const userData = await User.findOne({ userId, userName, guildId });

    if (!userData) {
        const created = new User({
            userId,
            userName,
            guildId,
            commandCount: 1,
            lastInteractionAt: new Date()
        });
        await created.save();
        return created;
    }

    await User.updateOne(
        { userId, userName, guildId },
        {
            $set: {
                lastInteractionAt: new Date()
            },
            $inc: { commandCount: 1 }
        }
    );

    return userData;
}

// Export the incCmdCount functions for use in other modules
module.exports = {
    incCmdCount
};