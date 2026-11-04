// Handler for user-related database operations

// Import necessary modules
const User = require('../models/user');

// Function to get or create a user in the database
async function getUser(userId, userName, guildId) {
    let userData = await User.findOne({ userId, userName, guildId });

    if (!userData) {
        userData = new User({
            userId,
            userName,
            guildId,
            lastInteractionAt: new Date()
        });
        await userData.save();
        return userData;
    }

    userData.lastInteractionAt = new Date();
    await userData.save();

    return userData;
}

// Export the getUser function for use in other modules
module.exports = {
    getUser
};