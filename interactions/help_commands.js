// Interaction handler for help commands

// Import necessary modules
const { createHelpCommandsPayload } = require('../utils/functions/helpCenter');

// Export the interaction handler for help commands
module.exports = async (interaction) => {

    await interaction.update(createHelpCommandsPayload(interaction.client));

};
