// Function to get or create a user in the database

// Import necessary modules
const User = require('../models/user');

// Function to get or create a user in the database
async function getUser(userId, serverId) {
    let user = await User.findOne({ userId, serverId });

    if (!user) {
        user = new User({
            userId,
            serverId,
        });
        await user.save();
        
    }
        return user;
}

module.exports = {
    getUser
};