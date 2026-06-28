import { classifyJobSearchMatch } from './jobSearch.js';

function compareJobsByUpdatedAt(a, b) {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function interleaveJobsByBoard(jobs) {
    const queues = new Map();
    const boardOrder = [];

    for (const job of jobs) {
        if (!queues.has(job.boardToken)) {
            queues.set(job.boardToken, []);
            boardOrder.push(job.boardToken);
        }
        queues.get(job.boardToken).push(job);
    }

    for (const boardToken of boardOrder) {
        const boardJobs = queues.get(boardToken);
        boardJobs.sort(compareJobsByUpdatedAt);
    }

    const interleaved = [];
    let hasJobs = true;

    while (hasJobs) {
        hasJobs = false;
        for (const boardToken of boardOrder) {
            const queue = queues.get(boardToken);
            if (queue.length > 0) {
                interleaved.push(queue.shift());
                hasJobs = true;
            }
        }
    }

    return interleaved;
}

export function orderJobsBySearchRelevance(jobs, search) {
    const trimmed = search?.trim() ?? '';
    if (!trimmed) {
        return interleaveJobsByBoard(jobs);
    }

    const buckets = new Map();

    for (const job of jobs) {
        const rank = classifyJobSearchMatch(job, trimmed);
        if (rank === null) {
            continue;
        }

        if (!buckets.has(rank)) {
            buckets.set(rank, []);
        }
        buckets.get(rank).push(job);
    }

    const ordered = [];
    for (const rank of [...buckets.keys()].sort((a, b) => a - b)) {
        ordered.push(...interleaveJobsByBoard(buckets.get(rank)));
    }

    return ordered;
}
