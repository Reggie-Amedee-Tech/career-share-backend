import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import {
    fetchFilteredJobsFromBoards,
    fetchJobDetail,
    fetchJobsFromBoards,
    getBoardTokens,
} from '../utils/greenhouse.js';
import { mockUser } from './fixtures.js';

const mockJobs = [
    {
        id: 1,
        boardToken: 'stripe',
        title: 'Software Engineer',
        companyName: 'Stripe',
        location: 'New York, NY',
        description: 'Experience with Python and distributed systems.',
        absoluteUrl: 'https://stripe.com/jobs/1',
        updatedAt: '2026-06-19T12:11:02-04:00',
        firstPublished: '2026-06-02T08:58:57-04:00',
    },
    {
        id: 2,
        boardToken: 'figma',
        title: 'Product Designer',
        companyName: 'Figma',
        location: 'San Francisco, CA',
        description: 'Strong portfolio and Figma expertise required.',
        absoluteUrl: 'https://figma.com/jobs/2',
        updatedAt: '2026-06-19T12:11:02-04:00',
        firstPublished: '2026-06-10T09:00:00-04:00',
    },
    {
        id: 3,
        boardToken: 'airbnb',
        title: 'Customer Support',
        companyName: 'Airbnb',
        location: 'Remote - US',
        description: 'Excellent communication and problem-solving skills.',
        absoluteUrl: 'https://airbnb.com/jobs/3',
        updatedAt: '2026-06-19T12:11:02-04:00',
        firstPublished: null,
    },
];

vi.mock('../utils/greenhouse.js', () => ({
    getBoardTokens: vi.fn(),
    fetchJobsFromBoards: vi.fn(),
    fetchFilteredJobsFromBoards: vi.fn(),
    fetchJobDetail: vi.fn(),
}));

describe('Job routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getBoardTokens).mockReturnValue(['stripe', 'figma', 'airbnb']);
        vi.mocked(fetchJobsFromBoards).mockResolvedValue(mockJobs);
        vi.mocked(fetchFilteredJobsFromBoards).mockImplementation(
            async (_boardTokens, predicate) => mockJobs.filter(predicate),
        );
        vi.mocked(fetchJobDetail).mockResolvedValue({
            ...mockJobs[0],
            descriptionHtml: '<p>Experience with Python and distributed systems.</p>',
        });
    });

    async function loginAgent() {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(bcrypt.compare).mockResolvedValue(true);

        const agent = request.agent(app);
        await agent
            .post('/login')
            .send({ email: 'jane@example.com', password: 'secret123' });

        return agent;
    }

    describe('GET /api/jobs', () => {
        it('returns 401 when not authenticated', async () => {
            const res = await request(app).get('/api/jobs');

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
        });

        it('returns 503 when no board tokens are configured', async () => {
            vi.mocked(getBoardTokens).mockReturnValue([]);
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs');

            expect(res.status).toBe(503);
            expect(res.body.message).toBe('Job board integration is not configured');
        });

        it('returns all jobs when no filters are provided', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs');

            expect(res.status).toBe(200);
            expect(res.body.totalBoardJobs).toBe(3);
            expect(res.body.totalMatches).toBe(3);
            expect(res.body.jobs).toHaveLength(3);
            expect(res.body.page).toBe(1);
            expect(res.body.limit).toBe(10);
            expect(res.body.totalPages).toBe(1);
            expect(res.body.filters).toEqual({
                search: '',
                skills: '',
                nearMe: false,
                location: '',
                radiusMiles: null,
            });
            expect(fetchJobsFromBoards).toHaveBeenCalledWith(
                ['stripe', 'figma', 'airbnb'],
                { includeContent: false },
            );
        });

        it('filters jobs by search keywords', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs?q=designer');

            expect(res.status).toBe(200);
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Product Designer');
            expect(res.body.filters.search).toBe('designer');
            expect(fetchFilteredJobsFromBoards).toHaveBeenCalled();
        });

        it('filters jobs by required skills in the description', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs?skills=python');

            expect(res.status).toBe(200);
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Software Engineer');
            expect(res.body.filters.skills).toBe('python');
        });

        it('filters jobs near the signed-in user when nearMe is true', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs?nearMe=true');

            expect(res.status).toBe(200);
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs.map((job) => job.title)).toEqual([
                'Software Engineer',
            ]);
            expect(res.body.filters.nearMe).toBe(true);
            expect(res.body.filters.radiusMiles).toBe(50);
        });

        it('filters jobs within a custom radius when nearMe is true', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs?nearMe=true&radiusMiles=10');

            expect(res.status).toBe(200);
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.filters.radiusMiles).toBe(10);
        });

        it('filters jobs by a custom location term', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs?location=san%20francisco');

            expect(res.status).toBe(200);
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Product Designer');
            expect(res.body.filters.location).toBe('san francisco');
        });

        it('applies search and nearMe filters together', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs?q=engineer&nearMe=true');

            expect(res.status).toBe(200);
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].title).toBe('Software Engineer');
        });

        it('paginates filtered job results', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs?limit=2&page=2');

            expect(res.status).toBe(200);
            expect(res.body.totalMatches).toBe(3);
            expect(res.body.totalBoardJobs).toBe(3);
            expect(res.body.page).toBe(2);
            expect(res.body.limit).toBe(2);
            expect(res.body.totalPages).toBe(2);
            expect(res.body.jobs).toHaveLength(1);
            expect(res.body.jobs[0].boardToken).toBe('airbnb');
        });

        it('interleaves boards on the first page', async () => {
            vi.mocked(fetchJobsFromBoards).mockResolvedValue([
                ...Array.from({ length: 4 }, (_, index) => ({
                    id: index + 1,
                    boardToken: 'stripe',
                    title: `Stripe Role ${index + 1}`,
                    companyName: 'Stripe',
                    location: 'New York, NY',
                    absoluteUrl: `https://stripe.com/jobs/${index + 1}`,
                    updatedAt: '2026-06-19T12:11:02-04:00',
                    firstPublished: '2026-06-02T08:58:57-04:00',
                })),
                {
                    id: 101,
                    boardToken: 'figma',
                    title: 'Product Designer',
                    companyName: 'Figma',
                    location: 'San Francisco, CA',
                    absoluteUrl: 'https://figma.com/jobs/101',
                    updatedAt: '2026-06-19T12:11:02-04:00',
                    firstPublished: '2026-06-10T09:00:00-04:00',
                },
            ]);
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs?limit=3');

            expect(res.status).toBe(200);
            expect(res.body.jobs).toHaveLength(3);
            expect(res.body.jobs.map((job) => job.boardToken)).toEqual([
                'stripe',
                'figma',
                'stripe',
            ]);
        });

        it('clamps an out-of-range page to the last page', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs?limit=2&page=99');

            expect(res.status).toBe(200);
            expect(res.body.page).toBe(2);
            expect(res.body.jobs).toHaveLength(1);
        });
    });

    describe('GET /api/jobs/:boardToken/:jobId', () => {
        it('returns 401 when not authenticated', async () => {
            const res = await request(app).get('/api/jobs/stripe/1');

            expect(res.status).toBe(401);
        });

        it('returns a single job with html content', async () => {
            const agent = await loginAgent();

            const res = await agent.get('/api/jobs/stripe/1');

            expect(res.status).toBe(200);
            expect(res.body.job.title).toBe('Software Engineer');
            expect(fetchJobDetail).toHaveBeenCalledWith('stripe', 1);
        });
    });
});
