// birthday: Handler for birthday-related database operations

// Import necessary modules
const Guild = require('../models/guild');
const User = require('../models/user');

// Function to check if a year is a leap year
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Function to normalize birthday input into day, month, and year
function normalizeBirthdayInput(birthday) {
    const day = Number(birthday.day);
    const month = Number(birthday.month);
    const year = Number(birthday.year);

    return { day, month, year };
}

// Function to validate if the given day, month, and year form a valid date
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

// Function to get the next occurrence date of a birthday
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

// Function to ensure a guild record exists in the database
async function ensureGuildRecord(guildId) {
    await Guild.updateOne(
        { guildId },
        { $setOnInsert: { guildId, guildName: 'Unknown Guild' } },
        { upsert: true }
    );
}

// Function to ensure a user record exists in the database
async function ensureUserRecord(userId, userName, guildId) {
    const existing = await User.findOne({ userId, guildId });

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

// Function to get the birthday entry for a user in a specific guild
function getGuildBirthdayEntry(user, guildId) {
    const birthdays = Array.isArray(user.birthdays) ? user.birthdays : [];
    const index = birthdays.findIndex((entry) => entry.guildId === guildId);
    return { birthdays, index };
}

// Function to get the birthday of a user in a specific guild
function getBirthdayFromUser(user, guildId) {
    if (!user) {
        return null;
    }

    const birthdays = Array.isArray(user.birthdays) ? user.birthdays : [];
    const guildBirthday = birthdays.find((entry) => entry.guildId === guildId);
    if (
        guildBirthday &&
        Number.isInteger(guildBirthday.day) &&
        Number.isInteger(guildBirthday.month) &&
        Number.isInteger(guildBirthday.year)
    ) {
        return {
            day: guildBirthday.day,
            month: guildBirthday.month,
            year: guildBirthday.year,
            lastCelebratedYear: guildBirthday.lastCelebratedYear ?? null
        };
    }

    if (
        Array.isArray(user.birthday) &&
        user.birthday.length >= 3 &&
        Number.isInteger(Number(user.birthday[0])) &&
        Number.isInteger(Number(user.birthday[1])) &&
        Number.isInteger(Number(user.birthday[2]))
    ) {
        return {
            day: Number(user.birthday[0]),
            month: Number(user.birthday[1]),
            year: Number(user.birthday[2]),
            lastCelebratedYear: null
        };
    }

    return null;
}

// Function to set the birthday of a user in a specific guild
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

// Function to get the birthday of a user in a specific guild
async function getBirthday( userId, userName, guildId) {
    const user = await User.findOne({ userId, guildId }).lean();
    const birthday = getBirthdayFromUser(user, guildId);

    if (!birthday) {
        return undefined;
    }

    return [birthday.day, birthday.month, birthday.year];
}

// Function to delete the birthday of a user in a specific guild
async function delBirthday( userId, userName, guildId) {
    const user = await User.findOne({ userId, guildId });
    if (!user) {
        return;
    }

    const birthdays = Array.isArray(user.birthdays) ? user.birthdays : [];
    const filtered = birthdays.filter((birthday) => birthday.guildId !== guildId);

    user.birthdays = filtered;
    user.birthday = [];

    await user.save();
}

// Function to get upcoming birthdays in a specific guild
async function getUpcomingBirthdays(guildId, limit = 10) {
    const users = await User.find(
        { guildId },
        { userId: 1, userName: 1, guildId: 1, birthdays: 1, birthday: 1 }
    ).lean();

    const now = new Date();
    const startTodayUtc = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0
    ));
    const upcomingByUser = new Map();

    for (const user of users) {
        const birthday = getBirthdayFromUser(user, guildId);
        if (!birthday) {
            continue;
        }

        const nextBirthday = getNextOccurrenceDate(birthday.day, birthday.month, now);
        const diffMs = nextBirthday.getTime() - startTodayUtc.getTime();
        const daysUntil = Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
        const nextItem = {
            userId: user.userId,
            userName: user.userName,
            guildId,
            day: birthday.day,
            month: birthday.month,
            year: birthday.year,
            lastCelebratedYear: birthday.lastCelebratedYear ?? null,
            nextBirthday,
            daysUntil: Math.max(0, daysUntil)
        };

        const existing = upcomingByUser.get(user.userId);
        if (!existing) {
            upcomingByUser.set(user.userId, nextItem);
            continue;
        }

        if (
            nextItem.nextBirthday.getTime() < existing.nextBirthday.getTime() ||
            (nextItem.nextBirthday.getTime() === existing.nextBirthday.getTime() &&
                String(nextItem.userName || '').length > String(existing.userName || '').length)
        ) {
            upcomingByUser.set(user.userId, nextItem);
        }
    }

    return [...upcomingByUser.values()]
        .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
        .slice(0, limit);
}

// Function to get birthdays by a specific date in a guild
async function getBirthdaysByDate(day, month, guildId) {
    const query = guildId ? { guildId } : {};
    const users = await User.find(query, { userId: 1, userName: 1, guildId: 1, birthdays: 1, birthday: 1 }).lean();
    const records = [];

    for (const user of users) {
        const birthday = getBirthdayFromUser(user, guildId || user.guildId);
        if (!birthday) {
            continue;
        }
        if (birthday.day === day && birthday.month === month) {
            records.push({
                userId: user.userId,
                userName: user.userName,
                guildId: guildId || user.guildId,
                day: birthday.day,
                month: birthday.month,
                year: birthday.year,
                lastCelebratedYear: birthday.lastCelebratedYear ?? null
            });
        }
    }

    return records;
}

// Function to mark a user's birthday as celebrated for a specific year
async function markBirthdayCelebrated(userId, userName, guildId, year) {
    await User.updateOne(
        { userId, guildId, 'birthdays.guildId': guildId },
        { $set: { 'birthdays.$[target].lastCelebratedYear': year } },
        { arrayFilters: [{ 'target.guildId': guildId }] }
    );
}

// Function to get the birthday settings for a guild
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

// Function to get the birthday role for a guild
async function getBirthdayRole(guildId) {
    const settings = await getBirthdaySettings(guildId);
    return settings.birthdayRoleId;
}

// Function to set the birthday role for a guild
async function setBirthdayRole(guildId, roleId) {
    await Guild.updateOne(
        { guildId },
        { $set: { birthdayRoleId: roleId } },
        { upsert: true }
    );
}

// Function to clear the birthday role for a guild
async function clearBirthdayRole(guildId) {
    await Guild.updateOne(
        { guildId },
        { $unset: { birthdayRoleId: 1 } },
        { upsert: true }
    );
}

// Function to set the birthday channel for a guild
async function setBirthdayChannel(guildId, channelId) {
    await Guild.updateOne(
        { guildId },
        { $set: { birthdayChannelId: channelId } },
        { upsert: true }
    );
}

// Function to clear the birthday channel for a guild
async function clearBirthdayChannel(guildId) {
    await Guild.updateOne(
        { guildId },
        { $unset: { birthdayChannelId: 1 } },
        { upsert: true }
    );
}

// Export the birthday functions for use in other modules
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
