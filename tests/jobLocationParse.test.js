import { describe, it, expect } from 'vitest';
import {
    parseJobLocationSites,
    resolveJobLocationBuckets,
    US_REMOTE_HYBRID_BUCKET,
} from '../utils/jobLocationParse.js';

describe('jobLocationParse utils', () => {
    it('extracts city and state pairs from compound location strings', () => {
        expect(
            parseJobLocationSites(
                'San Francisco, CA; New York, NY; Seattle, WA',
            ),
        ).toEqual(['San Francisco, CA', 'New York, NY', 'Seattle, WA']);
    });

    it('maps common nyc aliases to a geocodable site', () => {
        expect(parseJobLocationSites('NYC')).toEqual(['New York, NY']);
        expect(parseJobLocationSites('SF, NYC, SEA').sort()).toEqual(
            ['New York, NY', 'San Francisco, CA', 'Seattle, WA'].sort(),
        );
    });

    it('returns an empty list for remote-only locations', () => {
        expect(parseJobLocationSites('Remote - US')).toEqual([]);
        expect(parseJobLocationSites('US-Remote')).toEqual([]);
    });

    it('keeps on-site offices when remote is also listed', () => {
        expect(
            parseJobLocationSites(
                'San Francisco, CA; New York, NY; US-West Remote',
            ).sort(),
        ).toEqual(['New York, NY', 'San Francisco, CA'].sort());
    });

    it('strips united states suffixes from location buckets', () => {
        expect(parseJobLocationSites('New York, NY • United States')).toEqual([
            'New York, NY',
        ]);
        expect(parseJobLocationSites('United States')).toEqual([]);
        expect(parseJobLocationSites('USA')).toEqual([]);
    });

    it('resolves location buckets without country-only entries', () => {
        expect(
            resolveJobLocationBuckets('New York, NY • United States'),
        ).toEqual(['New York, NY']);
        expect(resolveJobLocationBuckets('United States')).toEqual([]);
        expect(resolveJobLocationBuckets('Remote - US')).toEqual([
            US_REMOTE_HYBRID_BUCKET,
        ]);
    });

    it('normalizes full state names and strips country suffixes', () => {
        expect(resolveJobLocationBuckets('New York, New York, USA')).toEqual([
            'New York, NY',
        ]);
        expect(parseJobLocationSites('New York, New York, USA')).toEqual([
            'New York, NY',
        ]);
    });

    it('consolidates remote and hybrid US locations into one bucket', () => {
        expect(resolveJobLocationBuckets('Hybrid')).toEqual([US_REMOTE_HYBRID_BUCKET]);
        expect(resolveJobLocationBuckets('Remote - USA')).toEqual([
            US_REMOTE_HYBRID_BUCKET,
        ]);
        expect(resolveJobLocationBuckets('Hybrid / Remote - US')).toEqual([
            US_REMOTE_HYBRID_BUCKET,
        ]);
    });

    it('excludes foreign locations from location buckets', () => {
        expect(resolveJobLocationBuckets('Paris, France')).toEqual([]);
        expect(resolveJobLocationBuckets('Jakarta, Indonesia')).toEqual([]);
        expect(resolveJobLocationBuckets('Jakarta')).toEqual([]);
        expect(resolveJobLocationBuckets('Oslo, Norway')).toEqual([]);
        expect(resolveJobLocationBuckets('London, UK')).toEqual([]);
        expect(resolveJobLocationBuckets('Remote - India')).toEqual([]);
    });

    it('keeps US cities that share names with foreign locations', () => {
        expect(resolveJobLocationBuckets('Paris, TX')).toEqual(['Paris, TX']);
    });
});
