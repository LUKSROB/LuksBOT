// Handler for invite-related database operations

// Import necessary modules
const Guild = require('../models/guild');
const { getGuild } = require('./guild');

// Function to serialize user data for invites
function serializeUser(user) {

    if (!user) console.log(user);
    return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
    };
}

// Function to set invites for a guild
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

// Function to get invites for a guild
async function getInvites(guildId) {
    let guild = await getGuild(guildId);

    return guild.invites;
}

// Export the functions for use in other modules
module.exports = {
    setInvites,
    getInvites
};
