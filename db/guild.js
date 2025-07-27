const Guild = require('../models/guild');

async function setGuild(guild) {

        let guildData = await Guild.findOne({ guildId: guild.id });

        if (!guildData) {
            guildData = new Guild({
                guildId: guild.id,
                guildName: guild.name
            });
            await guildData.save();

        }
}

async function getGuild(guildId) {
    let guild = await Guild.findOne({ guildId });

    return guild ? guild : undefined;
}

async function updateGuild(guildId, data) {
    await Guild.updateOne(
        { guildId },
        { $set: data }
    );
}

module.exports = {
    setGuild,
    getGuild,
    updateGuild
};