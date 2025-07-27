// Handler for user-related database operations

// Import necessary modules
const User = require('../models/user');

// Function to get or create a user in the database
async function getUser(userId) {
    let user = await User.findOne({ userId });

    if (!user) {
        user = new User({
            userId,
        });
        await user.save();
        
    }
        return user;
}

// Export the getUser function for use in other modules
module.exports = {
    getUser
};