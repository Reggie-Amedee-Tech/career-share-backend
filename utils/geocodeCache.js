import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../lib/prisma.js';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'geocode-locations.json');

const memoryCache = new Map();
let cacheLoaded = false;
let persistQueue = Promise.resolve();

function normalizeKey(location) {
    return location.trim().toLowerCase();
}

function toCacheValue(value) {
    if (!value?.latitude || !value?.longitude) {
        return null;
    }

    return {
        location: value.location ?? '',
        latitude: value.latitude,
        longitude: value.longitude,
        countryShortName: value.countryShortName ?? 'US',
    };
}

async function ensureCacheLoaded() {
    if (cacheLoaded) {
        return;
    }

    cacheLoaded = true;

    try {
        const rows = await prisma.geocodeCache.findMany();
        for (const row of rows) {
            memoryCache.set(row.locationKey, {
                location: row.location,
                latitude: row.latitude,
                longitude: row.longitude,
                countryShortName: row.countryShortName,
            });
        }
    } catch (error) {
        console.warn('[geocode-cache] Failed to load database cache:', error.message);
    }

    try {
        const raw = await fs.readFile(CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);

        for (const [key, value] of Object.entries(parsed)) {
            if (value?.latitude && value?.longitude && !memoryCache.has(key)) {
                memoryCache.set(key, value);
            }
        }
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            console.warn('[geocode-cache] Failed to load file cache:', error.message);
        }
    }
}

function schedulePersist(value) {
    const key = normalizeKey(value.location || '');
    if (!key) {
        return;
    }

    persistQueue = persistQueue
        .then(async () => {
            await prisma.geocodeCache.upsert({
                where: { locationKey: key },
                create: {
                    locationKey: key,
                    location: value.location,
                    latitude: value.latitude,
                    longitude: value.longitude,
                    countryShortName: value.countryShortName ?? 'US',
                },
                update: {
                    location: value.location,
                    latitude: value.latitude,
                    longitude: value.longitude,
                    countryShortName: value.countryShortName ?? 'US',
                },
            });
        })
        .catch((error) => {
            console.warn('[geocode-cache] Failed to persist to database:', error.message);
        });

    persistQueue = persistQueue
        .then(async () => {
            await fs.mkdir(CACHE_DIR, { recursive: true });
            const payload = Object.fromEntries(memoryCache.entries());
            await fs.writeFile(CACHE_FILE, JSON.stringify(payload));
        })
        .catch((error) => {
            console.warn('[geocode-cache] Failed to persist file cache:', error.message);
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
    const normalized = toCacheValue(value);
    if (!normalized) {
        return;
    }

    await ensureCacheLoaded();
    const key = normalizeKey(location);
    const storedValue = {
        ...normalized,
        location: normalized.location || location.trim(),
    };
    memoryCache.set(key, storedValue);
    schedulePersist(storedValue);
}

export async function clearGeocodeCache() {
    memoryCache.clear();
    cacheLoaded = true;

    try {
        await prisma.geocodeCache.deleteMany();
    } catch (error) {
        console.warn('[geocode-cache] Failed to clear database cache:', error.message);
    }

    try {
        await fs.unlink(CACHE_FILE);
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            throw error;
        }
    }
}
