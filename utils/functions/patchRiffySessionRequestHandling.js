const { Rest } = require('riffy');

const TRANSIENT_NETWORK_CODES = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EAI_AGAIN',
    'UND_ERR_CONNECT_TIMEOUT',
]);

function patchRiffySessionRequestHandling() {
    if (Rest.prototype.__luksbotPatchedSessionHandler) return;

    const originalMakeRequest = Rest.prototype.makeRequest;

    Rest.prototype.makeRequest = async function patchedMakeRequest(method, endpoint, body = null, includeHeaders = false, retryCount = 0) {
        try {
            return await originalMakeRequest.call(this, method, endpoint, body, includeHeaders, retryCount);
        } catch (error) {
            const code = error?.cause?.cause?.code || error?.cause?.code || error?.code;
            const isTransientNetworkError = TRANSIENT_NETWORK_CODES.has(code);
            const isSessionPatch = method === 'PATCH' && /^\/v\d+\/sessions\/[^/]+$/.test(endpoint);

            // Riffy sends this request during node ready without awaiting/catching it.
            // If the connection is reset, swallow only this transient case to avoid unhandled rejections.
            if (isSessionPatch && isTransientNetworkError) {
                this.riffy?.emit('debug', `[Rest] Session PATCH failed with transient network error (${code}). Continuing without crashing.`);
                return null;
            }

            throw error;
        }
    };

    Rest.prototype.__luksbotPatchedSessionHandler = true;
}

module.exports = {
    patchRiffySessionRequestHandling,
};
