// Event handler for node disconnect event

// Export the node disconnect event handler
module.exports = async (node, reason) => {
    console.warn(`[Lavalink] ⚠️ Nodo ${node.name} desconectado`, reason);

    setTimeout(() => {
        console.log(`[Lavalink] 🔄 Reintentando conexión al nodo ${node.name}...`);
        try {
            if (!node.connected) node.connect();
        } catch (err) {
            console.log(`[Lavalink] ❌ Error al reconectar: ${err.message}`);
            
            try {
                node.manager.createNode({
                    name: node.name,
                    host: node.options.host,
                    port: node.options.port,
                    password: node.options.password,
                    secure: node.options.secure
                });
                console.log(`[Lavalink] 🔄 Nodo recreado`);
            } catch (e) {
                console.log(`[Lavalink] ❌ No se pudo recrear el nodo: ${e.message}`);
            }
        }
    }, 5000);
}