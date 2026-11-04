function prepareLavalinkNodes(nodes) {
    if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error('config.NODES debe ser un array con al menos un nodo.');
    }

    return nodes.map((node, index) => ({
        ...node,
        name: node.name || `${index + 1}-${node.host}`,
        reconnectTries: 0,
        reconnectTimeout: 1000
    }));
}

function createLavalinkFailoverManager(client, nodes, options = {}) {
    const connectAttemptTimeoutMs = Number(options.connectAttemptTimeoutMs) || 15000;
    const retryRoundDelayMs = Number(options.retryRoundDelayMs) || 5000;

    const state = {
        nodes,
        activeIndex: -1,
        switching: false,
        switchPromise: null,
        connectedNodeName: null,
        lastFailureAtByNode: new Map(),
        ignoreFailureUntilByNode: new Map(),
        readyWaiters: new Set()
    };

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function getNodeIndex(nodeName) {
        return state.nodes.findIndex((node) => node.name === nodeName);
    }

    function normalizeIndex(index) {
        const len = state.nodes.length;
        if (len === 0) {
            return 0;
        }
        return ((index % len) + len) % len;
    }

    function clearNodeReconnect(node) {
        if (node?.reconnectAttempt) {
            clearTimeout(node.reconnectAttempt);
            node.reconnectAttempt = null;
        }
    }

    function isNodeCurrentlyConnected(nodeName) {
        if (!nodeName) {
            return false;
        }
        const node = client.riffy.nodeMap.get(nodeName);
        return Boolean(node && node.connected);
    }

    function markNodeFailureIgnored(nodeName, ms = 5000) {
        if (!nodeName) {
            return;
        }
        state.ignoreFailureUntilByNode.set(nodeName, Date.now() + ms);
    }

    function shouldIgnoreFailure(nodeName) {
        const until = state.ignoreFailureUntilByNode.get(nodeName) || 0;
        if (Date.now() < until) {
            return true;
        }
        state.ignoreFailureUntilByNode.delete(nodeName);
        return false;
    }

    function stopBackgroundReconnect(nodeName) {
        const node = client.riffy.nodeMap.get(nodeName);
        if (!node) {
            return;
        }
        clearNodeReconnect(node);
    }

    function isReady() {
        return Boolean(
            state.connectedNodeName &&
            isNodeCurrentlyConnected(state.connectedNodeName)
        );
    }

    function notifyReadyWaiters(ready) {
        for (const waiter of state.readyWaiters) {
            try {
                waiter(ready);
            } catch (_) {}
        }
        state.readyWaiters.clear();
    }

    function waitForReady(timeoutMs) {
        if (isReady()) {
            return Promise.resolve(true);
        }

        return new Promise((resolve) => {
            let settled = false;
            let timeoutId = null;

            const done = (value) => {
                if (settled) return;
                settled = true;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                state.readyWaiters.delete(onReady);
                resolve(value);
            };

            const onReady = (value) => done(Boolean(value));
            state.readyWaiters.add(onReady);

            timeoutId = setTimeout(() => done(false), timeoutMs);
        });
    }

    function parkNonActiveNodes(activeNodeName) {
        for (const configuredNode of state.nodes) {
            if (configuredNode.name === activeNodeName) {
                continue;
            }

            const node = client.riffy.nodeMap.get(configuredNode.name);
            if (!node) {
                continue;
            }

            markNodeFailureIgnored(node.name);
            clearNodeReconnect(node);

            if (node.connected || node.ws) {
                node.destroy(true);
            }
        }
    }

    function stringifyReason(reason) {
        if (!reason) return 'sin detalle';
        if (typeof reason === 'string') return reason;
        if (reason.message) return reason.message;
        if (reason.reason) return String(reason.reason);
        if (reason.event && reason.reason) return `code=${reason.event}, reason=${reason.reason}`;
        return String(reason);
    }

    function waitForNodeResult(nodeName, timeoutMs) {
        return new Promise((resolve) => {
            let settled = false;
            let timeoutId = null;

            const finish = (result) => {
                if (settled) return;
                settled = true;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                client.riffy.off('nodeConnect', onConnect);
                client.riffy.off('nodeError', onError);
                client.riffy.off('nodeDisconnect', onDisconnect);
                resolve(result);
            };

            const onConnect = (node) => {
                if (node?.name !== nodeName) return;
                finish({ ok: true, node });
            };

            const onError = (node, error) => {
                if (node?.name !== nodeName) return;
                finish({ ok: false, reason: error, kind: 'error' });
            };

            const onDisconnect = (node, reason) => {
                if (node?.name !== nodeName) return;
                finish({ ok: false, reason, kind: 'disconnect' });
            };

            client.riffy.on('nodeConnect', onConnect);
            client.riffy.on('nodeError', onError);
            client.riffy.on('nodeDisconnect', onDisconnect);

            timeoutId = setTimeout(() => {
                finish({
                    ok: false,
                    reason: `timeout (${Math.round(timeoutMs / 1000)}s sin conexión)`,
                    kind: 'timeout'
                });
            }, timeoutMs);
        });
    }

    async function attemptConnectNode(index, contextLabel) {
        const normalizedIndex = normalizeIndex(index);
        const targetConfig = state.nodes[normalizedIndex];
        if (!targetConfig) {
            return { ok: false, reason: 'nodo no encontrado', index: normalizedIndex };
        }

        console.log(`[Lavalink Failover] Intentando conectar nodo "${targetConfig.name}" [${contextLabel}]...`);

        const existingNode = client.riffy.nodeMap.get(targetConfig.name);
        if (existingNode?.connected) {
            state.activeIndex = normalizedIndex;
            state.connectedNodeName = existingNode.name;
            console.log(`[Lavalink Failover] Nodo "${existingNode.name}" ya estaba conectado.`);
            return { ok: true, node: existingNode, index: normalizedIndex };
        }

        try {
            if (existingNode) {
                clearNodeReconnect(existingNode);
                await existingNode.connect();
            } else {
                client.riffy.createNode(targetConfig);
            }
        } catch (err) {
            const reason = stringifyReason(err);
            console.warn(`[Lavalink Failover] Falló conexión inmediata de "${targetConfig.name}": ${reason}`);
            return { ok: false, reason, index: normalizedIndex };
        }

        const result = await waitForNodeResult(targetConfig.name, connectAttemptTimeoutMs);
        if (result.ok) {
            state.activeIndex = normalizedIndex;
            state.connectedNodeName = targetConfig.name;
            parkNonActiveNodes(targetConfig.name);
            notifyReadyWaiters(true);
            console.log(`[Lavalink Failover] Nodo activo: "${targetConfig.name}".`);
            return { ok: true, node: result.node, index: normalizedIndex };
        }

        stopBackgroundReconnect(targetConfig.name);
        const reasonText = stringifyReason(result.reason);
        console.warn(`[Lavalink Failover] Nodo "${targetConfig.name}" no conectó: ${reasonText}`);
        return { ok: false, reason: reasonText, index: normalizedIndex };
    }

    async function switchUntilConnected(startIndex, contextLabel) {
        if (state.switching) {
            return state.switchPromise;
        }

        if (state.nodes.length === 0) {
            console.error('[Lavalink Failover] No hay nodos configurados para intentar conexión.');
            return;
        }

        state.switching = true;
        state.switchPromise = (async () => {
            const firstIndex = normalizeIndex(startIndex);
            let currentIndex = firstIndex;
            let firstRound = true;

            while (true) {
                const result = await attemptConnectNode(currentIndex, contextLabel);
                if (result.ok) {
                    return true;
                }

                currentIndex = normalizeIndex(currentIndex + 1);

                if (currentIndex === firstIndex) {
                    const roundText = firstRound ? 'primera ronda' : 'ronda adicional';
                    console.warn(`[Lavalink Failover] Ningún nodo conectó (${roundText}). Reintentando en ${Math.round(retryRoundDelayMs / 1000)}s...`);
                    firstRound = false;
                    notifyReadyWaiters(false);
                    await sleep(retryRoundDelayMs);
                }
            }
        })().finally(() => {
            state.switching = false;
            state.switchPromise = null;
        });

        return state.switchPromise;
    }

    async function bootstrap() {
        const preferredStartIndex = state.activeIndex >= 0 ? state.activeIndex : 0;
        await switchUntilConnected(preferredStartIndex, 'startup');
    }

    async function handleFailure(node, reason, eventType) {
        const nodeName = node?.name || 'unknown-node';
        if (shouldIgnoreFailure(nodeName)) {
            return;
        }

        const now = Date.now();
        const lastFailure = state.lastFailureAtByNode.get(nodeName) || 0;
        if (now - lastFailure < 3000) {
            return;
        }
        state.lastFailureAtByNode.set(nodeName, now);

        const reasonText = stringifyReason(reason);
        console.warn(`[Lavalink Failover] ${eventType} en "${nodeName}": ${reasonText}`);

        const activeNodeName = state.connectedNodeName;
        if (activeNodeName && activeNodeName !== nodeName && isNodeCurrentlyConnected(activeNodeName)) {
            stopBackgroundReconnect(nodeName);
            console.log(`[Lavalink Failover] Ignorado: "${nodeName}" falló, pero el nodo activo "${activeNodeName}" sigue conectado.`);
            return;
        }

        const failedIndex = getNodeIndex(nodeName);
        const nextIndex = failedIndex >= 0
            ? normalizeIndex(failedIndex + 1)
            : normalizeIndex(state.activeIndex + 1);

        await switchUntilConnected(nextIndex, `${eventType}:${nodeName}`);
    }

    function handleNodeConnect(node) {
        const index = getNodeIndex(node?.name);
        const activeNodeName = state.connectedNodeName;

        if (
            activeNodeName &&
            activeNodeName !== node?.name &&
            isNodeCurrentlyConnected(activeNodeName)
        ) {
            markNodeFailureIgnored(node?.name);
            clearNodeReconnect(node);
            if (node?.connected || node?.ws) {
                node.destroy(true);
            }
            console.log(`[Lavalink Failover] Nodo secundario "${node?.name}" detenido (activo actual: "${activeNodeName}").`);
            return;
        }

        if (index >= 0) {
            state.activeIndex = index;
            state.connectedNodeName = node.name;
            notifyReadyWaiters(true);
        }

        parkNonActiveNodes(node?.name);
    }

    async function ensureReady(timeoutMs = 7000, contextLabel = 'runtime') {
        if (isReady()) {
            return true;
        }

        const startIndex = state.activeIndex >= 0 ? state.activeIndex : 0;
        switchUntilConnected(startIndex, contextLabel).catch((err) => {
            console.error('[Lavalink Failover] Error while ensuring readiness:', err);
        });

        return waitForReady(timeoutMs);
    }

    return {
        bootstrap,
        ensureReady,
        isReady,
        handleNodeDisconnect: (node, reason) => handleFailure(node, reason, 'nodeDisconnect'),
        handleNodeError: (node, error) => handleFailure(node, error, 'nodeError'),
        handleNodeConnect
    };
}

module.exports = {
    prepareLavalinkNodes,
    createLavalinkFailoverManager
};
