// Event handler for when a guild member leaves

// Import necessary modules
const messages = require('../../utils/functions/messages');
const { getGuildSettings } = require('../../db/guild');

// Export the guild member remove event handler
module.exports = async (member) => {

    const { guild } = member;

    const settings = await getGuildSettings(guild.id);
    if (!settings.goodbyeChannelId) {
        return;
    }

    const channel = await guild.channels.fetch(settings.goodbyeChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
        console.warn(`[guildMemberRemove] Canal de despedida inválido o no accesible: ${settings.goodbyeChannelId}`);
        return;
    }

    await channel.send(messages.goodbyeMessage(member));
    
}