// Event handler for node error event

// Import necessary modules
const { formatError } = require("../../utils/functions/messages");

// Export the node error event handler
module.exports = async (node, error, client) => {

    const reason = formatError(error);
    console.error(`[Lavalink] ❌ Nodo "${node.name}" tuvo un error: ${reason}.`);

    if (client?.lavalinkFailover) {
        await client.lavalinkFailover.handleNodeError(node, error);
    }

};