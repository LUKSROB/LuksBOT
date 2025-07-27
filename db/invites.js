const Guild = require('../models/guild');
const { getGuild } = require('./guild');

function serializeUser(user) {

    if (!user) console.log(user);
    return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
    };
}

async function setInvites(guildId, invite) {
    
    await Guild.updateOne(
        { guildId },
        { $push: { invites: {
            inviter: serializeUser(invite.inviter), // Guarda el objeto completo
            code: invite.code,
            uses: invite.uses,
        }}},
    );
}

async function getInvites(guildId) {
    let guild = await getGuild(guildId);

    return guild.invites;
}

module.exports = {
    setInvites,
    getInvites
};
