import { resolveJourneyRole } from './journeyRoles.js';
import {
    classifyJourneyRoleMatch,
    filterJobsByJourneyRole,
} from './jobTitleMatch.js';

export const SEARCH_MATCH_RANK = {
    TITLE_PHRASE: 0,
    TITLE_TERMS: 1,
    METADATA_PHRASE: 2,
    METADATA_TERMS: 3,
    DESCRIPTION_PHRASE: 4,
};

function buildMetadataHaystack(job) {
    return [job.title, job.companyName, job.location]
        .join(' ')
        .toLowerCase();
}

function buildSkillsHaystack(job) {
    return (job.description ?? '').toLowerCase();
}

function splitSearchTerms(search) {
    return search?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
}

export function jobMatchesSearch(job, search) {
    const normalized = search?.trim().toLowerCase() ?? '';
    if (!normalized) {
        return true;
    }

    const terms = splitSearchTerms(search);
    const metadataHaystack = buildMetadataHaystack(job);

    if (metadataHaystack.includes(normalized)) {
        return true;
    }

    if (terms.length > 1) {
        const description = (job.description ?? '').toLowerCase();
        if (description.includes(normalized)) {
            return true;
        }
    }

    return terms.every((term) => metadataHaystack.includes(term));
}

export function jobMatchesSkills(job, skills) {
    const terms = splitSearchTerms(skills);
    if (terms.length === 0) {
        return true;
    }

    const haystack = buildSkillsHaystack(job);

    return terms.every((term) => haystack.includes(term));
}

export function classifyJobSearchMatch(job, search) {
    const trimmed = search?.trim() ?? '';
    if (!trimmed) {
        return null;
    }

    const role = resolveJourneyRole(trimmed);
    if (role) {
        const matchType = classifyJourneyRoleMatch(job, role.id);
        if (matchType === 'exact') {
            return SEARCH_MATCH_RANK.TITLE_PHRASE;
        }
        if (matchType === 'related') {
            return SEARCH_MATCH_RANK.TITLE_TERMS;
        }
        if (matchType === 'description') {
            return SEARCH_MATCH_RANK.DESCRIPTION_PHRASE;
        }
        return null;
    }

    const normalized = trimmed.toLowerCase();
    const terms = splitSearchTerms(trimmed);
    const title = (job.title ?? '').toLowerCase();
    const metadataHaystack = buildMetadataHaystack(job);
    const description = (job.description ?? '').toLowerCase();

    if (title.includes(normalized)) {
        return SEARCH_MATCH_RANK.TITLE_PHRASE;
    }

    if (terms.length > 0 && terms.every((term) => title.includes(term))) {
        return SEARCH_MATCH_RANK.TITLE_TERMS;
    }

    if (metadataHaystack.includes(normalized)) {
        return SEARCH_MATCH_RANK.METADATA_PHRASE;
    }

    if (terms.every((term) => metadataHaystack.includes(term))) {
        return SEARCH_MATCH_RANK.METADATA_TERMS;
    }

    if (terms.length > 1 && description.includes(normalized)) {
        return SEARCH_MATCH_RANK.DESCRIPTION_PHRASE;
    }

    return null;
}

export function filterJobsBySearch(jobs, search) {
    const trimmed = search?.trim() ?? '';
    if (!trimmed) {
        return jobs;
    }

    const role = resolveJourneyRole(trimmed);
    if (role) {
        return filterJobsByJourneyRole(jobs, role.id).all;
    }

    return jobs.filter((job) => jobMatchesSearch(job, trimmed));
}

export function filterJobsBySkills(jobs, skills) {
    return jobs.filter((job) => jobMatchesSkills(job, skills));
}
