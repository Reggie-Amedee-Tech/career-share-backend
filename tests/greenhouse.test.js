import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    clearGreenhouseCache,
    enrichJobsWithDescriptions,
    fetchBoardJobs,
    fetchFilteredJobsFromBoards,
    fetchJobDetail,
    fetchJobsFromBoards,
} from '../utils/greenhouse.js';

describe('greenhouse', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        clearGreenhouseCache();
    });

    it('uses list-only requests when includeContent is false', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    jobs: [
                        {
                            id: 1,
                            title: 'Engineer',
                            absolute_url: 'https://example.com/jobs/1',
                            updated_at: '2026-06-19T12:11:02-04:00',
                            location: { name: 'New York, NY' },
                        },
                    ],
                }),
                { status: 200 },
            ),
        );

        const jobs = await fetchBoardJobs('stripe', { includeContent: false });

        expect(fetchMock).toHaveBeenCalledWith(
            'https://boards-api.greenhouse.io/v1/boards/stripe/jobs',
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
        expect(jobs[0].description).toBe('');
        expect(jobs[0].descriptionHtml).toBe('');
    });

    it('requests full content when includeContent is true', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    jobs: [
                        {
                            id: 1,
                            title: 'Engineer',
                            content: '<p>Build APIs</p>',
                            absolute_url: 'https://example.com/jobs/1',
                            updated_at: '2026-06-19T12:11:02-04:00',
                            location: { name: 'New York, NY' },
                        },
                    ],
                }),
                { status: 200 },
            ),
        );

        const jobs = await fetchBoardJobs('stripe', { includeContent: true });

        expect(fetchMock).toHaveBeenCalledWith(
            'https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true',
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
        expect(jobs[0].description).toBe('Build APIs');
        expect(jobs[0].descriptionHtml).toBe('');
    });

    it('returns cached board jobs within the TTL', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ jobs: [] }), { status: 200 }),
        );

        await fetchBoardJobs('stripe', { includeContent: false });
        await fetchBoardJobs('stripe', { includeContent: false });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not cache full-content board jobs', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
            async () =>
                new Response(JSON.stringify({ jobs: [] }), { status: 200 }),
        );

        await fetchBoardJobs('stripe', { includeContent: true });
        await fetchBoardJobs('stripe', { includeContent: true });

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('continues when one board fetch times out', async () => {
        vi.useFakeTimers();

        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
            if (String(url).includes('/stripe/')) {
                return new Response(
                    JSON.stringify({
                        jobs: [
                            {
                                id: 1,
                                title: 'Engineer',
                                absolute_url: 'https://example.com/jobs/1',
                                updated_at: '2026-06-19T12:11:02-04:00',
                                location: { name: 'New York, NY' },
                            },
                        ],
                    }),
                    { status: 200 },
                );
            }

            return new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    reject(new DOMException('The operation was aborted.', 'AbortError'));
                });
            });
        });

        const jobsPromise = fetchJobsFromBoards(['stripe', 'figma'], {
            includeContent: false,
        });

        await vi.advanceTimersByTimeAsync(12_000);
        const jobs = await jobsPromise;

        expect(jobs).toHaveLength(1);
        expect(jobs[0].boardToken).toBe('stripe');
    });

    it('filters jobs board-by-board without retaining non-matches', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
            const boardToken = String(url).includes('/stripe/')
                ? 'stripe'
                : 'figma';

            return new Response(
                JSON.stringify({
                    jobs: [
                        {
                            id: 1,
                            title: boardToken === 'stripe' ? 'Engineer' : 'Designer',
                            content: '<p>Python</p>',
                            absolute_url: 'https://example.com/jobs/1',
                            updated_at: '2026-06-19T12:11:02-04:00',
                            location: { name: 'New York, NY' },
                        },
                    ],
                }),
                { status: 200 },
            );
        });

        const matches = await fetchFilteredJobsFromBoards(
            ['stripe', 'figma'],
            (job) => job.title.includes('Engineer'),
            { includeContent: true },
        );

        expect(matches).toHaveLength(1);
        expect(matches[0].title).toBe('Engineer');
    });

    it('fetches a single job with html content', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    id: 9,
                    title: 'Engineer',
                    content: '<p>Build APIs</p>',
                    absolute_url: 'https://example.com/jobs/9',
                    updated_at: '2026-06-19T12:11:02-04:00',
                    location: { name: 'New York, NY' },
                }),
                { status: 200 },
            ),
        );

        const job = await fetchJobDetail('stripe', 9);

        expect(job.descriptionHtml).toBe('<p>Build APIs</p>');
    });

    it('enriches only jobs missing descriptions', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    jobs: [
                        {
                            id: 1,
                            title: 'Engineer',
                            content: '<p>Python</p>',
                            absolute_url: 'https://example.com/jobs/1',
                            updated_at: '2026-06-19T12:11:02-04:00',
                            location: { name: 'New York, NY' },
                        },
                    ],
                }),
                { status: 200 },
            ),
        );

        const jobs = [
            {
                id: 1,
                boardToken: 'stripe',
                title: 'Engineer',
                companyName: 'Stripe',
                location: 'New York, NY',
                description: '',
                descriptionHtml: '',
                absoluteUrl: 'https://example.com/jobs/1',
                updatedAt: '2026-06-19T12:11:02-04:00',
                firstPublished: null,
            },
        ];

        await enrichJobsWithDescriptions(jobs);

        expect(jobs[0].description).toBe('Python');
    });
});
