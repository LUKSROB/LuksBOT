// Functions for handling birthdays in the server

// Import necessary modules
const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getMonths } = require('../../utils/functions/months');

// Function to validate if a given date is a valid birthday
function isValidBirthday(day, month, year) {

    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );

}

// Function to format a birthday into a human-readable string
function formatBirthday(day, month, year) {

    return `${day} de ${getMonths(month)} de ${year}`;

}

// Function to ensure the user has admin permissions for the interaction
async function ensureAdmin(interaction, errorMessage) {

    if (interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return true;
    }

    await interaction.reply({
        content: errorMessage,
        flags: MessageFlags.Ephemeral
    });

    return false;

}

// Export the functions for use in other modules
module.exports = {
    isValidBirthday,
    formatBirthday,
    ensureAdmin
};