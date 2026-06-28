import 'dotenv/config';
import { vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        professionalJourney: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        resource: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        vote: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed-password'),
        compare: vi.fn(),
    },
}));

vi.mock('../utils/geocode.js', () => ({
    geocodeAddress: vi.fn().mockResolvedValue({
        location: '123 Main St, New York, NY 10001, United States',
        latitude: 40.7484,
        longitude: -73.9967,
        countryShortName: 'US',
    }),
    geocodeLocation: vi.fn(async (location) => {
        const lookup = {
            'new york, ny': { latitude: 40.7484, longitude: -73.9967 },
            'san francisco, ca': { latitude: 37.7749, longitude: -122.4194 },
        };

        return lookup[location.trim().toLowerCase()] ?? null;
    }),
    geocodeLocations: vi.fn(async (locations) => {
        const lookup = {
            'new york, ny': { latitude: 40.7484, longitude: -73.9967 },
            'san francisco, ca': { latitude: 37.7749, longitude: -122.4194 },
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
    warmGeocodeCache: vi.fn(),
    clearGeocodeCache: vi.fn(),
    DEFAULT_MAX_GEOCODE_LOOKUPS: 15,
    DEFAULT_GEOCODE_DEADLINE_MS: 8000,
}));

process.env.NODE_ENV = 'test';

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is required. Add it to your .env file.');
}

