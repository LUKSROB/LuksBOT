// Event handler for when the client is ready

// Import necessary modules
const { registerFont } = require('musicard');
const { updateCache } = require('../../utils/functions/invites');
const { setGuild } = require('../../db/guild');
const { startBirthdayScheduler } = require('../../utils/functions/birthdayScheduler');
const { startBanScheduler } = require('../../utils/functions/banScheduler');
const path = require('path');
const fontPath = path.resolve(__dirname, '../../assets/fonts/YujiSyuku-Regular.ttf');
const GUILD_SYNC_CONCURRENCY = 4;

async function processInBatches(items, batchSize, worker) {
    for (let index = 0; index < items.length; index += batchSize) {
        const batch = items.slice(index, index + batchSize);
        await Promise.all(batch.map((item) => worker(item)));
    }
}

// Export the client ready event handler
module.exports = async (client) => {
    
    client.riffy.init(client.user.id);
    console.log(`Connected to Discord! as ${client.user.username}`);

    client.activityManager?.setDefault();

    await registerFont(fontPath, 'GoogleSans');

    const guilds = [...client.guilds.cache.values()];
    await processInBatches(guilds, GUILD_SYNC_CONCURRENCY, async (guild) => {
        try {
            await setGuild(guild);
        } catch (error) {
            console.error(`[clientReady] No se pudo sincronizar el guild ${guild.id}:`, error);
        }
    });

    await startBirthdayScheduler(client);

    startBanScheduler(client);

    updateCache(client);

};