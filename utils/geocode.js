import {
    clearGeocodeCache as clearPersistentCache,
    getCachedGeocode,
    setCachedGeocode,
} from './geocodeCache.js';

const NOMINATIM_MIN_INTERVAL_MS = 1100;
export const DEFAULT_MAX_GEOCODE_LOOKUPS = 15;
export const DEFAULT_GEOCODE_DEADLINE_MS = 8000;

const inflightRequests = new Map();
let lastNominatimRequestAt = 0;
let rateLimitChain = Promise.resolve();

async function waitForRateLimit() {
    rateLimitChain = rateLimitChain.then(async () => {
        const now = Date.now();
        const waitMs = Math.max(
            0,
            NOMINATIM_MIN_INTERVAL_MS - (now - lastNominatimRequestAt),
        );

        if (waitMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
        }

        lastNominatimRequestAt = Date.now();
    });

    await rateLimitChain;
}

async function fetchGeocodeResult(location) {
    await waitForRateLimit();

    const params = new URLSearchParams({
        q: location,
        format: 'json',
        limit: '1',
        addressdetails: '1',
    });

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
            headers: {
                'User-Agent': 'career-share-backend/1.0',
            },
        },
    );

    if (!response.ok) {
        throw new Error('Address lookup failed');
    }

    const results = await response.json();
    const match = results[0];

    if (!match) {
        throw new Error('Address could not be verified');
    }

    return {
        location: match.display_name,
        latitude: Number(match.lat),
        longitude: Number(match.lon),
        countryShortName: match.address?.country_code?.toUpperCase() ?? '',
    };
}

async function fetchAndCacheLocation(location) {
    const normalized = location.trim();

    try {
        const result = await fetchGeocodeResult(normalized);
        await setCachedGeocode(normalized, result);
        return result;
    } catch {
        return null;
    }
}

export async function clearGeocodeCache() {
    inflightRequests.clear();
    await clearPersistentCache();
}

export async function geocodeLocation(location) {
    const normalized = location?.trim();
    if (!normalized) {
        return null;
    }

    const cached = await getCachedGeocode(normalized);
    if (cached !== undefined) {
        return cached;
    }

    const cacheKey = normalized.toLowerCase();
    if (inflightRequests.has(cacheKey)) {
        return inflightRequests.get(cacheKey);
    }

    const request = fetchAndCacheLocation(normalized).finally(() => {
        inflightRequests.delete(cacheKey);
    });

    inflightRequests.set(cacheKey, request);
    return request;
}

export async function geocodeLocations(locations, options = {}) {
    const maxLookups = options.maxLookups ?? DEFAULT_MAX_GEOCODE_LOOKUPS;
    const deadlineMs = options.deadlineMs ?? DEFAULT_GEOCODE_DEADLINE_MS;
    const startedAt = Date.now();

    const coordinatesByLocation = new Map();
    const uncachedLocations = [];

    for (const location of locations) {
        const normalized = location?.trim();
        if (!normalized) {
            continue;
        }

        const cached = await getCachedGeocode(normalized);
        if (cached) {
            coordinatesByLocation.set(normalized, cached);
            continue;
        }

        uncachedLocations.push(normalized);
    }

    if (options.sortLocations) {
        uncachedLocations.sort(options.sortLocations);
    }

    let lookups = 0;
    for (const location of uncachedLocations) {
        if (lookups >= maxLookups) {
            break;
        }

        if (Date.now() - startedAt >= deadlineMs) {
            break;
        }

        const coordinates = await geocodeLocation(location);
        lookups += 1;

        if (coordinates) {
            coordinatesByLocation.set(location, coordinates);
        }
    }

    return coordinatesByLocation;
}

export function warmGeocodeCache() {
    // Intentionally disabled: background geocoding starves live search requests.
}

export async function geocodeAddress(location) {
    const result = await fetchGeocodeResult(location);
    await setCachedGeocode(location.trim(), result);
    return result;
}
