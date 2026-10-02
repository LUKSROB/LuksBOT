// Event handler for node disconnect event

// Export the node disconnect event handler
module.exports = async (node, reason) => {
    console.warn(`[Lavalink] ⚠️ Nodo ${node.name} desconectado`, reason);
    
}