import { describe, it, expect, vi } from 'vitest';
import {
    buildJobLocationPoints,
    buildSkillHeatmap,
    groupJobsByTrackedLocations,
    MIN_JOURNEY_ANALYSIS_JOBS,
    selectJobsForSkillInsights,
} from '../utils/journeyInsights.js';
import { US_REMOTE_HYBRID_BUCKET } from '../utils/jobLocationParse.js';

vi.mock('../utils/geocode.js', () => ({
    geocodeLocations: vi.fn(async (locations) => {
        const map = new Map();
        for (const location of locations) {
            if (location === 'New York, NY') {
                map.set(location, {
                    latitude: 40.7128,
                    longitude: -74.006,
                });
            }
            if (location === 'San Francisco, CA') {
                map.set(location, {
                    latitude: 37.7749,
                    longitude: -122.4194,
                });
            }
        }
        return map;
    }),
}));

const skillsByLocation = [
    {
        location: 'New York, NY',
        jobCount: 12,
        skills: [
            { skill: 'Python', count: 8, percentage: 66.7 },
            { skill: 'React', count: 5, percentage: 41.7 },
        ],
    },
    {
        location: 'San Francisco, CA',
        jobCount: 7,
        skills: [
            { skill: 'Python', count: 4, percentage: 57.1 },
            { skill: 'React', count: 6, percentage: 85.7 },
        ],
    },
    {
        location: US_REMOTE_HYBRID_BUCKET,
        jobCount: 3,
        skills: [{ skill: 'Python', count: 2, percentage: 66.7 }],
    },
];

const topSkills = [
    { skill: 'Python', count: 12, percentage: 60 },
    { skill: 'React', count: 11, percentage: 55 },
];

