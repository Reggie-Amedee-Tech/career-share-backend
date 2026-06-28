import { describe, it, expect, vi } from 'vitest';
import {
    buildLocationTerms,
    filterJobsByLocationTerm,
    filterJobsByUserLocation,
    filterJobsNearUser,
    isRemoteJob,
    jobIsWithinRadius,
    jobMatchesLocationTerm,
    jobMatchesUserLocation,
    remoteJobMatchesUserCountry,
} from '../utils/jobLocation.js';
import { mockUser } from './fixtures.js';

const mockJobs = [
    {
        id: 1,
        title: 'Engineer',
        location: 'New York, NY',
        companyName: 'Stripe',
    },
    {
        id: 2,
        title: 'Designer',
        location: 'San Francisco, CA',
        companyName: 'Stripe',
    },
    {
        id: 3,
        title: 'Support',
        location: 'Remote - US',
        companyName: 'Stripe',
    },
    {
        id: 4,
        title: 'Sales',
        location: 'Tokyo, Japan',
        companyName: 'Stripe',
    },
    {
        id: 5,
        title: 'Analyst',
        location: 'Remote - India',
        companyName: 'Stripe',
    },
];

vi.mock('../utils/geocode.js', () => ({
    geocodeLocations: vi.fn(async (locations) => {
        const lookup = {
            'new york, ny': { latitude: 40.7484, longitude: -73.9967 },
            'san francisco, ca': { latitude: 37.7749, longitude: -122.4194 },
            'tokyo, japan': { latitude: 35.6762, longitude: 139.6503 },
        };
        const coordinatesByLocation = new Map();

        for (const location of locations) {
            const coordinates = lookup[location.trim().toLowerCase()];
            if (coordinates) {
                coordinatesByLocation.set(location, coordinates);
            }
        }

        return coordinatesByLocation;
    }),
    DEFAULT_MAX_GEOCODE_LOOKUPS: 15,
    DEFAULT_GEOCODE_DEADLINE_MS: 8000,
}));

describe('jobLocation utils', () => {
    it('builds location terms from user address fields', () => {
        expect(buildLocationTerms(mockUser)).toEqual([
            'new york',
            'ny',
            'united states',
            'us',
        ]);
    });

    it('detects remote jobs', () => {
        expect(isRemoteJob('Remote - US')).toBe(true);
        expect(isRemoteJob('New York, NY')).toBe(false);
    });

    it('matches remote jobs only for the user country', () => {
        expect(remoteJobMatchesUserCountry('Remote - US', mockUser)).toBe(true);
        expect(remoteJobMatchesUserCountry('Remote - India', mockUser)).toBe(false);
        expect(remoteJobMatchesUserCountry('Remote - Canada', mockUser)).toBe(false);
    });

    it('matches jobs in the user city or state', () => {
        expect(jobMatchesUserLocation(mockJobs[0], mockUser)).toBe(true);
        expect(jobMatchesUserLocation(mockJobs[1], mockUser)).toBe(false);
    });

    it('includes only country-matched remote jobs for any user location', () => {
        expect(jobMatchesUserLocation(mockJobs[2], mockUser)).toBe(true);
        expect(jobMatchesUserLocation(mockJobs[5 - 1], mockUser)).toBe(false);
    });

    it('filters jobs by user location', () => {
        const filtered = filterJobsByUserLocation(mockJobs, mockUser);
        expect(filtered.map((job) => job.id)).toEqual([1, 3]);
    });

    it('matches jobs by a custom location term', () => {
        expect(jobMatchesLocationTerm(mockJobs[1], 'san francisco')).toBe(true);
        expect(jobMatchesLocationTerm(mockJobs[0], 'san francisco')).toBe(false);
    });

    it('matches remote jobs when searching for remote', () => {
        expect(jobMatchesLocationTerm(mockJobs[2], 'remote')).toBe(true);
    });

    it('filters jobs by a custom location term', () => {
        const filtered = filterJobsByLocationTerm(mockJobs, 'tokyo');
        expect(filtered.map((job) => job.id)).toEqual([4]);
    });

    it('filters jobs within a radius of the user', async () => {
        const filtered = await filterJobsNearUser(mockJobs, mockUser, 50);
        expect(filtered.map((job) => job.id)).toEqual([1]);
    });

    it('excludes remote jobs from near-me radius searches', async () => {
        const filtered = await filterJobsNearUser(mockJobs, mockUser, 3000);
        expect(filtered.map((job) => job.id)).toEqual([1, 2]);
    });

    it('checks whether a job is within a radius using cached coordinates', () => {
        const coordinatesByLocation = new Map([
            ['New York, NY', { latitude: 40.7484, longitude: -73.9967 }],
            ['San Francisco, CA', { latitude: 37.7749, longitude: -122.4194 }],
        ]);

        expect(
            jobIsWithinRadius(mockJobs[0], mockUser, 50, coordinatesByLocation),
        ).toBe(true);
        expect(
            jobIsWithinRadius(mockJobs[1], mockUser, 50, coordinatesByLocation),
        ).toBe(false);
        expect(
            jobIsWithinRadius(mockJobs[2], mockUser, 50, coordinatesByLocation),
        ).toBe(false);
        expect(
            jobIsWithinRadius(mockJobs[4], mockUser, 50, coordinatesByLocation),
        ).toBe(false);
    });

    it('matches compound locations when any site is within the radius', () => {
        const compoundJob = {
            id: 6,
            title: 'Hybrid Engineer',
            location: 'San Francisco, CA; New York, NY',
            companyName: 'Stripe',
        };
        const coordinatesByLocation = new Map([
            ['New York, NY', { latitude: 40.7484, longitude: -73.9967 }],
            ['San Francisco, CA', { latitude: 37.7749, longitude: -122.4194 }],
        ]);

        expect(
            jobIsWithinRadius(compoundJob, mockUser, 50, coordinatesByLocation),
        ).toBe(true);
        expect(
            jobIsWithinRadius(compoundJob, mockUser, 10, coordinatesByLocation),
        ).toBe(true);
    });
});
