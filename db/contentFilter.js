// Database utilities for guild content filter configuration

// Import necessary modules
const Guild = require('../models/guild');
const { createContentFilter } = require('../utils/functions/contentFilter');

// Retrieves the content filter configuration for a guild, creating it if it doesn't exist
/**
 * @param {string} guildId
 * @param {object} defaultConfig
 * @returns {Promise<object>}
 */
async function getGuildContentFilter(guildId, defaultConfig = {}) {
    try {
        let guild = await Guild.findOne({ guildId });

        if (!guild) {
            guild = new Guild({
                guildId,
                guildName: guildId,
                contentFilter: {
                    enabled: true,
                    words: defaultConfig.words || [],
                    webs: defaultConfig.webs || [],
                    updatedAt: new Date()
                }
            });
            await guild.save();
        }

        if (!guild.contentFilter) {
            guild.contentFilter = {
                enabled: true,
                words: defaultConfig.words || [],
                webs: defaultConfig.webs || [],
                updatedAt: new Date()
            };
            await guild.save();
        }

        return guild.contentFilter;
    } catch (error) {
        console.error(`[ContentFilter] Error obteniendo configuración para guild ${guildId}:`, error.message);
        return {
            enabled: true,
            words: defaultConfig.words || [],
            webs: defaultConfig.webs || []
        };
    }
}

// Updates the content filter configuration for a guild
/**
 * @param {string} guildId
 * @param {object} filterConfig
 * @returns {Promise<object>}
 */
async function updateGuildContentFilter(guildId, filterConfig = {}) {
    try {
        const updateData = {
            'contentFilter.enabled': filterConfig.enabled !== undefined ? filterConfig.enabled : true,
            'contentFilter.words': Array.isArray(filterConfig.words) ? filterConfig.words : [],
            'contentFilter.webs': Array.isArray(filterConfig.webs) ? filterConfig.webs : [],
            'contentFilter.updatedAt': new Date()
        };

        const guild = await Guild.findOneAndUpdate(
            { guildId },
            { $set: updateData },
            { new: true, upsert: true }
        );

        return guild.contentFilter;
    } catch (error) {
        console.error(`[ContentFilter] Error actualizando filtro para guild ${guildId}:`, error.message);
        throw error;
    }
}

// Adds a word to the content filter for a guild
/**
 * @param {string} guildId
 * @param {string} word
 * @returns {Promise<object>}
 */
async function addWordToFilter(guildId, word) {
    try {
        const normalized = String(word || '').trim().toLowerCase();
        if (!normalized) return null;

        const guild = await Guild.findOneAndUpdate(
            { guildId },
            {
                $addToSet: { 'contentFilter.words': normalized },
                $set: { 'contentFilter.updatedAt': new Date() }
            },
            { new: true, upsert: true }
        );

        return guild.contentFilter;
    } catch (error) {
        console.error(`[ContentFilter] Error agregando palabra para guild ${guildId}:`, error.message);
        throw error;
    }
}

// Removes a word from the content filter for a guild
/**
 * @param {string} guildId
 * @param {string} word
 * @returns {Promise<object>}
 */
async function removeWordFromFilter(guildId, word) {
    try {
        const normalized = String(word || '').trim().toLowerCase();
        if (!normalized) return null;

        const guild = await Guild.findOneAndUpdate(
            { guildId },
            {
                $pull: { 'contentFilter.words': normalized },
                $set: { 'contentFilter.updatedAt': new Date() }
            },
            { new: true }
        );

        return guild?.contentFilter;
    } catch (error) {
        console.error(`[ContentFilter] Error removiendo palabra para guild ${guildId}:`, error.message);
        throw error;
    }
}

// Adds a web to the content filter for a guild
/**
 * @param {string} guildId
 * @param {string} web
 * @returns {Promise<object>}
 */
async function addWebToFilter(guildId, web) {
    try {
        const normalized = String(web || '').trim().toLowerCase();
        if (!normalized) return null;

        const guild = await Guild.findOneAndUpdate(
            { guildId },
            {
                $addToSet: { 'contentFilter.webs': normalized },
                $set: { 'contentFilter.updatedAt': new Date() }
            },
            { new: true, upsert: true }
        );

        return guild.contentFilter;
    } catch (error) {
        console.error(`[ContentFilter] Error agregando web para guild ${guildId}:`, error.message);
        throw error;
    }
}

// Removes a web from the content filter for a guild
/**
 * @param {string} guildId
 * @param {string} web
 * @returns {Promise<object>}
 */
async function removeWebFromFilter(guildId, web) {
    try {
        const normalized = String(web || '').trim().toLowerCase();
        if (!normalized) return null;

        const guild = await Guild.findOneAndUpdate(
            { guildId },
            {
                $pull: { 'contentFilter.webs': normalized },
                $set: { 'contentFilter.updatedAt': new Date() }
            },
            { new: true }
        );

        return guild?.contentFilter;
    } catch (error) {
        console.error(`[ContentFilter] Error removiendo web para guild ${guildId}:`, error.message);
        throw error;
    }
}

// Compiles the content filter for a guild based on its configuration
/**
 * @param {object} filterConfig
 * @returns {object|null}
 */
function compileGuildFilter(filterConfig = {}) {
    if (!filterConfig.enabled) {
        return null;
    }

    return createContentFilter(filterConfig.words || [], filterConfig.webs || []);
}

// Exports the content filter functions for use in other modules
module.exports = {
    getGuildContentFilter,
    updateGuildContentFilter,
    addWordToFilter,
    removeWordFromFilter,
    addWebToFilter,
    removeWebFromFilter,
    compileGuildFilter
};
