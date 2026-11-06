// Functions to manage Lavalink failover and node health

// Function to prepare Lavalink nodes with default settings if not provided
function prepareLavalinkNodes(nodes) {

    if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error('config.NODES debe ser un array con al menos un nodo.');
    }

    return nodes.map((node, index) => ({
        ...node,
        name: node.name || `${index + 1}-${node.host}`,
        reconnectTries: 1,
        reconnectTimeout: 1000
    }));

}

// Function to create a Lavalink failover manager with node health tracking and automatic failover
function createLavalinkFailoverManager(client, nodes, options = {}) {

    const connectAttemptTimeoutMs = Number(options.connectAttemptTimeoutMs) || 12000;
    const retryRoundDelayMs = Number(options.retryRoundDelayMs) || 3000;
    const failureBaseCooldownMs = Number(options.failureBaseCooldownMs) || 15000;
    const failureMaxCooldownMs = Number(options.failureMaxCooldownMs) || 300000;
    const rateLimitCooldownMs = Number(options.rateLimitCooldownMs) || 10 * 60 * 1000;
    const ignoreFailureWindowMs = Number(options.ignoreFailureWindowMs) || 8000;

    const state = {
        nodes,
        activeIndex: -1,
        connectedNodeName: null,
        switching: false,
        switchPromise: null,
        attemptingNodeName: null,
        readyWaiters: new Set(),
        ignoreFailureUntilByNode: new Map(),
        nodeHealth: new Map(),
        hostCooldownUntil: new Map()
    };

    for (const node of nodes) {
        state.nodeHealth.set(node.name, {
            failures: 0,
            cooldownUntil: 0,
            lastFailureAt: 0,
            lastReason: ''
        });
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function normalizeIndex(index) {
        const len = state.nodes.length;
        if (len === 0) {
            return 0;
        }
        return ((index % len) + len) % len;
    }

    function getNodeIndex(nodeName) {
        return state.nodes.findIndex((node) => node.name === nodeName);
    }

    function resolveNodeIndex(nodeRef) {
        if (typeof nodeRef === 'number' && Number.isInteger(nodeRef)) {
            const zeroBased = nodeRef - 1;
            return zeroBased >= 0 && zeroBased < state.nodes.length ? zeroBased : -1;
        }

        if (typeof nodeRef !== 'string') {
            return -1;
        }

        const trimmed = nodeRef.trim();
        if (trimmed.length === 0) {
            return -1;
        }

        if (/^\d+$/.test(trimmed)) {
            const fromOne = Number(trimmed) - 1;
            if (fromOne >= 0 && fromOne < state.nodes.length) {
                return fromOne;
            }
        }

        const exact = state.nodes.findIndex((node) => node.name === trimmed);
        if (exact >= 0) {
            return exact;
        }

        const lower = trimmed.toLowerCase();
        return state.nodes.findIndex((node) => node.name.toLowerCase().includes(lower));
    }

    function getNodeConfigByName(nodeName) {
        return state.nodes.find((node) => node.name === nodeName) || null;
    }

    function isNodeConnected(nodeName) {
        if (!nodeName) {
            return false;
        }
        const node = client.riffy.nodeMap.get(nodeName);
        return Boolean(node && node.connected);
    }

    function isReady() {
        return Boolean(
            state.connectedNodeName &&
            isNodeConnected(state.connectedNodeName)
        );
    }

    function notifyReadyWaiters(ready) {
        for (const waiter of state.readyWaiters) {
            try {
                waiter(Boolean(ready));
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

            const finish = (value) => {
                if (settled) return;
                settled = true;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                state.readyWaiters.delete(onReady);
                resolve(Boolean(value));
            };

            const onReady = (value) => finish(value);
            state.readyWaiters.add(onReady);

            timeoutId = setTimeout(() => finish(false), timeoutMs);
        });
    }

    function getHealth(nodeName) {
        if (!state.nodeHealth.has(nodeName)) {
            state.nodeHealth.set(nodeName, {
                failures: 0,
                cooldownUntil: 0,
                lastFailureAt: 0,
                lastReason: ''
            });
        }
        return state.nodeHealth.get(nodeName);
    }

    function markNodeSuccess(nodeName) {
        const health = getHealth(nodeName);
        health.failures = 0;
        health.cooldownUntil = 0;
        health.lastReason = '';
        health.lastFailureAt = 0;
    }

    function markNodeFailure(nodeName, reasonText) {
        const health = getHealth(nodeName);
        const now = Date.now();

        health.failures += 1;
        health.lastFailureAt = now;
        health.lastReason = reasonText;

        const cooldownMs = Math.min(
            failureMaxCooldownMs,
            failureBaseCooldownMs * Math.pow(2, Math.max(0, health.failures - 1))
        );
        health.cooldownUntil = now + cooldownMs;

        return cooldownMs;
    }

    function getNodeCooldownRemainingMs(nodeName) {
        const health = getHealth(nodeName);
        return Math.max(0, health.cooldownUntil - Date.now());
    }

    function getHostCooldownRemainingMs(nodeName) {
        const nodeConfig = getNodeConfigByName(nodeName);
        if (!nodeConfig?.host) {
            return 0;
        }

        const until = state.hostCooldownUntil.get(nodeConfig.host) || 0;
        return Math.max(0, until - Date.now());
    }

    function isNodeCoolingDown(nodeName) {
        return getNodeCooldownRemainingMs(nodeName) > 0 || getHostCooldownRemainingMs(nodeName) > 0;
    }

    function nextCooldownDelayMs() {
        const remaining = [];
        for (const configuredNode of state.nodes) {
            const nodeMs = getNodeCooldownRemainingMs(configuredNode.name);
            const hostMs = getHostCooldownRemainingMs(configuredNode.name);
            const ms = Math.max(nodeMs, hostMs);
            if (ms > 0) {
                remaining.push(ms);
            }
        }
        if (remaining.length === 0) {
            return retryRoundDelayMs;
        }
        return Math.min(...remaining, retryRoundDelayMs);
    }

    function clearNodeReconnect(node) {
        if (node?.reconnectAttempt) {
            clearTimeout(node.reconnectAttempt);
            node.reconnectAttempt = null;
        }
    }

    function stopBackgroundReconnect(nodeName) {
        const node = client.riffy.nodeMap.get(nodeName);
        if (node) {
            clearNodeReconnect(node);
        }
    }

    function markNodeFailureIgnored(nodeName, ms = ignoreFailureWindowMs) {
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

    function decodeReason(value) {
        if (!value) return 'sin detalle';
        if (typeof value === 'string') {
            const normalized = value.trim();
            return normalized.length > 0 ? normalized : 'sin detalle';
        }
        if (Buffer.isBuffer(value)) {
            const normalized = value.toString('utf8').trim();
            return normalized.length > 0 ? normalized : 'sin detalle';
        }
        if (value.message) return value.message;
        if (value.reason) return decodeReason(value.reason);
        return String(value);
    }

    function stringifyReason(reason) {
        if (!reason) {
            return 'sin detalle';
        }

        if (reason.event !== undefined && reason.reason !== undefined) {
            return `event=${reason.event}, reason=${decodeReason(reason.reason)}`;
        }

        return decodeReason(reason);
    }

    function isRateLimitReason(reason, reasonText) {
        if (reason?.event === 4000) {
            return true;
        }

        const lowerText = String(reasonText || '').toLowerCase();
        return lowerText.includes('too many websocket connections attempt') ||
            lowerText.includes('try again later');
    }

    function applyHostCooldown(nodeName, cooldownMs) {
        const nodeConfig = getNodeConfigByName(nodeName);
        if (!nodeConfig?.host) {
            return;
        }

        const nextUntil = Date.now() + cooldownMs;
        const previousUntil = state.hostCooldownUntil.get(nodeConfig.host) || 0;
        state.hostCooldownUntil.set(nodeConfig.host, Math.max(previousUntil, nextUntil));
    }

    function parkNonActiveNodes(activeNodeName) {
        for (const configuredNode of state.nodes) {
            if (configuredNode.name === activeNodeName) {
                continue;
            }

            const runtimeNode = client.riffy.nodeMap.get(configuredNode.name);
            if (!runtimeNode) {
                continue;
            }

            markNodeFailureIgnored(runtimeNode.name);
            clearNodeReconnect(runtimeNode);

            if (runtimeNode.connected || runtimeNode.ws) {
                runtimeNode.destroy(true);
            }
        }
    }

    function findNextCandidateIndex(startIndex) {
        const len = state.nodes.length;
        for (let step = 0; step < len; step++) {
            const idx = normalizeIndex(startIndex + step);
            const nodeName = state.nodes[idx].name;
            if (!isNodeCoolingDown(nodeName)) {
                return idx;
            }
        }
        return null;
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

        const cooldownRemainingMs = getNodeCooldownRemainingMs(targetConfig.name);
        const hostCooldownRemainingMs = getHostCooldownRemainingMs(targetConfig.name);
        if (cooldownRemainingMs > 0 || hostCooldownRemainingMs > 0) {
            const source = hostCooldownRemainingMs > cooldownRemainingMs ? 'host' : 'node';
            const remaining = Math.max(cooldownRemainingMs, hostCooldownRemainingMs);
            return {
                ok: false,
                reason: `cooldown activo ${source} (${Math.ceil(remaining / 1000)}s)`,
                index: normalizedIndex
            };
        }

        console.log(`[Lavalink Failover] Intentando conectar nodo "${targetConfig.name}" [${contextLabel}]...`);
        state.attemptingNodeName = targetConfig.name;

        const existingNode = client.riffy.nodeMap.get(targetConfig.name);
        if (existingNode?.connected) {
            state.activeIndex = normalizedIndex;
            state.connectedNodeName = existingNode.name;
            markNodeSuccess(existingNode.name);
            parkNonActiveNodes(existingNode.name);
            notifyReadyWaiters(true);
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
            const reasonText = stringifyReason(err);
            const cooldownMs = markNodeFailure(targetConfig.name, reasonText);
            if (isRateLimitReason(err, reasonText)) {
                applyHostCooldown(targetConfig.name, rateLimitCooldownMs);
            }
            console.warn(
                `[Lavalink Failover] Falló conexión inmediata de "${targetConfig.name}": ${reasonText}. Cooldown: ${Math.ceil(cooldownMs / 1000)}s.`
            );
            stopBackgroundReconnect(targetConfig.name);
            state.attemptingNodeName = null;
            return { ok: false, reason: reasonText, index: normalizedIndex };
        }

        const result = await waitForNodeResult(targetConfig.name, connectAttemptTimeoutMs);
        state.attemptingNodeName = null;
        if (result.ok) {
            state.activeIndex = normalizedIndex;
            state.connectedNodeName = targetConfig.name;
            markNodeSuccess(targetConfig.name);
            parkNonActiveNodes(targetConfig.name);
            notifyReadyWaiters(true);
            console.log(`[Lavalink Failover] Nodo activo: "${targetConfig.name}".`);
            return { ok: true, node: result.node, index: normalizedIndex };
        }

        stopBackgroundReconnect(targetConfig.name);
        const reasonText = stringifyReason(result.reason);
        const cooldownMs = markNodeFailure(targetConfig.name, reasonText);
        if (isRateLimitReason(result.reason, reasonText)) {
            applyHostCooldown(targetConfig.name, rateLimitCooldownMs);
        }
        console.warn(
            `[Lavalink Failover] Nodo "${targetConfig.name}" no conectó: ${reasonText}. Cooldown: ${Math.ceil(cooldownMs / 1000)}s.`
        );
        return { ok: false, reason: reasonText, index: normalizedIndex };
    }

    async function switchUntilConnected(startIndex, contextLabel) {
        if (state.switching) {
            return state.switchPromise;
        }

        if (state.nodes.length === 0) {
            console.error('[Lavalink Failover] No hay nodos configurados para intentar conexión.');
            return false;
        }

        state.switching = true;
        state.switchPromise = (async () => {
            let cursor = normalizeIndex(startIndex);

            while (true) {
                if (isReady()) {
                    return true;
                }

                const candidateIndex = findNextCandidateIndex(cursor);
                if (candidateIndex === null) {
                    const waitMs = Math.max(500, nextCooldownDelayMs());
                    console.warn(`[Lavalink Failover] Todos los nodos en cooldown. Reintentando en ${Math.ceil(waitMs / 1000)}s...`);
                    notifyReadyWaiters(false);
                    await sleep(waitMs);
                    continue;
                }

                const result = await attemptConnectNode(candidateIndex, contextLabel);
                if (result.ok) {
                    return true;
                }

                cursor = normalizeIndex(candidateIndex + 1);
                await sleep(250);
            }
        })().finally(() => {
            state.switching = false;
            state.switchPromise = null;
        });

        return state.switchPromise;
    }

    async function bootstrap() {
        const startIndex = state.activeIndex >= 0 ? state.activeIndex : 0;
        await switchUntilConnected(startIndex, 'startup');
    }

    async function handleFailure(node, reason, eventType) {
        const nodeName = node?.name || 'unknown-node';
        if (shouldIgnoreFailure(nodeName)) {
            return;
        }

        if (state.attemptingNodeName && nodeName === state.attemptingNodeName) {
            return;
        }

        const activeNodeName = state.connectedNodeName;
        if (activeNodeName && activeNodeName !== nodeName && isNodeConnected(activeNodeName)) {
            stopBackgroundReconnect(nodeName);
            const runtimeNode = client.riffy.nodeMap.get(nodeName);
            if (runtimeNode) {
                markNodeFailureIgnored(nodeName);
                runtimeNode.destroy(true);
            }
            console.log(`[Lavalink Failover] Ignorado: "${nodeName}" falló, pero "${activeNodeName}" sigue activo.`);
            return;
        }

        const reasonText = stringifyReason(reason);
        const cooldownMs = markNodeFailure(nodeName, reasonText);
        if (isRateLimitReason(reason, reasonText)) {
            applyHostCooldown(nodeName, rateLimitCooldownMs);
        }
        console.warn(
            `[Lavalink Failover] ${eventType} en "${nodeName}": ${reasonText}. Cooldown: ${Math.ceil(cooldownMs / 1000)}s.`
        );

        if (activeNodeName === nodeName) {
            state.connectedNodeName = null;
            state.activeIndex = -1;
            notifyReadyWaiters(false);
        }

        const failedIndex = getNodeIndex(nodeName);
        const nextIndex = failedIndex >= 0
            ? normalizeIndex(failedIndex + 1)
            : normalizeIndex((state.activeIndex >= 0 ? state.activeIndex + 1 : 0));

        await switchUntilConnected(nextIndex, `${eventType}:${nodeName}`);
    }

    function handleNodeConnect(node) {
        const index = getNodeIndex(node?.name);
        const activeNodeName = state.connectedNodeName;

        if (
            activeNodeName &&
            activeNodeName !== node?.name &&
            isNodeConnected(activeNodeName)
        ) {
            markNodeFailureIgnored(node?.name);
            clearNodeReconnect(node);
            if (node?.connected || node?.ws) {
                node.destroy(true);
            }
            console.log(`[Lavalink Failover] Nodo secundario "${node?.name}" detenido (activo: "${activeNodeName}").`);
            return;
        }

        if (index >= 0) {
            state.activeIndex = index;
            state.connectedNodeName = node.name;
            markNodeSuccess(node.name);
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

    function resetNodeHealth(nodeRef, options = {}) {
        const index = resolveNodeIndex(nodeRef);
        if (index < 0) {
            return null;
        }

        const nodeConfig = state.nodes[index];
        const health = getHealth(nodeConfig.name);
        health.failures = 0;
        health.cooldownUntil = 0;
        health.lastFailureAt = 0;
        health.lastReason = '';

        if (options.clearHostCooldown && nodeConfig.host) {
            state.hostCooldownUntil.delete(nodeConfig.host);
        }

        return {
            index: index + 1,
            name: nodeConfig.name,
            host: nodeConfig.host
        };
    }

    function getStatusSnapshot() {
        return {
            ready: isReady(),
            switching: state.switching,
            activeNodeName: state.connectedNodeName,
            nodes: state.nodes.map((node, index) => {
                const runtimeNode = client.riffy.nodeMap.get(node.name);
                const health = getHealth(node.name);
                return {
                    index: index + 1,
                    name: node.name,
                    host: node.host,
                    port: node.port,
                    connected: Boolean(runtimeNode?.connected),
                    cooldownNodeMs: Math.max(0, health.cooldownUntil - Date.now()),
                    cooldownHostMs: getHostCooldownRemainingMs(node.name),
                    failures: health.failures,
                    lastReason: health.lastReason || 'sin detalle'
                };
            })
        };
    }

    async function switchToNode(nodeRef, options = {}) {
        const index = resolveNodeIndex(nodeRef);
        if (index < 0) {
            return {
                ok: false,
                reason: `Nodo no encontrado: ${nodeRef}`
            };
        }

        const target = state.nodes[index];
        const timeoutMs = Number(options.timeoutMs) || 15000;
        const force = Boolean(options.force);
        const actor = options.actor || 'manual';

        if (force) {
            resetNodeHealth(index + 1, { clearHostCooldown: true });
        }

        if (
            state.connectedNodeName === target.name &&
            isNodeConnected(target.name)
        ) {
            return {
                ok: true,
                switched: false,
                alreadyActive: true,
                activeNodeName: target.name
            };
        }

        state.connectedNodeName = null;
        state.activeIndex = -1;
        notifyReadyWaiters(false);

        switchUntilConnected(index, `manual-switch:${actor}`).catch((err) => {
            console.error('[Lavalink Failover] Error en cambio manual:', err);
        });

        const ready = await waitForReady(timeoutMs);
        return {
            ok: ready,
            switched: ready,
            pending: !ready,
            targetNodeName: target.name,
            activeNodeName: state.connectedNodeName
        };
    }

    return {
        bootstrap,
        ensureReady,
        isReady,
        getStatusSnapshot,
        resetNodeHealth,
        switchToNode,
        handleNodeDisconnect: (node, reason) => handleFailure(node, reason, 'nodeDisconnect'),
        handleNodeError: (node, error) => handleFailure(node, error, 'nodeError'),
        handleNodeConnect
    };

}

// Export the functions for use in other modules
module.exports = {
    prepareLavalinkNodes,
    createLavalinkFailoverManager
};
