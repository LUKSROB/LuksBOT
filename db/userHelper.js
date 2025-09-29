// Handler for user-related database operations

// Import necessary modules
const User = require('../models/user');

// Function to get or create a user in the database
async function getUser(user) {
    const userId = user.id;
    const userName = user.username;
    let userData = await User.findOne({ userId, userName });

    if (!userData) {
        userData = new User({
            userId,
            userName
        });
        await userData.save();

    }
    return userData;
}

// Export the getUser function for use in other modules
module.exports = {
    getUser
};