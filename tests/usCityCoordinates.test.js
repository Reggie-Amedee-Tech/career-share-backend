import { describe, expect, it } from 'vitest';
import { lookupUsCityCoordinates } from '../utils/usCityCoordinates.js';

describe('lookupUsCityCoordinates', () => {
    it('returns coordinates for canonical city, state strings', () => {
        expect(lookupUsCityCoordinates('New York, NY')).toMatchObject({
            latitude: 40.7128,
            longitude: -74.006,
            countryShortName: 'US',
        });
    });

    it('normalizes full state names and casing', () => {
        expect(lookupUsCityCoordinates('san francisco, california')).toMatchObject({
            latitude: 37.7749,
            longitude: -122.4194,
        });
    });

    it('returns null for unknown locations', () => {
        expect(lookupUsCityCoordinates('Remote / Hybrid (US)')).toBeNull();
        expect(lookupUsCityCoordinates('Smallville, KS')).toBeNull();
    });
});
