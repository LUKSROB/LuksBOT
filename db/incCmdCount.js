// Handler for command count-related database operations

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

// Export the incCmdCount function for use in other modules
module.exports = {
    incCmdCount
};