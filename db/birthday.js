const Guild = require('../models/guild');
const User = require('../models/user');

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function normalizeBirthdayInput(birthday) {
    const day = Number(birthday.day);
    const month = Number(birthday.month);
    const year = Number(birthday.year);

    return { day, month, year };
}

function isValidBirthday(day, month, year) {
    const date = new Date(year, month - 1, day);

    return (
        Number.isInteger(day) &&
        Number.isInteger(month) &&
        Number.isInteger(year) &&
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function getNextOccurrenceDate(day, month, fromDate = new Date()) {
    const year = fromDate.getUTCFullYear();
    const isFeb29 = day === 29 && month === 2;
    const safeDay = isFeb29 && !isLeapYear(year) ? 28 : day;

    let occurrence = new Date(Date.UTC(year, month - 1, safeDay, 0, 0, 0, 0));
    const startToday = new Date(Date.UTC(
        fromDate.getUTCFullYear(),
        fromDate.getUTCMonth(),
        fromDate.getUTCDate(),
        0,
        0,
        0,
        0
    ));

    if (occurrence < startToday) {
        const nextYear = year + 1;
        const nextSafeDay = isFeb29 && !isLeapYear(nextYear) ? 28 : day;
        occurrence = new Date(Date.UTC(nextYear, month - 1, nextSafeDay, 0, 0, 0, 0));
    }

    return occurrence;
}

async function ensureGuildRecord(guildId) {
    await Guild.updateOne(
        { guildId },
        { $setOnInsert: { guildId, guildName: 'Unknown Guild' } },
        { upsert: true }
    );
}

async function ensureUserRecord(userId, userName, guildId) {
    const existing = await User.findOne({ userId, userName, guildId });

    if (existing) {
        if (userName && existing.userName !== userName) {
            existing.userName = userName;
            await existing.save();
        }
        return existing;
    }

    const user = new User({
        userId,
        userName: userName || `user-${userId}`,
        guildId,
        birthdays: [],
        birthday: []
    });
    await user.save();
    return user;
}

function getGuildBirthdayEntry(user, guildId) {
    const birthdays = Array.isArray(user.birthdays) ? user.birthdays : [];
    const index = birthdays.findIndex((entry) => entry.guildId === guildId);
    return { birthdays, index };
}

async function setBirthday( userId, userName, guildId, birthday) {
    const { day, month, year } = normalizeBirthdayInput(birthday);

    if (!isValidBirthday(day, month, year)) {
        throw new Error('Invalid birthday date');
    }

    await ensureGuildRecord(guildId);

    const user = await ensureUserRecord(userId, userName, guildId);
    const { birthdays, index } = getGuildBirthdayEntry(user, guildId);

    const currentLastCelebratedYear = index >= 0
        ? birthdays[index].lastCelebratedYear ?? null
        : null;

    const nextEntry = {
        guildId,
        day,
        month,
        year,
        lastCelebratedYear: currentLastCelebratedYear
    };

    if (index >= 0) {
        birthdays[index] = nextEntry;
    } else {
        birthdays.push(nextEntry);
    }

    user.birthdays = birthdays;
    user.birthday = [day, month, year];

    await user.save();
}

async function getBirthday( userId, userName, guildId) {
    const user = await User.findOne({ userId, userName, guildId }).lean();
    if (!user || !Array.isArray(user.birthday)) {
        return undefined;
    }

    return user.birthday;
}

async function delBirthday( userId, userName, guildId) {
    const user = await User.findOne({ userId, userName, guildId });
    if (!user) {
        return;
    }

    const birthdays = Array.isArray(user.birthdays) ? user.birthdays : [];
    const filtered = birthdays.filter((birthday) => birthday.guildId !== guildId);

    user.birthdays = filtered;
    user.birthday = [];

    await user.save();
}

async function getUpcomingBirthdays(guildId, limit = 10) {
    const users = await User.find(
        { 'birthdays.guildId': guildId },
        { userId: 1, userName: 1, birthdays: 1 }
    ).lean();

    const now = new Date();
    const upcoming = [];

    for (const user of users) {
        const birthdays = Array.isArray(user.birthdays) ? user.birthdays : [];

        for (const birthday of birthdays) {
            if (birthday.guildId !== guildId) {
                continue;
            }

            const nextBirthday = getNextOccurrenceDate(birthday.day, birthday.month, now);
            const diffMs = nextBirthday.getTime() - now.getTime();
            const daysUntil = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

            upcoming.push({
                userId: user.userId,
                userName: user.userName,
                guildId,
                day: birthday.day,
                month: birthday.month,
                year: birthday.year,
                lastCelebratedYear: birthday.lastCelebratedYear ?? null,
                nextBirthday,
                daysUntil: Math.max(0, daysUntil)
            });
        }
    }

    return upcoming
        .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
        .slice(0, limit);
}

async function getBirthdaysByDate(day, month, guildId) {
    const query = guildId
        ? { birthdays: { $elemMatch: { guildId, day, month } } }
        : { birthdays: { $elemMatch: { day, month } } };

    const users = await User.find(query, { userId: 1, userName: 1, birthdays: 1 }).lean();
    const records = [];

    for (const user of users) {
        const birthdays = Array.isArray(user.birthdays) ? user.birthdays : [];
        for (const birthday of birthdays) {
            if (birthday.day !== day || birthday.month !== month) {
                continue;
            }

            if (guildId && birthday.guildId !== guildId) {
                continue;
            }

            records.push({
                userId: user.userId,
                userName: user.userName,
                guildId: birthday.guildId,
                day: birthday.day,
                month: birthday.month,
                year: birthday.year,
                lastCelebratedYear: birthday.lastCelebratedYear ?? null
            });
        }
    }

    return records;
}

async function markBirthdayCelebrated(userId, userName, guildId, year) {
    await User.updateOne(
        { userId, userName, 'birthdays.guildId': guildId },
        { $set: { 'birthdays.$[target].lastCelebratedYear': year } },
        { arrayFilters: [{ 'target.guildId': guildId }] }
    );
}

async function getBirthdaySettings(guildId) {
    const guild = await Guild.findOne({ guildId }).lean();
    if (!guild) {
        return { birthdayRoleId: null, birthdayChannelId: null };
    }

    return {
        birthdayRoleId: guild.birthdayRoleId || null,
        birthdayChannelId: guild.birthdayChannelId || null
    };
}

async function getBirthdayRole(guildId) {
    const settings = await getBirthdaySettings(guildId);
    return settings.birthdayRoleId;
}

async function setBirthdayRole(guildId, roleId) {
    await Guild.updateOne(
        { guildId },
        { $set: { birthdayRoleId: roleId } },
        { upsert: true }
    );
}

async function clearBirthdayRole(guildId) {
    await Guild.updateOne(
        { guildId },
        { $unset: { birthdayRoleId: 1 } },
        { upsert: true }
    );
}

async function setBirthdayChannel(guildId, channelId) {
    await Guild.updateOne(
        { guildId },
        { $set: { birthdayChannelId: channelId } },
        { upsert: true }
    );
}

async function clearBirthdayChannel(guildId) {
    await Guild.updateOne(
        { guildId },
        { $unset: { birthdayChannelId: 1 } },
        { upsert: true }
    );
}

module.exports = {
    setBirthday,
    getBirthday,
    delBirthday,
    getUpcomingBirthdays,
    getBirthdaysByDate,
    markBirthdayCelebrated,
    getBirthdaySettings,
    getBirthdayRole,
    setBirthdayRole,
    clearBirthdayRole,
    setBirthdayChannel,
    clearBirthdayChannel,
};
