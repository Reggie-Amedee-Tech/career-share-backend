import { describe, it, expect } from 'vitest';
import { analyzeJobSkills, extractSkillsFromJob } from '../utils/jobSkills.js';
import { US_REMOTE_HYBRID_BUCKET } from '../utils/jobLocationParse.js';

const mockJobs = [
    {
        title: 'Software Engineer',
        location: 'New York, NY',
        description: 'Build APIs with Python, PostgreSQL, and Docker on AWS.',
    },
    {
        title: 'Backend Engineer',
        location: 'San Francisco, CA',
        description: 'Strong Python and SQL experience required. Kubernetes a plus.',
    },
    {
        title: 'Software Engineer',
        location: 'New York, NY; Remote',
        description: 'React, TypeScript, and REST APIs. Excellent communication skills.',
    },
];

describe('jobSkills', () => {
    it('extracts known skills from a job description', () => {
        expect(extractSkillsFromJob(mockJobs[0])).toEqual(
            expect.arrayContaining(['Python', 'PostgreSQL', 'Docker', 'AWS']),
        );
    });

    it('ranks overall skills by frequency across matching jobs', () => {
        const insights = analyzeJobSkills(mockJobs);

        expect(insights.totalJobsAnalyzed).toBe(3);
        expect(insights.topSkills[0]).toEqual(
            expect.objectContaining({ skill: 'Python', count: 2 }),
        );
    });

    it('groups skill demand by parsed job locations', () => {
        const insights = analyzeJobSkills(mockJobs);
        const newYork = insights.skillsByLocation.find(
            (entry) => entry.location === 'New York, NY',
        );
        const sanFrancisco = insights.skillsByLocation.find(
            (entry) => entry.location === 'San Francisco, CA',
        );

        expect(newYork?.jobCount).toBe(2);
        expect(newYork?.skills.some((entry) => entry.skill === 'Python')).toBe(true);
        expect(sanFrancisco?.jobCount).toBe(1);
        expect(sanFrancisco?.skills.some((entry) => entry.skill === 'Python')).toBe(true);
    });

    it('excludes united states-only locations from location breakdowns', () => {
        const insights = analyzeJobSkills([
            {
                title: 'Software Engineer',
                location: 'United States',
                description: 'Python and React.',
            },
            {
                title: 'Software Engineer',
                location: 'New York, NY • United States',
                description: 'Python and React.',
            },
        ]);

        expect(insights.skillsByLocation).toEqual([
            expect.objectContaining({
                location: 'New York, NY',
                jobCount: 1,
            }),
        ]);
        expect(
            insights.skillsByLocation.some(
                (entry) => entry.location.toLowerCase().includes('united states'),
            ),
        ).toBe(false);
    });

    it('merges duplicate city variants and remote formats into canonical buckets', () => {
        const insights = analyzeJobSkills([
            {
                title: 'Software Engineer',
                location: 'New York, NY',
                description: 'Python and React.',
            },
            {
                title: 'Software Engineer',
                location: 'New York, New York, USA',
                description: 'Python and React.',
            },
            {
                title: 'Software Engineer',
                location: 'Remote - US',
                description: 'Python and React.',
            },
            {
                title: 'Software Engineer',
                location: 'Hybrid - USA',
                description: 'Python and React.',
            },
            {
                title: 'Software Engineer',
                location: 'Paris, France',
                description: 'Python and React.',
            },
        ]);

        expect(insights.skillsByLocation).toEqual([
            expect.objectContaining({
                location: 'New York, NY',
                jobCount: 2,
            }),
            expect.objectContaining({
                location: US_REMOTE_HYBRID_BUCKET,
                jobCount: 2,
            }),
        ]);
        expect(
            insights.skillsByLocation.some((entry) =>
                entry.location.toLowerCase().includes('paris'),
            ),
        ).toBe(false);
    });
});
