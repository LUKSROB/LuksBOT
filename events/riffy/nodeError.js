// Event handler for node error event

// Export the node error event handler
module.exports = async (node, error) => {

    console.log(`Node "${node.name}" encountered an error: ${error.message}.`);

    if (error?.message?.includes("Unable to connect")) {
        console.log(`[Lavalink] 🔄 Forzando reconexión manual en 10s...`);
        setTimeout(() => {
            try {
                node.connect();
            } catch (err) {
                console.log(`[Lavalink] ❌ Error al reconectar: ${err.message}`);
            }
        }, 10_000);
    }
}