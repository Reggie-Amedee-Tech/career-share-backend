import { distanceInMiles, DEFAULT_RADIUS_MILES } from './distance.js';
import {
    DEFAULT_GEOCODE_DEADLINE_MS,
    DEFAULT_MAX_GEOCODE_LOOKUPS,
    geocodeLocations,
} from './geocode.js';
import { locationWorthGeocoding } from './locationPrefilter.js';
import { parseJobLocationSites, isRemoteOnlyLocation } from './jobLocationParse.js';

export function buildLocationTerms(user) {
    const terms = [user.city, user.state, user.country, user.countryShortName]
        .map((value) => value?.trim().toLowerCase())
        .filter(Boolean);

    return [...new Set(terms)];
}

export function isRemoteJob(locationName) {
    return isRemoteOnlyLocation(locationName);
}

function buildUserCountryTerms(user) {
    return [user.country, user.countryShortName]
        .map((value) => value?.trim().toLowerCase())
        .filter(Boolean);
}

export function remoteJobMatchesUserCountry(locationName, user) {
    const countryTerms = buildUserCountryTerms(user);
    if (countryTerms.length === 0) {
        return false;
    }

    const normalizedLocation = locationName.toLowerCase();
    return countryTerms.some((term) => normalizedLocation.includes(term));
}

export function jobMatchesUserLocation(job, user) {
    const locationName = job.location?.trim() ?? '';

    if (!locationName) {
        return false;
    }

    if (isRemoteJob(locationName)) {
        return remoteJobMatchesUserCountry(locationName, user);
    }

    const terms = buildLocationTerms(user);
    const normalizedLocation = locationName.toLowerCase();

    return terms.some((term) => normalizedLocation.includes(term));
}

export function filterJobsByUserLocation(jobs, user) {
    return jobs.filter((job) => jobMatchesUserLocation(job, user));
}

export function jobMatchesLocationTerm(job, locationTerm) {
    const normalizedTerm = locationTerm?.trim().toLowerCase() ?? '';
    if (!normalizedTerm) {
        return true;
    }

    const locationName = job.location?.trim().toLowerCase() ?? '';
    if (!locationName) {
        return false;
    }

    if (normalizedTerm.includes('remote') && isRemoteJob(locationName)) {
        return true;
    }

    return locationName.includes(normalizedTerm);
}

export function filterJobsByLocationTerm(jobs, locationTerm) {
    return jobs.filter((job) => jobMatchesLocationTerm(job, locationTerm));
}

function siteIsWithinRadius(site, user, radiusMiles, coordinatesByLocation) {
    const coordinates = coordinatesByLocation.get(site);
    if (!coordinates) {
        return false;
    }

    const distance = distanceInMiles(
        user.latitude,
        user.longitude,
        coordinates.latitude,
        coordinates.longitude,
    );

    return distance <= radiusMiles;
}

export function jobIsWithinRadius(job, user, radiusMiles, coordinatesByLocation) {
    const locationName = job.location?.trim() ?? '';
    if (!locationName) {
        return false;
    }

    if (isRemoteJob(locationName)) {
        return false;
    }

    const sites = parseJobLocationSites(locationName);
    return sites.some((site) =>
        siteIsWithinRadius(site, user, radiusMiles, coordinatesByLocation),
    );
}

function collectGeocodableSites(jobs, user, radiusMiles) {
    const sites = new Set();

    for (const job of jobs) {
        const locationName = job.location?.trim() ?? '';
        if (!locationName || isRemoteJob(locationName)) {
            continue;
        }

        for (const site of parseJobLocationSites(locationName)) {
            if (
                !isRemoteJob(site) &&
                locationWorthGeocoding(site, user, radiusMiles)
            ) {
                sites.add(site);
            }
        }
    }

    return [...sites];
}

function sitePriority(site, user) {
    let score = 0;
    const normalizedSite = site.toLowerCase();
    const normalizedCity = user.city?.trim().toLowerCase() ?? '';
    const normalizedState = user.state?.trim().toUpperCase() ?? '';

    if (normalizedCity && normalizedSite.includes(normalizedCity)) {
        score += 3;
    }

    if (normalizedState && normalizedSite.includes(normalizedState.toLowerCase())) {
        score += 2;
    }

    if (normalizedCity === 'new york' && normalizedSite.includes('nyc')) {
        score += 3;
    }

    return score;
}

function compareSitePriority(user) {
    return (left, right) => sitePriority(right, user) - sitePriority(left, user);
}

export async function filterJobsNearUser(
    jobs,
    user,
    radiusMiles = DEFAULT_RADIUS_MILES,
) {
    if (!Number.isFinite(user?.latitude) || !Number.isFinite(user?.longitude)) {
        return filterJobsByUserLocation(jobs, user).filter(
            (job) => !isRemoteJob(job.location ?? ''),
        );
    }

    const uniqueSites = collectGeocodableSites(jobs, user, radiusMiles);

    const coordinatesByLocation = await geocodeLocations(uniqueSites, {
        maxLookups: DEFAULT_MAX_GEOCODE_LOOKUPS,
        deadlineMs: DEFAULT_GEOCODE_DEADLINE_MS,
        sortLocations: compareSitePriority(user),
    });

    return jobs.filter((job) =>
        jobIsWithinRadius(job, user, radiusMiles, coordinatesByLocation),
    );
}
