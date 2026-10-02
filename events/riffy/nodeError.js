// Event handler for node error event

// Export the node error event handler
module.exports = async (node, error) => {
    console.error(`[Lavalink] ❌ Nodo "${node.name}" tuvo un error: ${error}.`);

}