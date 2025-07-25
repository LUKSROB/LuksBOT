const User = require('../models/user')

async function setBirthday(serverId, userId, birthday) {
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

async function getBirthday(userId) {
    let user = await User.findOne({ userId });

    return user ? user.birthday : undefined;
}

async function delBirthday( userId) {
    await User.updateOne(
        { userId },
        { $set: { birthday: [] } }
    );
}

module.exports = {
    setBirthday,
    getBirthday,
    delBirthday
};
