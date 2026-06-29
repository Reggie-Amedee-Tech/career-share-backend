import cityCoordinates from '../data/us-city-coordinates.json' with { type: 'json' };
import { normalizeState } from './locationPrefilter.js';

const coordinatesByKey = new Map(
    Object.entries(cityCoordinates).map(([location, coordinates]) => [
        normalizeLocationKey(location),
        {
            location,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            countryShortName: 'US',
        },
    ]),
);

function normalizeLocationKey(location) {
    const trimmed = location?.trim() ?? '';
    if (!trimmed) {
        return '';
    }

    const cityStateMatch = trimmed.match(/^(.+?),\s*([A-Za-z][A-Za-z .'-]+)$/);
    if (!cityStateMatch) {
        return trimmed.toLowerCase();
    }

    const city = cityStateMatch[1].trim();
    const state = normalizeState(cityStateMatch[2]);
    if (!state) {
        return trimmed.toLowerCase();
    }

    return `${city}, ${state}`.toLowerCase();
}

export function lookupUsCityCoordinates(location) {
    const key = normalizeLocationKey(location);
    if (!key) {
        return null;
    }

    return coordinatesByKey.get(key) ?? null;
}
