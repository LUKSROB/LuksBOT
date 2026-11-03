const { createHelpGuidePayload } = require('../utils/functions/helpCenter');

module.exports = async (interaction) => {
    await interaction.update(createHelpGuidePayload());
};
