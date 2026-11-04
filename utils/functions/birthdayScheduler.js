const { once } = require('events');
const mongoose = require('mongoose');
const { Agenda } = require('agenda');
const { MongoBackend } = require('@agendajs/mongo-backend');
const { getBirthdaysByDate, getBirthdaySettings, markBirthdayCelebrated } = require('../../db/birthday');

let agendaInstance;
let agendaStartPromise;
let botClient;

function getTodayUTC() {
    const now = new Date();

    return {
        day: now.getUTCDate(),
        month: now.getUTCMonth() + 1,
        year: now.getUTCFullYear()
    };
}

async function waitForMongooseConnection() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (mongoose.connection.readyState === 3) {
        throw new Error('MongoDB is disconnecting, cannot start birthday scheduler');
    }

    await once(mongoose.connection, 'connected');
}

async function syncBirthdayRoleForGuild(guild, birthdayRoleId, birthdayRecords, currentYear) {
    if (!birthdayRoleId) {
        return;
    }

    const role = guild.roles.cache.get(birthdayRoleId) || await guild.roles.fetch(birthdayRoleId).catch(() => null);
    if (!role) {
        return;
    }

    const todayBirthdayIds = new Set(birthdayRecords.map((record) => record.userId));

    for (const member of role.members.values()) {
        if (!todayBirthdayIds.has(member.id)) {
            await member.roles.remove(role, 'Retiro automático de rol de cumpleaños').catch(() => null);
        }
    }

    for (const record of birthdayRecords) {
        const member = await guild.members.fetch(record.userId).catch(() => null);
        if (!member) {
            continue;
        }

        if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role, 'Asignación automática de rol de cumpleaños').catch(() => null);
        }
    }
}

async function sendBirthdayMessages(guild, birthdayChannelId, birthdayRecords, currentYear) {
    if (!birthdayChannelId) {
        return;
    }

    const channel = guild.channels.cache.get(birthdayChannelId) || await guild.channels.fetch(birthdayChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
        return;
    }

    for (const record of birthdayRecords) {
        if (record.lastCelebratedYear === currentYear) {
            continue;
        }

        await channel.send(`🎉 ¡Feliz cumpleaños <@${record.userId}>!`).catch(() => null);
        await markBirthdayCelebrated(record.userId, record.userName, record.guildId, currentYear);
    }
}

async function processGuildBirthdays(guildId, currentDate) {
    const guild = await botClient.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
        return;
    }

    const settings = await getBirthdaySettings(guildId);
    const birthdayRecords = await getBirthdaysByDate(currentDate.day, currentDate.month, guildId);

    await syncBirthdayRoleForGuild(guild, settings.birthdayRoleId, birthdayRecords, currentDate.year);
    await sendBirthdayMessages(guild, settings.birthdayChannelId, birthdayRecords, currentDate.year);

    if (!settings.birthdayChannelId) {
        for (const record of birthdayRecords) {
            if (record.lastCelebratedYear !== currentDate.year) {
                await markBirthdayCelebrated(record.guildId, record.userId, currentDate.year);
            }
        }
    }
}

async function runBirthdaySchedule() {
    if (!botClient || !botClient.isReady()) {
        return;
    }

    const currentDate = getTodayUTC();
    const guildIds = [...botClient.guilds.cache.keys()];

    for (const guildId of guildIds) {
        await processGuildBirthdays(guildId, currentDate);
    }
}

async function startBirthdayScheduler(client) {
    botClient = client;

    if (agendaInstance) {
        return agendaInstance;
    }

    if (agendaStartPromise) {
        return agendaStartPromise;
    }

    agendaStartPromise = (async () => {
        await waitForMongooseConnection();

        agendaInstance = new Agenda({
            backend: new MongoBackend({ mongo: mongoose.connection.db }),
            processEvery: '1 minute'
        });

        agendaInstance.define('birthday:daily-sync', async () => {
            await runBirthdaySchedule();
        });

        await agendaInstance.every('5 0 * * *', 'birthday:daily-sync', null, { timezone: 'UTC' });
        await agendaInstance.start();
        await runBirthdaySchedule();

        console.log('Birthday scheduler started with Agenda.js');
        return agendaInstance;
    })();

    return agendaStartPromise;
}

module.exports = {
    startBirthdayScheduler,
    runBirthdaySchedule
};
