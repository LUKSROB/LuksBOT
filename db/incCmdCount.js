// Function to increment command count for a user in a server

// Import necessary modules
const User = require('../models/user');

// Function to increment command count for a user in a server
async function incCmdCount(userId) {

    const user = await User.findOne({ userId });

    if (user.commandCount == undefined) {
        await user.updateOne(
            { userId },
            { $set: { commandCount: 0 } }
        );

        return user;
    }

    await user.updateOne(
        { userId },
        { $inc: { commandCount: 1 } }
    );
}

module.exports = {
    incCmdCount
};