// Event handler for node error event

// Export the node error event handler
module.exports = async (node, error, client) => {
    const reason = error?.message || error;
    console.error(`[Lavalink] ❌ Nodo "${node.name}" tuvo un error: ${reason}.`);

    if (client?.lavalinkFailover) {
        await client.lavalinkFailover.handleNodeError(node, error);
    }
};