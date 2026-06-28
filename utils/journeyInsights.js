import { geocodeLocations } from './geocode.js';
import { filterJobsByLocationTerm } from './jobLocation.js';
import { resolveJobLocationBuckets } from './jobLocationParse.js';
import { interleaveJobsByBoard } from './jobOrdering.js';
import {
    countAnalyzedRoleMatches,
    filterJobsByJourneyRole,
} from './jobTitleMatch.js';

export const MIN_JOURNEY_ANALYSIS_JOBS = 1000;

const HEATMAP_SKILL_LIMIT = 8;
const HEATMAP_LOCATION_LIMIT = 6;

function jobKey(job) {
    return `${job.boardToken}-${job.id}`;
}

function dedupeJobs(jobs) {
    const seen = new Set();
    const unique = [];

    for (const job of jobs) {
        const key = jobKey(job);
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        unique.push(job);
    }

    return unique;
}

function buildWideningTiers({ exact, related, description, location }) {
    const normalizedLocation = location?.trim() ?? '';
    const titleJobs = interleaveJobsByBoard([...exact, ...related]);
    const tiers = [];

    if (normalizedLocation) {
        tiers.push({
            locationScope: 'focus',
            matchScope: 'title',
            jobs: interleaveJobsByBoard([
                ...filterJobsByLocationTerm(exact, location),
                ...filterJobsByLocationTerm(related, location),
            ]),
        });
    }

    tiers.push({
        locationScope: 'nationwide',
        matchScope: 'title',
        jobs: titleJobs,
    });

    if (normalizedLocation) {
        tiers.push({
            locationScope: 'focus',
            matchScope: 'title-and-description',
            jobs: interleaveJobsByBoard(
                filterJobsByLocationTerm(description, location),
            ),
        });
    }

    tiers.push({
        locationScope: 'nationwide',
        matchScope: 'title-and-description',
        jobs: interleaveJobsByBoard(description),
    });

    return tiers;
}

export function selectJobsForSkillInsights(jobs, roleRef, location) {
    const { exact, related, description, all } = filterJobsByJourneyRole(
        jobs,
        roleRef,
    );
    const normalizedLocation = location?.trim() ?? '';
    const analysisTarget = Math.min(MIN_JOURNEY_ANALYSIS_JOBS, jobs.length);
    const tiers = buildWideningTiers({ exact, related, description, location });

    let analyzed = [];
    let locationScope = normalizedLocation ? 'focus' : 'nationwide';
    let matchScope = 'title';

    for (const tier of tiers) {
        analyzed = dedupeJobs([...analyzed, ...tier.jobs]);
        locationScope = tier.locationScope;
        matchScope = tier.matchScope;

        if (analyzed.length >= analysisTarget) {
            break;
        }
    }

    const focusLocationMatches = normalizedLocation
        ? dedupeJobs([
              ...filterJobsByLocationTerm(exact, location),
              ...filterJobsByLocationTerm(related, location),
              ...filterJobsByLocationTerm(description, location),
          ]).length
        : analyzed.length;

    const matchCounts = countAnalyzedRoleMatches(analyzed, roleRef);

    return {
        jobs: analyzed,
        ...matchCounts,
        totalTitleMatches: exact.length + related.length,
        totalRoleMatches: all.length,
        totalLocationMatches: analyzed.length,
        focusLocationMatches,
        analysisTarget,
        locationScope,
        matchScope,
        locationExpanded:
            normalizedLocation !== '' && locationScope === 'nationwide',
        matchScopeExpanded: matchScope === 'title-and-description',
    };
}

function isMappableLocation(location) {
    const normalized = location?.trim() ?? '';
    if (!normalized || normalized === 'Unspecified') {
        return false;
    }

    return !/\bremote\b/i.test(normalized);
}

export function buildSkillHeatmap(skillsByLocation, topSkills) {
    const locations = skillsByLocation
        .slice(0, HEATMAP_LOCATION_LIMIT)
        .map((entry) => entry.location);
    const skills = topSkills.slice(0, HEATMAP_SKILL_LIMIT).map((entry) => entry.skill);

    const rows = skills.map((skill) => ({
        skill,
        values: locations.map((location) => {
            const locationEntry = skillsByLocation.find(
                (item) => item.location === location,
            );
            const skillEntry = locationEntry?.skills.find((item) => item.skill === skill);
            const jobCount = locationEntry?.jobCount ?? 0;
            const count = skillEntry?.count ?? 0;

            return {
                location,
                count,
                percentage:
                    jobCount > 0 ? Math.round((count / jobCount) * 1000) / 10 : 0,
            };
        }),
    }));

    return {
        skills,
        locations,
        rows,
    };
}

export function summarizeJobForMap(job) {
    return {
        id: job.id,
        boardToken: job.boardToken,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        absoluteUrl: job.absoluteUrl,
        updatedAt: job.updatedAt,
    };
}

export function groupJobsByTrackedLocations(jobs, trackedLocations) {
    const trackedSet = new Set(trackedLocations);
    const jobsByLocation = new Map(
        trackedLocations.map((location) => [location, []]),
    );

    for (const job of jobs) {
        const buckets = resolveJobLocationBuckets(job.location ?? '');
        for (const bucket of buckets) {
            if (trackedSet.has(bucket)) {
                jobsByLocation.get(bucket).push(summarizeJobForMap(job));
            }
        }
    }

    for (const list of jobsByLocation.values()) {
        list.sort(
            (left, right) =>
                new Date(right.updatedAt).getTime() -
                new Date(left.updatedAt).getTime(),
        );
    }

    return jobsByLocation;
}

export async function buildJobLocationPoints(skillsByLocation, jobs = []) {
    const trackedLocations = skillsByLocation.map((entry) => entry.location);
    const jobsByLocation = groupJobsByTrackedLocations(jobs, trackedLocations);

    const entries = skillsByLocation.map((entry) => ({
        location: entry.location,
        jobCount: entry.jobCount,
        latitude: null,
        longitude: null,
        jobs: jobsByLocation.get(entry.location) ?? [],
    }));

    const mappableLocations = entries
        .filter((entry) => isMappableLocation(entry.location))
        .map((entry) => entry.location);

    if (mappableLocations.length === 0) {
        return entries;
    }

    const coordinatesByLocation = await geocodeLocations(mappableLocations, {
        maxLookups: 12,
        deadlineMs: 8000,
    });

    return entries.map((entry) => {
        const coordinates = coordinatesByLocation.get(entry.location);
        if (!coordinates) {
            return entry;
        }

        return {
            ...entry,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
        };
    });
}
