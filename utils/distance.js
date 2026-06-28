const EARTH_RADIUS_MILES = 3958.8;

export const DEFAULT_RADIUS_MILES = 50;
export const MAX_RADIUS_MILES = 500;

function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

export function distanceInMiles(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) ** 2;

    return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseRadiusMiles(value, fallback = DEFAULT_RADIUS_MILES) {
    const parsed = Number.parseInt(String(value ?? ''), 10);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }

    return Math.min(parsed, MAX_RADIUS_MILES);
}
