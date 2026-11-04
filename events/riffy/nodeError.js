// Event handler for node error event

function formatError(error) {
    if (!error) return 'sin detalle';
    if (typeof error === 'string') return error;
    if (Buffer.isBuffer(error)) return error.toString('utf8');
    if (error.message) return error.message;
    return String(error);
}

// Export the node error event handler
module.exports = async (node, error, client) => {
    const reason = formatError(error);
    console.error(`[Lavalink] ❌ Nodo "${node.name}" tuvo un error: ${reason}.`);

    if (client?.lavalinkFailover) {
        await client.lavalinkFailover.handleNodeError(node, error);
    }
};