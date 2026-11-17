// Event handler for when the client is ready

// Import necessary modules
const { registerFont } = require('musicard');
const { updateCache } = require('../../utils/functions/invites');
const { setGuild, getGuildSettings, updateGuildSettings } = require('../../db/guild');
const { getGuildContentFilter } = require('../../db/contentFilter');
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

// Map config.json keys -> per-guild settings (only used for the main guild migration)
const CONFIG_TO_SETTING = {
    welcomeChannelId: 'WELCOME_CHANNEL',
    goodbyeChannelId: 'GOODBYE_CHANNEL',
    birthdayChannelId: 'BIRTHDAY_CHANNEL',
    birthdayRoleId: 'BIRTHDAY_ROLE',
    ticketChannelId: 'TICKET_CHANNEL',
    ticketLogChannelId: 'TICKETS_ID',
    ticketPanelMessageId: 'TICKET_MESSAGE',
    modRoleId: 'MOD_ROLE'
};

// Migrate legacy config.json values into the guild document (main guild only, once)
async function seedGuildSettingsFromConfig(guildId, config) {
    const current = await getGuildSettings(guildId);
    const seed = {};

    for (const [settingKey, configKey] of Object.entries(CONFIG_TO_SETTING)) {
        const value = config[configKey];
        if (value && !current[settingKey]) {
            seed[settingKey] = value;
        }
    }

    if (Object.keys(seed).length > 0) {
        await updateGuildSettings(guildId, seed);
    }
}

// Export the client ready event handler
module.exports = async (client) => {
    
    client.riffy.init(client.user.id);
    console.log(`Connected to Discord! as ${client.user.username}`);

    client.activityManager?.setDefault();

    await registerFont(fontPath, 'GoogleSans');

    const guilds = [...client.guilds.cache.values()];
    const config = require('../../config.json');
    
    // Inicializar filtros por defecto para cada guild
    const defaultFilterConfig = {
        words: config.WORDS_FILTER || [],
        webs: config.WEBS_FILTER || []
    };

    await processInBatches(guilds, GUILD_SYNC_CONCURRENCY, async (guild) => {
        try {
            await setGuild(guild);
            // Asegurar que el guild tenga configuración de filtro
            await getGuildContentFilter(guild.id, defaultFilterConfig);

            // Migrar una sola vez los valores legacy de config.json al guild principal
            if (config.GUILD_ID && guild.id === config.GUILD_ID) {
                await seedGuildSettingsFromConfig(guild.id, config);
            }
        } catch (error) {
            console.error(`[clientReady] No se pudo sincronizar el guild ${guild.id}:`, error);
        }
    });

    await startBirthdayScheduler(client);

    startBanScheduler(client);

    updateCache(client);

};