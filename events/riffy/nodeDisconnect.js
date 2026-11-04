// Event handler for node disconnect event

// Export the node disconnect event handler
module.exports = async (node, reason, client) => {
    console.warn(`[Lavalink] ⚠️ Nodo ${node.name} desconectado`, reason);

    if (client?.lavalinkFailover) {
        await client.lavalinkFailover.handleNodeDisconnect(node, reason);
    }
};