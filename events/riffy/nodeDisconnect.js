// Event handler for node disconnect event

// Import necessary modules
const { formatReason } = require("../../utils/functions/messages");

// Export the node disconnect event handler
module.exports = async (node, reason, client) => {

    console.warn(`[Lavalink] ⚠️ Nodo ${node.name} desconectado: ${formatReason(reason)}`);

    if (client?.lavalinkFailover) {
        await client.lavalinkFailover.handleNodeDisconnect(node, reason);
    }

};