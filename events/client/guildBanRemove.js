// Event handler for bans removed outside the bot

// Import necessary modules
const { getActiveBan, markBanAsUnbanned } = require('../../db/guild');

// Export the guild ban remove event handler
module.exports = async (ban) => {

    try {
        const activeBan = await getActiveBan(ban.guild.id, ban.user.id);

        if (!activeBan) {
            return;
        }

        setTimeout(async () => {
            try {
                await markBanAsUnbanned(ban.guild.id, activeBan._id, {
                    unbanType: 'external',
                    unbanReason: 'Desbaneo manual detectado fuera del bot',
                    unbannedByTag: 'Fuera del bot / Discord'
                });
            } catch (error) {
                console.error('[guildBanRemove] No se pudo actualizar el registro del baneo:', error);
            }
        }, 3000);
    } catch (error) {
        console.error('[guildBanRemove] Error buscando el registro del baneo:', error);
    }
    
};
