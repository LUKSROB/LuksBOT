const { createHelpCommandsPayload } = require('../utils/functions/helpCenter');

module.exports = async (interaction) => {
    await interaction.update(createHelpCommandsPayload(interaction.client));
};
