// Handler for managing bot activity/presence

// Import necessary modules
const { ActivityType } = require('discord.js');
const config = require('../../config.json');

const MAX_ACTIVITY_NAME_LENGTH = 128;

const SOURCE_PRIORITY = {
    default: 0,
    music: 10,
    game: 20,
};

// Function to trim activity names to a maximum length
function trimActivityName(text) {

    const clean = String(text ?? '').replace(/\s+/g, ' ').trim();

    if (!clean) return 'LuksBot';

    return clean.length > MAX_ACTIVITY_NAME_LENGTH
        ? `${clean.slice(0, MAX_ACTIVITY_NAME_LENGTH - 1)}…`
        : clean;

}

// Class to manage and update the bot's activity/presence
class ActivityManager {

    constructor(client, options = {}) {
        this.client = client;
        this.status = options.status || 'online';
        this.debounceMs = options.debounceMs ?? 700;

        this.defaultActivity = {
            name: trimActivityName(options.defaultName || 'LuksBot'),
            type: options.defaultType ?? ActivityType.Watching,
            url: options.defaultUrl || null,
            priority: SOURCE_PRIORITY.default,
            updatedAt: 0,
            source: 'default',
        };

        this.sources = new Map();
        this.timer = null;
        this.lastSignature = null;
    }

    setDefault(activity = {}) {
        this.defaultActivity = {
            ...this.defaultActivity,
            ...activity,
            name: trimActivityName(activity.name ?? this.defaultActivity.name),
            priority: SOURCE_PRIORITY.default,
            updatedAt: Date.now(),
            source: 'default',
        };

        this.scheduleApply();
        return this.defaultActivity;
    }

    setMusic(guildId, track, options = {}) {
        const info = track?.info ?? track ?? {};
        const title = info.title || options.title || 'Música';
        const author = info.author || options.author || null;

        const name = options.name || (author ? `${title} — ${author}` : title);

        return this.setSource(`music:${guildId}`, {
            source: 'music',
            guildId,
            name,
            type: options.type ?? ActivityType.Listening,
            url: options.url || null,
        });
    }

    clearMusic(guildId) {
        return this.clearSource(`music:${guildId}`);
    }

    setGame(guildId, gameId, options = {}) {
        return this.setSource(`game:${guildId}:${gameId}`, {
            source: 'game',
            guildId,
            gameId,
            name: options.name || 'Tic Tac Toe',
            type: options.type ?? ActivityType.Playing,
            url: options.url || null,
        });
    }

    clearGame(guildId, gameId) {
        return this.clearSource(`game:${guildId}:${gameId}`);
    }

    clearGuild(guildId) {
        let changed = false;

        for (const [key, source] of this.sources) {
            if (source.guildId === guildId) {
                this.sources.delete(key);
                changed = true;
            }
        }

        if (changed) this.scheduleApply();
        return changed;
    }

    clearAll() {
        if (this.sources.size === 0) return;

        this.sources.clear();
        this.scheduleApply();
    }

    setSource(key, activity) {
        const source = {
            ...activity,
            name: trimActivityName(activity.name),
            priority: activity.priority ?? SOURCE_PRIORITY[activity.source] ?? 0,
            updatedAt: Date.now(),
        };

        this.sources.set(key, source);
        this.scheduleApply();
        return source;
    }

    clearSource(key) {
        const changed = this.sources.delete(key);

        if (changed) this.scheduleApply();
        return changed;
    }

    getActiveActivity() {
        let best = this.defaultActivity;

        for (const source of this.sources.values()) {
            if (
                source.priority > best.priority ||
                (source.priority === best.priority && source.updatedAt > best.updatedAt)
            ) {
                best = source;
            }
        }

        return best;
    }

    scheduleApply() {
        if (!this.client.user) return;

        if (this.timer) clearTimeout(this.timer);

        this.timer = setTimeout(() => {
            this.timer = null;
            this.apply();
        }, this.debounceMs);
    }

    apply() {
        if (!this.client.user) return;

        const activity = this.getActiveActivity();

        const payload = {
            name: trimActivityName(activity.name),
            type: activity.type ?? ActivityType.Watching,
        };

        if (payload.type === ActivityType.Streaming) {
            payload.url = activity.url || config.TWITCH;
        }

        const signature = `${payload.type}|${payload.name}|${payload.url || ''}`;

        if (signature === this.lastSignature) return;
        this.lastSignature = signature;

        try {
            this.client.user.setPresence({
                status: this.status,
                activities: [payload],
            });
        } catch (error) {
            console.error('[Activity] No se pudo actualizar la actividad:', error);
        }
    }

}

// Function to create an ActivityManager instance
function createActivityManager(client, options) {

    return new ActivityManager(client, options);

}

// Export the functions for use in other modules
module.exports = {
    ActivityManager,
    createActivityManager,
    trimActivityName,
};