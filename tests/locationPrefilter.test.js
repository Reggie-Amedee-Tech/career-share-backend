import { describe, it, expect } from 'vitest';
import {
    extractStateAbbreviations,
    getEligibleUsStates,
    locationIsForeignForBucket,
    locationIsUsDomestic,
    locationMentionsForeignCountry,
    locationWorthGeocoding,
} from '../utils/locationPrefilter.js';
import { mockUser } from './fixtures.js';

describe('locationPrefilter utils', () => {
    it('extracts US state abbreviations from a location string', () => {
        expect(extractStateAbbreviations('New York, NY')).toEqual(new Set(['NY']));
        expect(extractStateAbbreviations('San Francisco, California')).toEqual(
            new Set(['CA']),
        );
    });

    it('detects foreign locations for a US user', () => {
        expect(locationMentionsForeignCountry('Toronto, Canada', mockUser)).toBe(
            true,
        );
        expect(locationMentionsForeignCountry('Bangalore, India', mockUser)).toBe(
            true,
        );
        expect(locationMentionsForeignCountry('New York, NY', mockUser)).toBe(
            false,
        );
        expect(locationMentionsForeignCountry('Remote - US', mockUser)).toBe(
            false,
        );
    });

    it('detects foreign locations for journey buckets without flagging US cities', () => {
        expect(locationIsForeignForBucket('Paris, France')).toBe(true);
        expect(locationIsForeignForBucket('Jakarta, Indonesia')).toBe(true);
        expect(locationIsForeignForBucket('Jakarta')).toBe(true);
        expect(locationIsForeignForBucket('Tokyo')).toBe(true);
        expect(locationIsForeignForBucket('Paris, TX')).toBe(false);
        expect(locationIsForeignForBucket('New York, NY')).toBe(false);
        expect(locationIsForeignForBucket('Remote, US')).toBe(false);
        expect(locationIsForeignForBucket('NYC')).toBe(false);
    });

    it('identifies US domestic locations without hardcoded country lists', () => {
        expect(locationIsUsDomestic('San Francisco, CA')).toBe(true);
        expect(locationIsUsDomestic('Remote - US')).toBe(true);
        expect(locationIsUsDomestic('Hybrid')).toBe(true);
        expect(locationIsUsDomestic('Seattle')).toBe(true);
        expect(locationIsUsDomestic('Oslo, Norway')).toBe(false);
        expect(locationIsUsDomestic('Remote - India')).toBe(false);
    });

    it('limits eligible states for a small radius search', () => {
        const eligibleStates = getEligibleUsStates('NY', 10);
        expect(eligibleStates?.has('NY')).toBe(true);
        expect(eligibleStates?.has('NJ')).toBe(true);
        expect(eligibleStates?.has('CA')).toBe(false);
    });

    it('skips geocoding far-away US locations for a small radius', () => {
        expect(
            locationWorthGeocoding('San Francisco, CA', mockUser, 10),
        ).toBe(false);
        expect(locationWorthGeocoding('Jersey City, NJ', mockUser, 10)).toBe(
            true,
        );
        expect(locationWorthGeocoding('New York, NY', mockUser, 10)).toBe(
            true,
        );
    });

    it('skips geocoding foreign locations', () => {
        expect(locationWorthGeocoding('Toronto, Canada', mockUser, 250)).toBe(
            false,
        );
        expect(locationWorthGeocoding('Mumbai, India', mockUser, 250)).toBe(
            false,
        );
    });

    it('skips geocoding vague or country-wide locations for a small radius', () => {
        expect(locationWorthGeocoding('United States', mockUser, 10)).toBe(
            false,
        );
        expect(locationWorthGeocoding('Americas', mockUser, 10)).toBe(false);
        expect(locationWorthGeocoding('EMEA', mockUser, 10)).toBe(false);
    });
});
