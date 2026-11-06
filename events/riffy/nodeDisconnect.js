// Event handler for node disconnect event

function formatReason(reason) {
    if (!reason) return 'sin detalle';

    if (typeof reason === 'string') {
        return reason;
    }

    if (Buffer.isBuffer(reason)) {
        return reason.toString('utf8');
    }

    if (typeof reason === 'object') {
        const eventCode = reason.event !== undefined ? `event=${reason.event}` : 'event=unknown';
        let detail = reason.reason;

        if (Buffer.isBuffer(detail)) {
            detail = detail.toString('utf8');
        } else if (detail && detail.message) {
            detail = detail.message;
        } else if (detail && typeof detail !== 'string') {
            detail = JSON.stringify(detail);
        }

        return `${eventCode}, reason=${detail || 'sin detalle'}`;
    }

    return String(reason);
}

// Export the node disconnect event handler
module.exports = async (node, reason, client) => {

    console.warn(`[Lavalink] ⚠️ Nodo ${node.name} desconectado: ${formatReason(reason)}`);

    if (client?.lavalinkFailover) {
        await client.lavalinkFailover.handleNodeDisconnect(node, reason);
    }

};