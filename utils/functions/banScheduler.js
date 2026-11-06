// Functions for scheduling automatic unbans in Discord

// Import necessary modules
const mongoose = require('mongoose');
const { EmbedBuilder, DiscordAPIError } = require('discord.js');
const { getDueBans, markBanAsUnbanned } = require('../../db/guild');
const { formatDuration } = require('./convertTime');
const { COLORS } = require('../../config.json');

const CHECK_INTERVAL_MS = 30 * 1000;

let intervalHandle = null;
let running = false;
const warnedMissingGuilds = new Set();

// Function to notify the appropriate channel about an automatic unban
async function notifyAutoUnban(guild, ban, { alreadyUnbanned = false } = {}) {

    if (!ban.channelId) {
        return;
    }

    const channel = guild.channels.cache.get(ban.channelId)
        || await guild.channels.fetch(ban.channelId).catch(() => null);

    if (!channel || !channel.isTextBased()) {
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(alreadyUnbanned ? 'Usuario ya estaba desbaneado' : 'Usuario desbaneado automáticamente')
        .setDescription(
            `**Usuario:** ${ban.userTag || ban.userId}\n` +
            `**ID:** ${ban.userId}\n` +
            `**Razón original:** ${ban.reason}\n` +
            `**Duración:** ${formatDuration(ban.durationSeconds)}\n` +
            `**Fecha de desbaneo:** <t:${Math.floor(Date.now() / 1000)}:F>`
        )
        .setColor(COLORS.SUCCESS);

    await channel.send({ embeds: [embed] }).catch(() => null);

}

// Function to process a due ban and attempt to unban the user
async function processDueBan(client, ban) {

    const guild = client.guilds.cache.get(ban.guildId)
        || await client.guilds.fetch(ban.guildId).catch(() => null);

    if (!guild) {
        const banId = String(ban._id);

        if (!warnedMissingGuilds.has(banId)) {
            console.warn(`[BanScheduler] No se encontró el servidor ${ban.guildId}; se reintentará.`);
            warnedMissingGuilds.add(banId);
        }

        return;
    }

    warnedMissingGuilds.delete(String(ban._id));

    try {
        await guild.bans.remove(ban.userId, 'Desbaneo automático: tiempo cumplido');

        const updatedBan = await markBanAsUnbanned(ban.guildId, ban._id, {
            unbanType: 'automatic',
            unbanReason: 'Tiempo de baneo cumplido',
            unbannedByTag: 'Sistema (automático)'
        });

        if (updatedBan) {
            await notifyAutoUnban(guild, ban);
        }

    } catch (error) {
        if (error instanceof DiscordAPIError && error.code === 10026) {
            const updatedBan = await markBanAsUnbanned(ban.guildId, ban._id, {
                unbanType: 'external',
                unbanReason: 'El usuario ya no estaba baneado en Discord',
                unbannedByTag: 'Fuera del bot / Discord'
            });

            if (updatedBan) {
                await notifyAutoUnban(guild, ban, { alreadyUnbanned: true });
            }

            return;
        }

        console.error(`[BanScheduler] No se pudo desbanear a ${ban.userId} en ${ban.guildId}:`, error);
    }

}

// Function to run the ban schedule, processing all due bans
async function runBanSchedule(client) {

    if (!client?.isReady()) {
        return;
    }

    if (mongoose.connection.readyState !== 1) {
        return;
    }

    const dueBans = await getDueBans();

    for (const ban of dueBans) {
        await processDueBan(client, ban);
    }

}

// Function to start the ban scheduler with a given client instance
function startBanScheduler(client) {

    if (intervalHandle) {
        return intervalHandle;
    }

    const run = async () => {
        if (running) {
            return;
        }

        running = true;

        try {
            await runBanSchedule(client);
        } catch (error) {
            console.error('[BanScheduler] Error revisando los baneos:', error);
        } finally {
            running = false;
        }
    };

    run();
    intervalHandle = setInterval(run, CHECK_INTERVAL_MS);
    intervalHandle.unref?.();

    console.log('Ban scheduler started');
    return intervalHandle;

}

// Export the functions for use in other modules
module.exports = {
    notifyAutoUnban,
    processDueBan,
    runBanSchedule,
    startBanScheduler
};
