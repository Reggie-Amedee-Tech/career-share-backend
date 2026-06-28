import { filterJobsBySearch, filterJobsBySkills } from './jobSearch.js';
import {
    filterJobsByLocationTerm,
    filterJobsNearUser,
} from './jobLocation.js';
import { DEFAULT_RADIUS_MILES } from './distance.js';

export async function applyJobFilters(
    jobs,
    { search, skills, nearMe, location, radiusMiles },
    user,
) {
    let filtered = filterJobsBySearch(jobs, search);
    filtered = filterJobsBySkills(filtered, skills);

    if (nearMe) {
        filtered = await filterJobsNearUser(
            filtered,
            user,
            radiusMiles ?? DEFAULT_RADIUS_MILES,
        );
    } else if (location?.trim()) {
        filtered = filterJobsByLocationTerm(filtered, location);
    }

    return filtered;
}
