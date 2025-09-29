// Handler for command count-related database operations

// Import necessary modules
const User = require('../models/user');

// Function to increment command count for a user in a server
async function incCmdCount(user) {

    const userId = user.id;
    const userName = user.username;

    const user = await User.findOne({ userId, userName });

    if (user.commandCount == undefined) {
        await user.updateOne(
            { userId, userName },
            { $set: { commandCount: 1 } }
        );

        return user;
    }

    await user.updateOne(
        { userId, userName },
        { $inc: { commandCount: 1 } }
    );
}

// Export the incCmdCount function for use in other modules
module.exports = {
    incCmdCount
};