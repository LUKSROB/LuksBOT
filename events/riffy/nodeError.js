// Event handler for node error event

// Export the node error event handler
module.exports = async (node, error) => {

    console.error(`[Lavalink] ❌ Nodo "${node.name}" tuvo un error: ${error.message}.`);

    // Avoid duplicate reconnect storms: Riffy already retries connections internally.
    if (error?.message?.includes("Unable to connect")) {
        console.log(`[Lavalink] ℹ️ Reintento automático manejado por Riffy.`);
    }
}