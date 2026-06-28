import { describe, it, expect } from 'vitest';
import {
    buildJourneyData,
    formatJourney,
    parseChartConfig,
    validateJourneyInput,
} from '../utils/journey.js';

describe('journey utils', () => {
    it('validates required journey fields', () => {
        expect(validateJourneyInput({})).toBe('Journey name is required');
        expect(
            validateJourneyInput({
                name: 'Data Analyst',
                targetJobRoleId: '',
                targetJobLocation: 'New York',
            }),
        ).toBe('Target job title is required');
        expect(
            validateJourneyInput({
                name: 'Data Analyst',
                targetJobRoleId: 'not-a-real-role',
                targetJobLocation: 'New York',
            }),
        ).toBe('Select a supported job title');
    });

    it('parses chart config with safe defaults and limits', () => {
        expect(parseChartConfig({})).toEqual({
            topSkillsLimit: 10,
            topLocationsLimit: 6,
        });
        expect(parseChartConfig({ topSkillsLimit: 99, topLocationsLimit: 1 })).toEqual({
            topSkillsLimit: 20,
            topLocationsLimit: 3,
        });
    });

    it('builds journey data for create and partial update', () => {
        expect(
            buildJourneyData({
                name: ' Frontend Developer ',
                targetJobRoleId: 'frontend-engineer',
                targetJobLocation: ' New York ',
            }),
        ).toEqual({
            name: 'Frontend Developer',
            targetJobTitle: 'frontend-engineer',
            targetJobLocation: 'New York',
        });

        expect(
            buildJourneyData({ chartConfig: { topSkillsLimit: 5 } }, { partial: true }),
        ).toEqual({
            chartConfig: { topSkillsLimit: 5, topLocationsLimit: 6 },
        });
    });

    it('formats journeys with role labels for the client', () => {
        expect(
            formatJourney({
                id: 'journey-1',
                name: 'Data path',
                targetJobTitle: 'data-analyst',
                targetJobLocation: 'New York',
                chartConfig: {},
                createdAt: new Date('2026-06-01T12:00:00.000Z'),
                updatedAt: new Date('2026-06-01T12:00:00.000Z'),
            }),
        ).toMatchObject({
            targetJobRoleId: 'data-analyst',
            targetJobTitle: 'Data Analyst',
        });
    });
});
