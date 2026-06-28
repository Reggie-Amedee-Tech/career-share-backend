import {
    fetchFilteredJobsFromBoards,
    fetchJobDetail,
    fetchJobsFromBoards,
    getBoardTokens,
} from '../utils/greenhouse.js';
import { applyJobFilters } from '../utils/jobFilters.js';
import {
    filterJobsNearUser,
    jobMatchesLocationTerm,
} from '../utils/jobLocation.js';
import { orderJobsBySearchRelevance } from '../utils/jobOrdering.js';
import { jobMatchesSearch, jobMatchesSkills } from '../utils/jobSearch.js';
import { handleApiError } from '../utils/errors.js';
import { parseRadiusMiles } from '../utils/distance.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parseNearMe(value) {
    return value === 'true' || value === '1';
}

function parsePagination(query) {
    let page = Number.parseInt(String(query.page ?? DEFAULT_PAGE), 10);
    let limit = Number.parseInt(String(query.limit ?? DEFAULT_LIMIT), 10);

    if (!Number.isFinite(page) || page < 1) {
        page = DEFAULT_PAGE;
    }

    if (!Number.isFinite(limit) || limit < 1) {
        limit = DEFAULT_LIMIT;
    } else if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }

    return { page, limit };
}

function jobMatchesSyncFilters(job, { search, skills, nearMe, location }) {
    if (search && !jobMatchesSearch(job, search)) {
        return false;
    }

    if (skills && !jobMatchesSkills(job, skills)) {
        return false;
    }

    if (!nearMe && location && !jobMatchesLocationTerm(job, location)) {
        return false;
    }

    return true;
}

function serializeJobForList(job) {
    const { descriptionHtml: _descriptionHtml, ...rest } = job;
    return rest;
}

export async function listJobs(req, res) {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const boardTokens = getBoardTokens();
        if (boardTokens.length === 0) {
            return res.status(503).json({
                message: 'Job board integration is not configured',
            });
        }

        const search = String(req.query.q ?? req.query.search ?? '').trim();
        const skills = String(req.query.skills ?? '').trim();
        const nearMe = parseNearMe(req.query.nearMe);
        const location = String(req.query.location ?? '').trim();
        const radiusMiles = parseRadiusMiles(req.query.radiusMiles);
        const needsContent = Boolean(search || skills);
        const filterContext = { search, skills, nearMe, location, radiusMiles };

        const jobs = needsContent
            ? await fetchFilteredJobsFromBoards(
                  boardTokens,
                  (job) => jobMatchesSyncFilters(job, filterContext),
                  { includeContent: true },
              )
            : await fetchJobsFromBoards(boardTokens, { includeContent: false });

        const totalBoardJobs = needsContent
            ? (
                  await fetchJobsFromBoards(boardTokens, { includeContent: false })
              ).length
            : jobs.length;

        let matchedJobs = needsContent
            ? jobs
            : await applyJobFilters(jobs, filterContext, req.session.user);

        if (needsContent && nearMe) {
            matchedJobs = await filterJobsNearUser(
                matchedJobs,
                req.session.user,
                radiusMiles,
            );
        }

        matchedJobs = orderJobsBySearchRelevance(matchedJobs, search);

        const totalMatches = matchedJobs.length;
        const { page, limit } = parsePagination(req.query);
        const totalPages = Math.max(1, Math.ceil(totalMatches / limit));
        const safePage = Math.min(page, totalPages);
        const start = (safePage - 1) * limit;
        const paginatedJobs = matchedJobs
            .slice(start, start + limit)
            .map(serializeJobForList);

        res.json({
            jobs: paginatedJobs,
            totalBoardJobs,
            totalMatches,
            page: safePage,
            limit,
            totalPages,
            filters: {
                search,
                skills,
                nearMe,
                location,
                radiusMiles: nearMe ? radiusMiles : null,
            },
        });
    } catch (error) {
        handleApiError(res, 'GET /api/jobs', error, req);
    }
}

export async function getJobDetail(req, res) {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const boardToken = String(req.params.boardToken ?? '').trim();
        const jobId = Number.parseInt(String(req.params.jobId ?? ''), 10);

        if (!boardToken || !Number.isFinite(jobId)) {
            return res.status(400).json({ message: 'Invalid job reference' });
        }

        const job = await fetchJobDetail(boardToken, jobId);
        res.json({ job });
    } catch (error) {
        handleApiError(res, 'GET /api/jobs/:boardToken/:jobId', error, req);
    }
}
