// Event handler for when the client is ready

// Import necessary modules
const { registerFont } = require('musicard');
const { updateCache } = require('../../utils/functions/invites');
const { setGuild } = require('../../db/guild');
const { startBirthdayScheduler } = require('../../utils/functions/birthdayScheduler');
const { startBanScheduler } = require('../../utils/functions/banScheduler');
const path = require('path');
const fontPath = path.resolve(__dirname, '../../assets/fonts/YujiSyuku-Regular.ttf');

// Export the client ready event handler
module.exports = async (client) => {
    
    client.riffy.init(client.user.id);
    console.log(`Connected to Discord! as ${client.user.username}`);

    client.activityManager?.setDefault();

    if (client.lavalinkFailover) {
        client.lavalinkFailover.bootstrap().catch((err) => {
            console.error('[Lavalink Failover] Error en bootstrap:', err);
        });
    }

    await registerFont(fontPath, 'GoogleSans');

    client.guilds.cache.map(async guild => {
        await setGuild(guild);
    });

    await startBirthdayScheduler(client);

    startBanScheduler(client);

    updateCache(client);

};