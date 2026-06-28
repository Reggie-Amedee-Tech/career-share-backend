import { describe, it, expect } from 'vitest';
import {
    classifyJobSearchMatch,
    filterJobsBySearch,
    filterJobsBySkills,
    jobMatchesSearch,
    jobMatchesSkills,
    SEARCH_MATCH_RANK,
} from '../utils/jobSearch.js';

const mockJobs = [
    {
        id: 1,
        title: 'Software Engineer',
        companyName: 'Stripe',
        location: 'New York, NY',
        description:
            'Build payment APIs with Python, PostgreSQL, and distributed systems experience.',
    },
    {
        id: 2,
        title: 'Product Designer',
        companyName: 'Figma',
        location: 'San Francisco, CA',
        description: 'Design product flows and collaborate with engineering teams.',
    },
    {
        id: 3,
        title: 'Customer Support',
        companyName: 'Airbnb',
        location: 'Remote - US',
        description: 'Support guests and hosts with strong communication skills.',
    },
];

describe('jobSearch utils', () => {
    it('matches jobs when search is empty', () => {
        expect(jobMatchesSearch(mockJobs[0], '')).toBe(true);
        expect(jobMatchesSearch(mockJobs[0], '   ')).toBe(true);
    });

    it('matches jobs by title, company, or location', () => {
        expect(jobMatchesSearch(mockJobs[0], 'engineer')).toBe(true);
        expect(jobMatchesSearch(mockJobs[1], 'figma')).toBe(true);
        expect(jobMatchesSearch(mockJobs[2], 'remote')).toBe(true);
        expect(jobMatchesSearch(mockJobs[0], 'designer')).toBe(false);
    });

    it('requires all search terms to match', () => {
        expect(jobMatchesSearch(mockJobs[0], 'software engineer')).toBe(true);
        expect(jobMatchesSearch(mockJobs[0], 'software designer')).toBe(false);
    });

    it('matches multi-word phrases in the job description', () => {
        const job = {
            ...mockJobs[0],
            title: 'Analytics Lead',
            description: 'Partner with data analyst teams across the company.',
        };

        expect(jobMatchesSearch(job, 'data analyst')).toBe(true);
    });

    it('expands known journey roles to related titles', () => {
        const jobs = [
            {
                id: 1,
                title: 'Data Analyst',
                companyName: 'Stripe',
                location: 'New York, NY',
                description: '',
            },
            {
                id: 2,
                title: 'Business Intelligence Analyst',
                companyName: 'Figma',
                location: 'San Francisco, CA',
                description: '',
            },
            {
                id: 3,
                title: 'Software Engineer',
                companyName: 'Airbnb',
                location: 'Remote - US',
                description: '',
            },
        ];

        const filtered = filterJobsBySearch(jobs, 'Data Analyst');
        expect(filtered.map((job) => job.id)).toEqual([1, 2]);
    });

    it('filters jobs by search terms', () => {
        const filtered = filterJobsBySearch(mockJobs, 'remote');
        expect(filtered.map((job) => job.id)).toEqual([3]);
    });

    it('matches jobs by required skills in the description', () => {
        expect(jobMatchesSkills(mockJobs[0], 'python')).toBe(true);
        expect(jobMatchesSkills(mockJobs[0], 'python postgresql')).toBe(true);
        expect(jobMatchesSkills(mockJobs[0], 'python react')).toBe(false);
        expect(jobMatchesSkills(mockJobs[1], 'figma')).toBe(false);
    });

    it('matches all jobs when skills search is empty', () => {
        expect(jobMatchesSkills(mockJobs[0], '')).toBe(true);
        expect(jobMatchesSkills(mockJobs[0], '   ')).toBe(true);
    });

    it('filters jobs by skills terms', () => {
        const filtered = filterJobsBySkills(mockJobs, 'python postgresql');
        expect(filtered.map((job) => job.id)).toEqual([1]);
    });

    it('ranks title phrase matches ahead of description-only matches', () => {
        const titleMatch = {
            id: 1,
            title: 'Senior Data Engineer',
            companyName: 'Discord',
            location: 'Remote',
            description: 'Build data pipelines.',
        };
        const descriptionMatch = {
            id: 2,
            title: 'Product Lead, Data Products',
            companyName: 'Stripe',
            location: 'New York, NY',
            description: 'Partner with data engineer teams.',
        };

        expect(classifyJobSearchMatch(titleMatch, 'data engineer')).toBe(
            SEARCH_MATCH_RANK.TITLE_PHRASE,
        );
        expect(classifyJobSearchMatch(descriptionMatch, 'data engineer')).toBe(
            SEARCH_MATCH_RANK.DESCRIPTION_PHRASE,
        );
    });

    it('ranks journey role title matches ahead of description matches', () => {
        const exact = {
            id: 1,
            title: 'Data Analyst',
            companyName: 'Stripe',
            location: 'New York, NY',
            description: '',
        };
        const related = {
            id: 2,
            title: 'Business Intelligence Analyst',
            companyName: 'Figma',
            location: 'San Francisco, CA',
            description: '',
        };
        const description = {
            id: 3,
            title: 'Product Manager',
            companyName: 'Airbnb',
            location: 'Remote',
            description: 'Work closely with data analyst partners.',
        };

        expect(classifyJobSearchMatch(exact, 'Data Analyst')).toBe(
            SEARCH_MATCH_RANK.TITLE_PHRASE,
        );
        expect(classifyJobSearchMatch(related, 'Data Analyst')).toBe(
            SEARCH_MATCH_RANK.TITLE_TERMS,
        );
        expect(classifyJobSearchMatch(description, 'Data Analyst')).toBe(
            SEARCH_MATCH_RANK.DESCRIPTION_PHRASE,
        );
    });
});
