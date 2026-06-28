import { describe, it, expect } from 'vitest';
import {
    interleaveJobsByBoard,
    orderJobsBySearchRelevance,
} from '../utils/jobOrdering.js';

describe('interleaveJobsByBoard', () => {
    it('rotates jobs across boards instead of grouping by board', () => {
        const jobs = [
            {
                id: 1,
                boardToken: 'stripe',
                title: 'Stripe Role 1',
                updatedAt: '2026-06-20T12:00:00-04:00',
            },
            {
                id: 2,
                boardToken: 'stripe',
                title: 'Stripe Role 2',
                updatedAt: '2026-06-19T12:00:00-04:00',
            },
            {
                id: 3,
                boardToken: 'figma',
                title: 'Figma Role 1',
                updatedAt: '2026-06-18T12:00:00-04:00',
            },
            {
                id: 4,
                boardToken: 'airbnb',
                title: 'Airbnb Role 1',
                updatedAt: '2026-06-17T12:00:00-04:00',
            },
        ];

        const ordered = interleaveJobsByBoard(jobs);

        expect(ordered.map((job) => job.boardToken)).toEqual([
            'stripe',
            'figma',
            'airbnb',
            'stripe',
        ]);
        expect(ordered[0].title).toBe('Stripe Role 1');
        expect(ordered[3].title).toBe('Stripe Role 2');
    });

    it('shows title matches before description-only matches', () => {
        const jobs = [
            {
                id: 1,
                boardToken: 'stripe',
                title: 'Product Lead, Data Products',
                updatedAt: '2026-06-20T12:00:00-04:00',
                description: 'Partner with data engineer teams.',
            },
            {
                id: 2,
                boardToken: 'discord',
                title: 'Senior Data Engineer',
                updatedAt: '2026-06-19T12:00:00-04:00',
                description: 'Build data pipelines.',
            },
            {
                id: 3,
                boardToken: 'figma',
                title: 'Engineering Manager, Data',
                updatedAt: '2026-06-18T12:00:00-04:00',
                description: 'Lead data engineering teams.',
            },
        ];

        const ordered = orderJobsBySearchRelevance(jobs, 'data engineer');

        expect(ordered.map((job) => job.title)).toEqual([
            'Senior Data Engineer',
            'Engineering Manager, Data',
            'Product Lead, Data Products',
        ]);
    });
});
