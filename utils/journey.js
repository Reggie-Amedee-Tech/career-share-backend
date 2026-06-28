import { isSupportedJourneyRole, resolveJourneyRole } from './journeyRoles.js';

const DEFAULT_CHART_CONFIG = {
    topSkillsLimit: 10,
    topLocationsLimit: 6,
};

const MIN_CHART_LIMIT = 3;
const MAX_TOP_SKILLS = 20;
const MAX_TOP_LOCATIONS = 12;

function clampLimit(value, fallback, max) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(max, Math.max(MIN_CHART_LIMIT, parsed));
}

export function parseChartConfig(raw) {
    const config = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

    return {
        topSkillsLimit: clampLimit(
            config.topSkillsLimit,
            DEFAULT_CHART_CONFIG.topSkillsLimit,
            MAX_TOP_SKILLS,
        ),
        topLocationsLimit: clampLimit(
            config.topLocationsLimit,
            DEFAULT_CHART_CONFIG.topLocationsLimit,
            MAX_TOP_LOCATIONS,
        ),
    };
}

export function formatJourney(journey) {
    const role = resolveJourneyRole(journey.targetJobTitle);

    return {
        id: journey.id,
        name: journey.name,
        targetJobRoleId: role?.id ?? journey.targetJobTitle,
        targetJobTitle: role?.label ?? journey.targetJobTitle,
        targetJobLocation: journey.targetJobLocation,
        chartConfig: parseChartConfig(journey.chartConfig),
        createdAt: journey.createdAt,
        updatedAt: journey.updatedAt,
    };
}

export function validateJourneyInput({
    name,
    targetJobTitle,
    targetJobRoleId,
    targetJobLocation,
}) {
    if (!String(name ?? '').trim()) {
        return 'Journey name is required';
    }

    const roleRef = targetJobRoleId ?? targetJobTitle;
    if (!String(roleRef ?? '').trim()) {
        return 'Target job title is required';
    }

    if (!isSupportedJourneyRole(roleRef)) {
        return 'Select a supported job title';
    }

    if (!String(targetJobLocation ?? '').trim()) {
        return 'Target job location is required';
    }

    return null;
}

export function buildJourneyData(body, { partial = false } = {}) {
    const data = {};

    if (!partial || body.name !== undefined) {
        data.name = String(body.name ?? '').trim();
    }

    if (!partial || body.targetJobTitle !== undefined || body.targetJobRoleId !== undefined) {
        const roleRef = body.targetJobRoleId ?? body.targetJobTitle;
        const role = resolveJourneyRole(roleRef);
        data.targetJobTitle = role?.id ?? String(roleRef ?? '').trim();
    }

    if (!partial || body.targetJobLocation !== undefined) {
        data.targetJobLocation = String(body.targetJobLocation ?? '').trim();
    }

    if (body.chartConfig !== undefined) {
        data.chartConfig = parseChartConfig(body.chartConfig);
    }

    return data;
}
