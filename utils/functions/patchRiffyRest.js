const { Rest } = require('riffy');

const TRANSIENT_NETWORK_CODES = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EAI_AGAIN',
    'UND_ERR_CONNECT_TIMEOUT',
]);

function isTransientError(error) {
    const code = error?.cause?.cause?.code || error?.cause?.code || error?.code;
    
    if (!TRANSIENT_NETWORK_CODES.has(code)) return false;
    
    const endpoint = error?.request?.path || error?.path || '';

    if (!endpoint) return false;

    return /^\/v\d+\/sessions\/[^/]+(?:\/players\/[^/?]+)?(?:\?.*)?$/.test(endpoint);
}

function patchRiffyRest() {
    if (Rest.prototype.__luksbotPatchRiffy) return;

    const originalMakeRequest = Rest.prototype.makeRequest;

    Rest.prototype.makeRequest = async function patchedMakeRequest(method, endpoint, body = null, includeHeaders = false, retryCount = 0) {
        try {
            return await originalMakeRequest.call(this, method, endpoint, body, includeHeaders, retryCount);
        } catch (error) {
            if (method === 'PATCH' && isTransientError(error)) {
                this.riffy?.emit('debug', `[Rest] Session PATCH failed with transient network error (${error?.cause?.cause?.code || error?.cause?.code || error?.code}). Continuing without crashing.`);
                return null;
            }

            throw error;
        }
    };

    Rest.prototype.__luksbotPatchRiffy = true;
}

module.exports = {
    patchRiffyRest,
};
