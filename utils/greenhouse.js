import { decodeJobContentHtml, stripHtml } from './html.js';

const GREENHOUSE_API_BASE = 'https://boards-api.greenhouse.io/v1/boards';
const BOARD_FETCH_TIMEOUT_MS = 12_000;
const BOARD_FETCH_CONCURRENCY = 6;
const BOARD_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_BULK_DESCRIPTION_LENGTH = 1500;

/** @type {Map<string, { expiresAt: number, jobs: ReturnType<typeof formatGreenhouseJob>[] }>} */
const boardCache = new Map();

export function getBoardTokens() {
    const tokens = process.env.GREENHOUSE_BOARD_TOKENS ?? '';
    return tokens
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);
}

export function clearGreenhouseCache() {
    boardCache.clear();
}

function cacheKey(boardToken) {
    return boardToken;
}

function getCachedBoardJobs(boardToken) {
    const entry = boardCache.get(cacheKey(boardToken));
    if (!entry || entry.expiresAt <= Date.now()) {
        return null;
    }

    return entry.jobs;
}

function setCachedBoardJobs(boardToken, jobs) {
    boardCache.set(cacheKey(boardToken), {
        expiresAt: Date.now() + BOARD_CACHE_TTL_MS,
        jobs,
    });
}

async function fetchWithTimeout(url, timeoutMs = BOARD_FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

async function mapWithConcurrency(items, concurrency, mapper) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    }

    const workers = Array.from(
        { length: Math.min(concurrency, items.length) },
        () => worker(),
    );
    await Promise.all(workers);
    return results;
}

function truncateDescription(description) {
    if (!description || description.length <= MAX_BULK_DESCRIPTION_LENGTH) {
        return description;
    }

    return `${description.slice(0, MAX_BULK_DESCRIPTION_LENGTH).trim()}…`;
}

function formatGreenhouseJob(job, boardToken, options = {}) {
    const includeContent = options.includeContent ?? false;
    const includeHtml = options.includeHtml ?? false;
    const content = includeContent ? (job.content ?? '') : '';
    const description = content ? truncateDescription(stripHtml(content)) : '';

    return {
        id: job.id,
        boardToken,
        title: job.title,
        companyName: job.company_name ?? boardToken,
        location: job.location?.name ?? '',
        description,
        descriptionHtml:
            includeHtml && content ? decodeJobContentHtml(content) : '',
        absoluteUrl: job.absolute_url,
        updatedAt: job.updated_at,
        firstPublished: job.first_published ?? null,
    };
}

export async function fetchBoardJobs(boardToken, options = {}) {
    const includeContent = options.includeContent ?? false;

    if (!includeContent) {
        const cached = getCachedBoardJobs(boardToken);
        if (cached) {
            return cached;
        }
    }

    const contentParam = includeContent ? '?content=true' : '';
    const response = await fetchWithTimeout(
        `${GREENHOUSE_API_BASE}/${boardToken}/jobs${contentParam}`,
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch jobs for board "${boardToken}"`);
    }

    const data = await response.json();
    const jobs = (data.jobs ?? []).map((job) =>
        formatGreenhouseJob(job, boardToken, { includeContent }),
    );

    if (!includeContent) {
        setCachedBoardJobs(boardToken, jobs);
    }

    return jobs;
}

export async function fetchJobDetail(boardToken, jobId) {
    const response = await fetchWithTimeout(
        `${GREENHOUSE_API_BASE}/${boardToken}/jobs/${jobId}`,
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch job "${jobId}" for board "${boardToken}"`);
    }

    const job = await response.json();
    return formatGreenhouseJob(job, boardToken, {
        includeContent: true,
        includeHtml: true,
    });
}

export async function fetchJobsFromBoards(boardTokens, options = {}) {
    const includeContent = options.includeContent ?? false;
    const concurrency = includeContent ? 1 : BOARD_FETCH_CONCURRENCY;
    const results = await mapWithConcurrency(
        boardTokens,
        concurrency,
        async (boardToken) => {
            try {
                return {
                    status: 'fulfilled',
                    value: await fetchBoardJobs(boardToken, { includeContent }),
                };
            } catch (error) {
                return {
                    status: 'rejected',
                    reason: error,
                };
            }
        },
    );

    const jobs = [];
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
            jobs.push(...result.value);
            continue;
        }

        const message =
            result.reason?.name === 'AbortError'
                ? 'Request timed out'
                : (result.reason?.message ?? result.reason);

        console.warn(
            `[greenhouse] Failed to fetch jobs for board "${boardTokens[i]}":`,
            message,
        );
    }

    if (jobs.length === 0 && boardTokens.length > 0) {
        throw new Error('Failed to fetch jobs from all configured boards');
    }

    return jobs;
}

export async function fetchFilteredJobsFromBoards(boardTokens, predicate, options = {}) {
    const includeContent = options.includeContent ?? true;
    const matches = [];

    for (const boardToken of boardTokens) {
        try {
            const boardJobs = await fetchBoardJobs(boardToken, { includeContent });
            for (const job of boardJobs) {
                if (predicate(job)) {
                    matches.push(job);
                }
            }
        } catch (error) {
            const message =
                error?.name === 'AbortError'
                    ? 'Request timed out'
                    : (error?.message ?? error);

            console.warn(
                `[greenhouse] Failed to fetch jobs for board "${boardToken}":`,
                message,
            );
        }
    }

    return matches;
}

export async function enrichJobsWithDescriptions(jobs) {
    const jobsByBoard = new Map();

    for (const job of jobs) {
        if (job.description?.trim()) {
            continue;
        }

        if (!jobsByBoard.has(job.boardToken)) {
            jobsByBoard.set(job.boardToken, []);
        }

        jobsByBoard.get(job.boardToken).push(job);
    }

    for (const [boardToken, boardJobs] of jobsByBoard) {
        try {
            const withContent = await fetchBoardJobs(boardToken, {
                includeContent: true,
            });
            const descriptionsById = new Map(
                withContent.map((job) => [job.id, job.description]),
            );

            for (const job of boardJobs) {
                const description = descriptionsById.get(job.id);
                if (description) {
                    job.description = description;
                }
            }
        } catch (error) {
            console.warn(
                `[greenhouse] Failed to enrich descriptions for board "${boardToken}":`,
                error?.message ?? error,
            );
        }
    }

    return jobs;
}
