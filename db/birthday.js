const User = require('../models/user')

async function setBirthday(serverId, userId, birthday) {
        const [day, month, year] = birthday.birthday;
        await User.updateOne(
            { serverId, userId },
            { $set: { birthday: [day, month, year] } },
        );
}

async function getBirthday(serverId, userId) {
    let user = await User.findOne({ serverId, userId });

    return user ? user.birthday : undefined;
}

async function delBirthday(serverId, userId) {
    await User.updateOne(
        { serverId, userId },
        { $set: { birthday: [] } }
    );
}

module.exports = {
    setBirthday,
    getBirthday,
    delBirthday
};
