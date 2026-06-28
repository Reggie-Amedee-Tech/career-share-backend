import { resolveJourneyRole } from './journeyRoles.js';

function titleHaystack(job) {
    return job.title ?? '';
}

function descriptionHaystack(job) {
    return job.description ?? '';
}

function phraseMatchesText(text, phrase) {
    const normalizedPhrase = phrase.trim().toLowerCase();
    if (!normalizedPhrase) {
        return false;
    }

    return text.toLowerCase().includes(normalizedPhrase);
}

export function phraseMatchesTitle(job, phrase) {
    return phraseMatchesText(titleHaystack(job), phrase);
}

export function phraseMatchesDescription(job, phrase) {
    return phraseMatchesText(descriptionHaystack(job), phrase);
}

function jobMatchesPrimaryInTitle(job, role) {
    return role.primaryPhrases.some((phrase) => phraseMatchesTitle(job, phrase));
}

function jobMatchesRelatedInTitle(job, role) {
    return role.relatedPhrases.some((phrase) => phraseMatchesTitle(job, phrase));
}

function jobMatchesPrimaryInDescription(job, role) {
    return role.primaryPhrases.some((phrase) => phraseMatchesDescription(job, phrase));
}

function jobMatchesRelatedInDescription(job, role) {
    return role.relatedPhrases.some((phrase) => phraseMatchesDescription(job, phrase));
}

export function classifyJourneyRoleMatch(job, roleRef) {
    const role = resolveJourneyRole(roleRef);
    if (!role) {
        return null;
    }

    if (jobMatchesPrimaryInTitle(job, role)) {
        return 'exact';
    }

    if (jobMatchesRelatedInTitle(job, role)) {
        return 'related';
    }

    if (
        jobMatchesPrimaryInDescription(job, role) ||
        jobMatchesRelatedInDescription(job, role)
    ) {
        return 'description';
    }

    return null;
}

export function filterJobsByJourneyRole(jobs, roleRef) {
    const role = resolveJourneyRole(roleRef);
    if (!role) {
        return {
            exact: [],
            related: [],
            description: [],
            all: [],
        };
    }

    const exact = [];
    const related = [];
    const description = [];

    for (const job of jobs) {
        const matchType = classifyJourneyRoleMatch(job, role.id);
        if (matchType === 'exact') {
            exact.push(job);
        } else if (matchType === 'related') {
            related.push(job);
        } else if (matchType === 'description') {
            description.push(job);
        }
    }

    return {
        exact,
        related,
        description,
        all: [...exact, ...related, ...description],
    };
}

export function countAnalyzedRoleMatches(jobs, roleRef) {
    let exactTitleMatches = 0;
    let relatedTitleMatches = 0;
    let descriptionMatches = 0;

    for (const job of jobs) {
        const matchType = classifyJourneyRoleMatch(job, roleRef);
        if (matchType === 'exact') {
            exactTitleMatches += 1;
        } else if (matchType === 'related') {
            relatedTitleMatches += 1;
        } else if (matchType === 'description') {
            descriptionMatches += 1;
        }
    }

    return {
        exactTitleMatches,
        relatedTitleMatches,
        descriptionMatches,
    };
}
