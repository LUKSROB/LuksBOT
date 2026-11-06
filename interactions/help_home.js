// Interaction handler for help home

// Import necessary modules
const { createHelpHomePayload } = require('../utils/functions/helpCenter');

// Export the interaction handler for help home
module.exports = async (interaction) => {

    await interaction.update(createHelpHomePayload(interaction.client));

};
