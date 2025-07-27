// Event handler for when a guild member leaves

// Import necessary modules
const messages = require('../utils/functions/messages');
const { GOODBYE_CHANNEL } = require('../config.json');

// Export the guildMemberRemove event handler
module.exports = async (member) => {

    const { guild } = member;
    const channel = await guild.channels.fetch(GOODBYE_CHANNEL);
    if (channel) {
        await channel.send(messages.goodbyeMessage(member));
    }
    
}