// Interaction handler for help guide

// Import necessary modules
const { createHelpGuidePayload } = require('../utils/functions/helpCenter');

// Export the interaction handler for help guide
module.exports = async (interaction) => {

    await interaction.update(createHelpGuidePayload());

};
