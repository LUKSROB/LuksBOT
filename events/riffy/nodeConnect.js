// Event handler for Riffy node connect event

// Export the node connect event handler
module.exports = async (node, client) => {

    console.log(`[Lavalink] ✅ Nodo "${node.name}" conectado.`);

    if (client?.lavalinkFailover) {
        client.lavalinkFailover.handleNodeConnect(node);
    }

};
