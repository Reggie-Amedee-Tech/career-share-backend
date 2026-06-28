import {
    locationIsForeignForBucket,
    normalizeState,
    US_CITY_ALIAS_SITES,
} from './locationPrefilter.js';

const REMOTE_KEYWORDS = ['remote', 'hybrid', 'work from home', 'wfh'];
export const US_REMOTE_HYBRID_BUCKET = 'Remote / Hybrid (US)';

const UNITED_STATES_ONLY_PATTERN =
    /^(?:united states(?:\s+of\s+america)?|usa|u\.?\s?s\.?\s?a\.?)$/i;

const REMOTE_HYBRID_PATTERN = /\b(?:remote|hybrid|work from home|wfh)\b/i;

const CITY_FULL_STATE_PATTERN =
    /\b([A-Za-z][A-Za-z .'-]*),\s*([A-Za-z][A-Za-z .'-]+)\b/g;

function isRemoteLocation(locationName) {
    const normalized = locationName.toLowerCase();
    return REMOTE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

const CITY_STATE_PATTERN = /\b([A-Za-z][A-Za-z .'-]*),\s*([A-Z]{2})\b/g;

const LOCATION_ALIAS_SITES = US_CITY_ALIAS_SITES;

function isRemoteOnlySite(site) {
    const normalized = site.toLowerCase().trim();
    if (!isRemoteLocation(normalized)) {
        return false;
    }

    return !/\b[A-Za-z][A-Za-z .'-]*,\s*[A-Z]{2}\b/.test(site);
}

export function isRemoteOnlyLocation(locationName) {
    const location = locationName?.trim() ?? '';
    if (!location) {
        return false;
    }

    if (parseJobLocationSites(location).length > 0) {
        return false;
    }

    return isRemoteLocation(location);
}

export function isUnitedStatesOnlyLocation(locationName) {
    const normalized = locationName?.trim() ?? '';
    if (!normalized) {
        return false;
    }

    return UNITED_STATES_ONLY_PATTERN.test(normalized);
}

export function stripUnitedStatesSuffix(locationName) {
    const location = locationName?.trim() ?? '';
    if (!location) {
        return '';
    }

    return location
        .replace(/\s*[•·|]\s*united states(?:\s+of\s+america)?\s*$/i, '')
        .replace(/,\s*united states(?:\s+of\s+america)?\s*$/i, '')
        .replace(/\s*-\s*united states(?:\s+of\s+america)?\s*$/i, '')
        .trim();
}

function canonicalizeUsCityState(location) {
    const abbrMatch = location.match(/^(.+?),\s*([A-Z]{2})$/);
    if (abbrMatch) {
        const state = normalizeState(abbrMatch[2]);
        if (state) {
            return `${abbrMatch[1].trim()}, ${state}`;
        }
    }

    const fullMatch = location.match(/^(.+?),\s*([A-Za-z][A-Za-z .'-]+)$/);
    if (fullMatch) {
        const state = normalizeState(fullMatch[2]);
        if (state) {
            return `${fullMatch[1].trim()}, ${state}`;
        }
    }

    return null;
}

function canonicalizeUsRemoteHybridBucket(location) {
    if (!REMOTE_HYBRID_PATTERN.test(location)) {
        return null;
    }

    if (canonicalizeUsCityState(location)) {
        return null;
    }

    return US_REMOTE_HYBRID_BUCKET;
}

export function normalizeLocationBucket(locationName) {
    const location = locationName?.trim() ?? '';
    if (!location || locationIsForeignForBucket(location)) {
        return null;
    }

    const stripped = stripUnitedStatesSuffix(location);
    if (!stripped || isUnitedStatesOnlyLocation(stripped)) {
        return null;
    }

    const remoteBucket = canonicalizeUsRemoteHybridBucket(stripped);
    if (remoteBucket) {
        return remoteBucket;
    }

    const cityState = canonicalizeUsCityState(stripped);
    if (cityState) {
        return cityState;
    }

    return stripped;
}

export function resolveJobLocationBuckets(locationName) {
    const sites = parseJobLocationSites(locationName);
    const candidates = sites.length > 0 ? sites : [locationName?.trim()].filter(Boolean);
    const buckets = new Set();

    for (const candidate of candidates) {
        const normalized = normalizeLocationBucket(candidate);
        if (normalized) {
            buckets.add(normalized);
        }
    }

    return [...buckets];
}

export function parseJobLocationSites(locationName) {
    const location = locationName?.trim() ?? '';
    if (!location) {
        return [];
    }

    const sites = new Set();

    for (const match of location.matchAll(CITY_STATE_PATTERN)) {
        const city = match[1].trim();
        const state = match[2];

        if (!city) {
            continue;
        }

        const site = `${city}, ${state}`;
        if (!isRemoteOnlySite(site)) {
            sites.add(site);
        }
    }

    for (const match of location.matchAll(CITY_FULL_STATE_PATTERN)) {
        const city = match[1].trim();
        const statePart = match[2].trim();
        const state = normalizeState(statePart);

        if (!city || !state) {
            continue;
        }

        const site = `${city}, ${state}`;
        if (!isRemoteOnlySite(site)) {
            sites.add(site);
        }
    }

    for (const [pattern, site] of LOCATION_ALIAS_SITES) {
        if (pattern.test(location) && !isRemoteOnlySite(site)) {
            sites.add(site);
        }
    }

    if (sites.size > 0) {
        return [...sites];
    }

    if (isRemoteLocation(location)) {
        return [];
    }

    const normalized = normalizeLocationBucket(location);
    return normalized ? [normalized] : [];
}
