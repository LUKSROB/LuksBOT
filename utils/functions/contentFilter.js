// Utility functions to compile and evaluate blocked content patterns

// Function to escape special characters in RegExp patterns
function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to normalize and clean list entries
function normalizeEntries(values = []) {
    if (!Array.isArray(values)) {
        return [];
    }

    const unique = new Set();
    for (const value of values) {
        const normalized = String(value || '').trim().toLowerCase();
        if (!normalized) {
            continue;
        }
        unique.add(normalized);
    }

    return [...unique];
}

// Function to build a word matcher regex
function compileWordRegex(words = []) {
    const normalizedWords = normalizeEntries(words);
    if (normalizedWords.length === 0) {
        return null;
    }

    const pattern = normalizedWords
        .map((word) => word.replace(/[.,!?;:]+$/g, ''))
        .filter(Boolean)
        .map((word) => escapeRegex(word))
        .map((word) => `\\b${word}\\b`)
        .join('|');

    return pattern ? new RegExp(pattern, 'iu') : null;
}

// Function to build a domain matcher regex
function compileWebRegex(webs = []) {
    const normalizedWebs = normalizeEntries(webs);
    if (normalizedWebs.length === 0) {
        return null;
    }

    const pattern = normalizedWebs
        .map((host) => escapeRegex(host))
        .join('|');

    return pattern ? new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?(?:${pattern})`, 'iu') : null;
}

// Function to create compiled content filters
function createContentFilter(words = [], webs = []) {
    const wordRegex = compileWordRegex(words);
    const webRegex = compileWebRegex(webs);

    return {
        wordRegex,
        webRegex,
        test(content = '') {
            const text = String(content || '');

            if (wordRegex) {
                wordRegex.lastIndex = 0;
                if (wordRegex.test(text)) {
                    return true;
                }
            }

            if (webRegex) {
                webRegex.lastIndex = 0;
                if (webRegex.test(text)) {
                    return true;
                }
            }

            return false;
        }
    };
}

// Export content filter functions
module.exports = {
    escapeRegex,
    normalizeEntries,
    compileWordRegex,
    compileWebRegex,
    createContentFilter
};
