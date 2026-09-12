// Event handler for node disconnect event

// Export the node disconnect event handler
module.exports = async (node, reason) => {
    console.warn(`[Lavalink] ⚠️ Nodo ${node.name} desconectado`, reason);

    // Riffy already handles reconnection internally in Node.close -> Node.reconnect.
    console.log(`[Lavalink] ℹ️ Reconexión delegada a Riffy (auto-reconnect).`);
}