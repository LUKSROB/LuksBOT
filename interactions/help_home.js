const { createHelpHomePayload } = require('../utils/functions/helpCenter');

module.exports = async (interaction) => {
    await interaction.update(createHelpHomePayload(interaction.client));
};