describe('journeyInsights', () => {
    it('selects all journey role matches for skill analysis', () => {
        const jobs = Array.from({ length: 1500 }, (_, index) => ({
            id: index,
            boardToken: index % 2 === 0 ? 'stripe' : 'figma',
            title: 'Software Engineer',
            location: `City ${index}`,
            updatedAt: new Date(2026, 0, 1 + (index % 28)).toISOString(),
        }));

        const selection = selectJobsForSkillInsights(jobs, 'software-engineer');

        expect(selection.totalTitleMatches).toBe(1500);
        expect(selection.totalLocationMatches).toBe(1500);
        expect(selection.exactTitleMatches).toBe(1500);
        expect(selection.relatedTitleMatches).toBe(0);
        expect(selection.jobs).toHaveLength(1500);
        expect(selection.locationScope).toBe('nationwide');
    });

    it('expands to nationwide title matches when focus market is below target', () => {
        const jobs = [
            {
                id: 1,
                boardToken: 'stripe',
                title: 'Data Analyst',
                location: 'New York, NY',
            },
            {
                id: 2,
                boardToken: 'figma',
                title: 'Data Analyst',
                location: 'San Francisco, CA',
            },
            {
                id: 3,
                boardToken: 'stripe',
                title: 'Analytics Engineer',
                location: 'New York, NY',
            },
            {
                id: 4,
                boardToken: 'figma',
                title: 'Data Analyst',
                location: 'Remote - US',
            },
        ];

        const selection = selectJobsForSkillInsights(
            jobs,
            'data-analyst',
            'New York, NY',
        );

        expect(selection.focusLocationMatches).toBe(2);
        expect(selection.totalTitleMatches).toBe(4);
        expect(selection.totalRoleMatches).toBe(4);
        expect(selection.totalLocationMatches).toBe(4);
        expect(selection.locationExpanded).toBe(true);
        expect(selection.locationScope).toBe('nationwide');
        expect(selection.jobs.map((job) => job.id)).toEqual([1, 3, 2, 4]);
    });

    it('includes description matches when title matches are still below target', () => {
        const jobs = [
            {
                id: 1,
                boardToken: 'stripe',
                title: 'Data Analyst',
                location: 'New York, NY',
            },
            {
                id: 2,
                boardToken: 'figma',
                title: 'Operations Associate',
                location: 'San Francisco, CA',
                description: 'Partner with the data analytics team on SQL reporting.',
            },
        ];

        const selection = selectJobsForSkillInsights(jobs, 'data-analyst');

        expect(selection.matchScope).toBe('title-and-description');
        expect(selection.matchScopeExpanded).toBe(true);
        expect(selection.descriptionMatches).toBe(1);
        expect(selection.jobs.map((job) => job.id)).toEqual([1, 2]);
    });

    it('includes remote roles when the target location is remote', () => {
        const jobs = [
            {
                id: 1,
                boardToken: 'stripe',
                title: 'Data Analyst',
                location: 'New York, NY',
            },
            {
                id: 2,
                boardToken: 'figma',
                title: 'Data Analyst',
                location: 'Remote - US',
            },
        ];

        const selection = selectJobsForSkillInsights(jobs, 'data-analyst', 'remote');

        expect(selection.focusLocationMatches).toBe(1);
        expect(selection.totalTitleMatches).toBe(2);
        expect(selection.jobs.map((job) => job.id)).toEqual([2, 1]);
        expect(selection.locationExpanded).toBe(true);
    });

    it('matches journey roles by title instead of company or location', () => {
        const jobs = [
            {
                id: 1,
                boardToken: 'stripe',
                title: 'Backend Engineer',
                location: 'New York, NY',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
                id: 2,
                boardToken: 'figma',
                title: 'Backend Engineer',
                location: 'San Francisco, CA',
                updatedAt: '2026-01-02T00:00:00.000Z',
            },
            {
                id: 3,
                boardToken: 'stripe',
                title: 'Designer',
                location: 'New York, NY',
                updatedAt: '2026-01-03T00:00:00.000Z',
            },
        ];

        const selection = selectJobsForSkillInsights(jobs, 'backend-engineer');

        expect(selection.totalTitleMatches).toBe(2);
        expect(selection.jobs.map((job) => job.id)).toEqual([1, 2]);
    });

    it('uses a 1000 role analysis target by default', () => {
        expect(MIN_JOURNEY_ANALYSIS_JOBS).toBe(1000);
    });

    it('builds a skill-by-location heatmap matrix', () => {
        const heatmap = buildSkillHeatmap(skillsByLocation, topSkills);

        expect(heatmap.locations).toEqual([
            'New York, NY',
            'San Francisco, CA',
            US_REMOTE_HYBRID_BUCKET,
        ]);
        expect(heatmap.skills).toEqual(['Python', 'React']);
        expect(heatmap.rows[0].values[0]).toEqual({
            location: 'New York, NY',
            count: 8,
            percentage: 66.7,
        });
        expect(heatmap.rows[1].values[1]).toEqual({
            location: 'San Francisco, CA',
            count: 6,
            percentage: 85.7,
        });
    });

    it('geocodes mappable locations for the job map', async () => {
        const points = await buildJobLocationPoints(skillsByLocation);

        const newYork = points.find((entry) => entry.location === 'New York, NY');
        const remote = points.find(
            (entry) => entry.location === US_REMOTE_HYBRID_BUCKET,
        );

        expect(newYork).toMatchObject({
            jobCount: 12,
            latitude: 40.7128,
            longitude: -74.006,
            jobs: [],
        });
        expect(remote).toMatchObject({
            jobCount: 3,
            latitude: null,
            longitude: null,
            jobs: [],
        });
    });

    it('groups analyzed jobs under tracked hiring locations', () => {
        const jobs = [
            {
                id: 1,
                boardToken: 'stripe',
                title: 'Backend Engineer',
                companyName: 'Stripe',
                location: 'New York, NY',
                absoluteUrl: 'https://boards.greenhouse.io/stripe/jobs/1',
                updatedAt: '2026-06-01T00:00:00.000Z',
            },
            {
                id: 2,
                boardToken: 'figma',
                title: 'Software Engineer',
                companyName: 'Figma',
                location: 'San Francisco, CA; Remote',
                absoluteUrl: 'https://boards.greenhouse.io/figma/jobs/2',
                updatedAt: '2026-06-02T00:00:00.000Z',
            },
            {
                id: 3,
                boardToken: 'stripe',
                title: 'Remote Engineer',
                companyName: 'Stripe',
                location: 'Remote - United States',
                absoluteUrl: 'https://boards.greenhouse.io/stripe/jobs/3',
                updatedAt: '2026-06-03T00:00:00.000Z',
            },
        ];

        const grouped = groupJobsByTrackedLocations(
            jobs,
            skillsByLocation.map((entry) => entry.location),
        );

        expect(grouped.get('New York, NY')).toEqual([
            expect.objectContaining({ id: 1, title: 'Backend Engineer' }),
        ]);
        expect(grouped.get('San Francisco, CA')).toEqual([
            expect.objectContaining({ id: 2, title: 'Software Engineer' }),
        ]);
        expect(grouped.get(US_REMOTE_HYBRID_BUCKET)).toEqual([
            expect.objectContaining({ id: 3, title: 'Remote Engineer' }),
        ]);
    });
});
