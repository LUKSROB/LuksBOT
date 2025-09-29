// Handler for command count-related database operations

// Import necessary modules
const User = require('../models/user');

// Function to increment command count for a user in a server
async function incCmdCount(user) {

    const userId = user.id;
    const userName = user.username;

    const userData = await User.findOne({ userId, userName });

    if (userData.commandCount == undefined) {
        await userData.updateOne(
            { userId, userName },
            { $set: { commandCount: 1 } }
        );

        return userData;
    }

    await userData.updateOne(
        { userId, userName },
        { $inc: { commandCount: 1 } }
    );
}

// Export the incCmdCount function for use in other modules
module.exports = {
    incCmdCount
};