import { decodeJobContentHtml, stripHtml } from './html.js';

const GREENHOUSE_API_BASE = 'https://boards-api.greenhouse.io/v1/boards';

export function getBoardTokens() {
    const tokens = process.env.GREENHOUSE_BOARD_TOKENS ?? '';
    return tokens
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);
}

export async function fetchBoardJobs(boardToken) {
    const response = await fetch(
        `${GREENHOUSE_API_BASE}/${boardToken}/jobs?content=true`,
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch jobs for board "${boardToken}"`);
    }

    const data = await response.json();
    return (data.jobs ?? []).map((job) => formatGreenhouseJob(job, boardToken));
}

export async function fetchJobsFromBoards(boardTokens) {
    const results = await Promise.allSettled(
        boardTokens.map((boardToken) => fetchBoardJobs(boardToken)),
    );

    const jobs = [];
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
            jobs.push(...result.value);
            continue;
        }

        console.warn(
            `[greenhouse] Failed to fetch jobs for board "${boardTokens[i]}":`,
            result.reason?.message ?? result.reason,
        );
    }

    if (jobs.length === 0 && boardTokens.length > 0) {
        throw new Error('Failed to fetch jobs from all configured boards');
    }

    return jobs;
}

function formatGreenhouseJob(job, boardToken) {
    return {
        id: job.id,
        boardToken,
        title: job.title,
        companyName: job.company_name ?? boardToken,
        location: job.location?.name ?? '',
        description: stripHtml(job.content ?? ''),
        descriptionHtml: decodeJobContentHtml(job.content ?? ''),
        absoluteUrl: job.absolute_url,
        updatedAt: job.updated_at,
        firstPublished: job.first_published ?? null,
    };
}
