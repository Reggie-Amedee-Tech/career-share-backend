import fs from 'node:fs/promises';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'geocode-locations.json');

const memoryCache = new Map();
let cacheLoaded = false;
let persistQueue = Promise.resolve();

function normalizeKey(location) {
    return location.trim().toLowerCase();
}

async function ensureCacheLoaded() {
    if (cacheLoaded) {
        return;
    }

    cacheLoaded = true;

    try {
        const raw = await fs.readFile(CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);

        for (const [key, value] of Object.entries(parsed)) {
            if (value?.latitude && value?.longitude) {
                memoryCache.set(key, value);
            }
        }
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            console.warn('[geocode-cache] Failed to load cache:', error.message);
        }
    }
}

function schedulePersist() {
    persistQueue = persistQueue
        .then(async () => {
            await fs.mkdir(CACHE_DIR, { recursive: true });
            const payload = Object.fromEntries(memoryCache.entries());
            await fs.writeFile(CACHE_FILE, JSON.stringify(payload));
        })
        .catch((error) => {
            console.warn('[geocode-cache] Failed to persist cache:', error.message);
        });
}

export async function getCachedGeocode(location) {
    await ensureCacheLoaded();
    const key = normalizeKey(location);
    if (!memoryCache.has(key)) {
        return undefined;
    }

    return memoryCache.get(key);
}

export async function setCachedGeocode(location, value) {
    if (!value?.latitude || !value?.longitude) {
        return;
    }

    await ensureCacheLoaded();
    memoryCache.set(normalizeKey(location), value);
    schedulePersist();
}

export async function clearGeocodeCache() {
    memoryCache.clear();
    cacheLoaded = true;

    try {
        await fs.unlink(CACHE_FILE);
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            throw error;
        }
    }
}
