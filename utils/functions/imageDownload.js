// Function to download and cache album art images using fetch

// Downloads an image from a URL with a specified timeout and returns it as a Buffer
/**
 * @param {string} url
 * @param {number} timeout
 * @returns {Promise<Buffer|null>}
 */
async function downloadImage(url, timeout = 5000) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    let timeoutId
    try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            console.warn(`[ImageDownload] Error: HTTP ${response.status} para ${url}`);
            return null;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            console.warn(`[ImageDownload] Content-Type no válido: ${contentType}`);
            return null;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        
        if (buffer.length === 0) {
            console.warn(`[ImageDownload] Buffer vacío para ${url}`);
            return null;
        }

        return buffer;

    } catch (error) {
        console.warn(`[ImageDownload] Error descargando ${url}:`, error.message);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Caches the image buffer in the player object for quick access
/**
 * @param {object} player
 * @param {string} ur
 * @param {Buffer} buffer
 * @param {string} color
 */
function cacheImageInPlayer(player, url, buffer, color) {
    if (!player) return;
    
    player._cachedAlbumArt = buffer;
    player._cachedAlbumArtUrl = url;
    player._cachedAlbumArtTime = Date.now();
    player._cachedColor = color;
}

// Retrieves the cached image from the player if it matches the URL
/**
 * @param {object} player
 * @param {string} url
 * @returns {Buffer|null}
 */
function getCachedImageFromPlayer(player, url) {
    if (!player || !player._cachedAlbumArt) return null;
    
    if (player._cachedAlbumArtUrl !== url) return null;
    
    return player._cachedAlbumArt;
}

// Clears the cached album art for the player
/**
 * @param {object} player
 */
function clearPlayerImageCache(player) {
    if (!player) return;
    
    delete player._cachedAlbumArt;
    delete player._cachedAlbumArtUrl;
    delete player._cachedAlbumArtTime;
    delete player._cachedColor;
}

// Export functions for image downloading and caching
module.exports = {
    downloadImage,
    cacheImageInPlayer,
    getCachedImageFromPlayer,
    clearPlayerImageCache
};
