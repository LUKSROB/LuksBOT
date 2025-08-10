// Handler for birthday-related database operations

// Import necessary modules
const User = require('../models/user')

// Function to set or update a user's birthday in the database
async function setBirthday(userId, birthday) {
        const day = birthday.birthday[0];
        const month = birthday.birthday[1];
        const year = birthday.birthday[2];
        
        const userDate = await User.findOne({ userId });

        if (userDate.birthday) {
            await User.updateOne(
                { userId },
                { $set: { birthday: [] } },
            );
        }

        await User.updateOne(
            { userId },
            { $set: { birthday: [day, month, year] } },
        );
}

// Function to get a user's birthday from the database
async function getBirthday(userId) {
    let user = await User.findOne({ userId });

    return user ? user.birthday : undefined;
}

// Function to delete a user's birthday from the database
async function delBirthday(userId) {
    await User.updateOne(
        { userId },
        { $set: { birthday: [] } }
    );
}

// Export the functions for use in other modules
module.exports = {
    setBirthday,
    getBirthday,
    delBirthday
};
