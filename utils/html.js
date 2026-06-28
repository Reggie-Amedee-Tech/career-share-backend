const NAMED_ENTITIES = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
};

function decodeHtmlEntities(text) {
    return String(text)
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
            const code = Number.parseInt(hex, 16);
            return Number.isFinite(code) ? String.fromCodePoint(code) : '';
        })
        .replace(/&#(\d+);/g, (_, decimal) => {
            const code = Number.parseInt(decimal, 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : '';
        })
        .replace(/&([a-z]+);/gi, (entity, name) => {
            const decoded = NAMED_ENTITIES[name.toLowerCase()];
            return decoded ?? entity;
        });
}

function decodeAllHtmlEntities(text) {
    let decoded = String(text);
    let previous;

    do {
        previous = decoded;
        decoded = decodeHtmlEntities(decoded);
    } while (decoded !== previous);

    return decoded;
}

export function decodeJobContentHtml(html) {
    if (!html) {
        return '';
    }

    return decodeAllHtmlEntities(String(html)).trim();
}

export function stripHtml(html) {
    if (!html) {
        return '';
    }

    let text = decodeAllHtmlEntities(html);

    text = text
        .replace(/<(?:br|hr)\s*\/?>/gi, ' ')
        .replace(/<\/(?:p|div|h[1-6]|li|ul|ol|blockquote)>/gi, ' ')
        .replace(/<[^>]*>/g, ' ');

    text = decodeAllHtmlEntities(text);

    return text.replace(/\s+/g, ' ').trim();
}
