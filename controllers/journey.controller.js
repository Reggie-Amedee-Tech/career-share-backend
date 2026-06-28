import { prisma } from '../lib/prisma.js';
import { fetchJobsFromBoards, getBoardTokens, enrichJobsWithDescriptions } from '../utils/greenhouse.js';
import { analyzeJobSkills } from '../utils/jobSkills.js';
import {
    buildJobLocationPoints,
    buildSkillHeatmap,
    selectJobsForSkillInsights,
} from '../utils/journeyInsights.js';
import { handleApiError } from '../utils/errors.js';
import { getSessionUserId } from '../utils/user.js';
import {
    buildJourneyData,
    formatJourney,
    parseChartConfig,
    validateJourneyInput,
} from '../utils/journey.js';
import {
    listDiscoveryQuestions,
    recommendJourneyRoles,
} from '../utils/journeyDiscovery.js';
import { listJourneyRoles, resolveJourneyRole } from '../utils/journeyRoles.js';


async function getOwnedJourney(req, journeyId) {
    const userId = getSessionUserId(req);
    if (!userId) {
        return { error: { status: 401, message: 'Unauthorized' } };
    }

    const journey = await prisma.professionalJourney.findFirst({
        where: { id: journeyId, userId },
    });

    if (!journey) {
        return { error: { status: 404, message: 'Journey not found' } };
    }

    return { journey };
}

export async function listJourneyRolesCatalog(req, res) {
    try {
        if (!getSessionUserId(req)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json({ roles: listJourneyRoles() });
    } catch (error) {
        handleApiError(res, 'GET /api/journey-roles', error, req);
    }
}

export async function listJourneyDiscoveryQuestions(req, res) {
    try {
        if (!getSessionUserId(req)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json({ questions: listDiscoveryQuestions() });
    } catch (error) {
        handleApiError(res, 'GET /api/journey-discovery/questions', error, req);
    }
}

export async function recommendJourneyRolesFromAnswers(req, res) {
    try {
        if (!getSessionUserId(req)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const result = recommendJourneyRoles(req.body?.answers);
        if (result.error) {
            return res.status(400).json({ message: result.error });
        }

        res.json(result);
    } catch (error) {
        handleApiError(res, 'POST /api/journey-discovery/recommend', error, req);
    }
}

export async function listJourneys(req, res) {
    try {
        const userId = getSessionUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const journeys = await prisma.professionalJourney.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });

        res.json({ journeys: journeys.map(formatJourney) });
    } catch (error) {
        handleApiError(res, 'GET /api/journeys', error, req);
    }
}

export async function getJourney(req, res) {
    try {
        const { journey, error } = await getOwnedJourney(req, req.params.id);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        res.json({ journey: formatJourney(journey) });
    } catch (error) {
        handleApiError(res, 'GET /api/journeys/:id', error, req);
    }
}

export async function createJourney(req, res) {
    try {
        const userId = getSessionUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const data = buildJourneyData(req.body);
        const validationError = validateJourneyInput(data);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const journey = await prisma.professionalJourney.create({
            data: {
                userId,
                ...data,
                chartConfig: data.chartConfig ?? parseChartConfig({}),
            },
        });

        res.status(201).json({ journey: formatJourney(journey) });
    } catch (error) {
        handleApiError(res, 'POST /api/journeys', error, req);
    }
}

export async function updateJourney(req, res) {
    try {
        const { journey, error } = await getOwnedJourney(req, req.params.id);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        const data = buildJourneyData(req.body, { partial: true });
        const validationError = validateJourneyInput({
            name: data.name ?? journey.name,
            targetJobTitle: data.targetJobTitle ?? journey.targetJobTitle,
            targetJobLocation: data.targetJobLocation ?? journey.targetJobLocation,
        });
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: 'No journey fields to update' });
        }

        const updated = await prisma.professionalJourney.update({
            where: { id: journey.id },
            data,
        });

        res.json({ journey: formatJourney(updated) });
    } catch (error) {
        handleApiError(res, 'PATCH /api/journeys/:id', error, req);
    }
}

export async function deleteJourney(req, res) {
    try {
        const { journey, error } = await getOwnedJourney(req, req.params.id);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        await prisma.professionalJourney.delete({ where: { id: journey.id } });
        res.json({ message: 'Journey deleted' });
    } catch (error) {
        handleApiError(res, 'DELETE /api/journeys/:id', error, req);
    }
}

export async function getJourneySkillInsights(req, res) {
    try {
        const { journey, error } = await getOwnedJourney(req, req.params.id);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        const boardTokens = getBoardTokens();
        if (boardTokens.length === 0) {
            return res.status(503).json({
                message: 'Job board integration is not configured',
            });
        }

        const chartConfig = parseChartConfig(journey.chartConfig);
        const role = resolveJourneyRole(journey.targetJobTitle);

        const jobs = await fetchJobsFromBoards(boardTokens, {
            includeContent: false,
        });
        const {
            jobs: matchedJobs,
            exactTitleMatches,
            relatedTitleMatches,
            descriptionMatches,
            totalTitleMatches,
            totalRoleMatches,
            totalLocationMatches,
            focusLocationMatches,
            analysisTarget,
            locationScope,
            matchScope,
            locationExpanded,
            matchScopeExpanded,
        } = selectJobsForSkillInsights(
            jobs,
            role?.id ?? journey.targetJobTitle,
            journey.targetJobLocation,
        );

        await enrichJobsWithDescriptions(matchedJobs);

        const insights = analyzeJobSkills(matchedJobs, chartConfig);
        const [skillHeatmap, jobLocations] = await Promise.all([
            Promise.resolve(
                buildSkillHeatmap(insights.skillsByLocation, insights.topSkills),
            ),
            buildJobLocationPoints(insights.skillsByLocation, matchedJobs),
        ]);

        res.json({
            journeyId: journey.id,
            name: journey.name,
            role: role?.label ?? journey.targetJobTitle,
            targetJobRoleId: role?.id ?? journey.targetJobTitle,
            focusLocation: journey.targetJobLocation,
            chartConfig,
            totalBoardJobs: jobs.length,
            exactTitleMatches,
            relatedTitleMatches,
            descriptionMatches,
            totalTitleMatches,
            totalRoleMatches,
            totalLocationMatches,
            focusLocationMatches,
            analysisTarget,
            locationScope,
            matchScope,
            locationExpanded,
            matchScopeExpanded,
            ...insights,
            skillHeatmap,
            jobLocations,
        });
    } catch (error) {
        handleApiError(res, 'GET /api/journeys/:id/skill-insights', error, req);
    }
}
