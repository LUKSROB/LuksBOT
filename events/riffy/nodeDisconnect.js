// Event handler for node disconnect event

// Export the node disconnect event handler
module.exports = async (node, reason) => {
    console.warn(`[Lavalink] ⚠️ Nodo ${node.name} desconectado (${reason}).`);

    setTimeout(() => {
        console.log(`[Lavalink] 🔄 Reintentando conexión al nodo ${node.name}...`);
        node.connect();
    }, 5000);
}