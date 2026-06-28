import { describe, it, expect } from 'vitest';
import {
    filterJobsByJourneyRole,
    phraseMatchesDescription,
    phraseMatchesTitle,
} from '../utils/jobTitleMatch.js';
import {
    isSupportedJourneyRole,
    listJourneyRoles,
    resolveJourneyRole,
} from '../utils/journeyRoles.js';

const mockJobs = [
    { id: 1, title: 'Data Analyst', companyName: 'Stripe' },
    { id: 2, title: 'Deal Desk Analyst - NYC', companyName: 'Datadog' },
    { id: 3, title: 'Analytics Engineer', companyName: 'DoorDash USA' },
    { id: 4, title: 'Staff Data Analyst', companyName: 'Stripe' },
    { id: 5, title: 'Software Engineer', companyName: 'Stripe' },
    { id: 6, title: 'Business Intelligence Analyst', companyName: 'Figma' },
    { id: 7, title: 'Growth Analyst', companyName: 'Airbnb' },
    {
        id: 8,
        title: 'Operations Associate',
        companyName: 'Stripe',
        description: 'Build reporting with SQL and Tableau for our data analytics program.',
    },
];

describe('journeyRoles', () => {
    it('lists curated roles for the journey picker', () => {
        const roles = listJourneyRoles();

        expect(roles.length).toBeGreaterThanOrEqual(10);
        expect(roles.some((role) => role.id === 'data-analyst')).toBe(true);
        expect(roles.every((role) => role.id && role.label)).toBe(true);
    });

    it('resolves roles by id or legacy label', () => {
        expect(resolveJourneyRole('data-analyst')?.label).toBe('Data Analyst');
        expect(resolveJourneyRole('Data Analyst')?.id).toBe('data-analyst');
        expect(isSupportedJourneyRole('software-engineer')).toBe(true);
        expect(isSupportedJourneyRole('Chief Happiness Officer')).toBe(false);
    });
});

describe('jobTitleMatch', () => {
    it('matches curated primary role phrases', () => {
        expect(phraseMatchesTitle(mockJobs[0], 'data analyst')).toBe(true);
        expect(phraseMatchesTitle(mockJobs[4], 'data analyst')).toBe(false);
        expect(phraseMatchesTitle(mockJobs[4], 'staff data analyst')).toBe(false);
    });

    it('does not treat unrelated analyst titles as data analyst matches', () => {
        expect(phraseMatchesTitle(mockJobs[1], 'data analyst')).toBe(false);
    });

    it('includes expanded analytics titles for data analyst journeys', () => {
        const matches = filterJobsByJourneyRole(mockJobs, 'data-analyst');

        expect(matches.exact.map((job) => job.id)).toEqual([1, 4]);
        expect(matches.related.map((job) => job.id)).toEqual([3, 6, 7]);
        expect(matches.description.map((job) => job.id)).toEqual([8]);
        expect(matches.all).toHaveLength(6);
    });

    it('matches roles mentioned in descriptions when titles do not match', () => {
        expect(
            phraseMatchesDescription(mockJobs[7], 'data analytics'),
        ).toBe(true);
    });
});
