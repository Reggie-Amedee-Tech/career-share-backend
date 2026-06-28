import { resolveJobLocationBuckets } from './jobLocationParse.js';

const SKILL_TERMS = [
    { skill: 'Python', pattern: /\bpython\b/i },
    { skill: 'JavaScript', pattern: /\bjavascript\b|\bjs\b/i },
    { skill: 'TypeScript', pattern: /\btypescript\b|\bts\b/i },
    { skill: 'Java', pattern: /\bjava\b(?!script)/i },
    { skill: 'C++', pattern: /\bc\+\+\b/i },
    { skill: 'C#', pattern: /\bc#\b/i },
    { skill: 'Go', pattern: /\bgolang\b|\bgo\b/i },
    { skill: 'Rust', pattern: /\brust\b/i },
    { skill: 'Ruby', pattern: /\bruby\b/i },
    { skill: 'PHP', pattern: /\bphp\b/i },
    { skill: 'Swift', pattern: /\bswift\b/i },
    { skill: 'Kotlin', pattern: /\bkotlin\b/i },
    { skill: 'React', pattern: /\breact\b|\breactjs\b/i },
    { skill: 'Angular', pattern: /\bangular\b/i },
    { skill: 'Vue', pattern: /\bvue\.?js\b|\bvue\b/i },
    { skill: 'Node.js', pattern: /\bnode\.?js\b/i },
    { skill: 'Next.js', pattern: /\bnext\.?js\b/i },
    { skill: 'SQL', pattern: /\bsql\b/i },
    { skill: 'PostgreSQL', pattern: /\bpostgres(?:ql)?\b/i },
    { skill: 'MySQL', pattern: /\bmysql\b/i },
    { skill: 'MongoDB', pattern: /\bmongodb\b|\bmongo\b/i },
    { skill: 'Redis', pattern: /\bredis\b/i },
    { skill: 'GraphQL', pattern: /\bgraphql\b/i },
    { skill: 'REST APIs', pattern: /\brest(?:ful)?\s+api\b|\brest\b/i },
    { skill: 'AWS', pattern: /\baws\b|\bamazon web services\b/i },
    { skill: 'Azure', pattern: /\bazure\b/i },
    { skill: 'GCP', pattern: /\bgcp\b|\bgoogle cloud\b/i },
    { skill: 'Docker', pattern: /\bdocker\b/i },
    { skill: 'Kubernetes', pattern: /\bkubernetes\b|\bk8s\b/i },
    { skill: 'Terraform', pattern: /\bterraform\b/i },
    { skill: 'CI/CD', pattern: /\bci\/cd\b|\bcontinuous integration\b/i },
    { skill: 'Linux', pattern: /\blinux\b/i },
    { skill: 'Git', pattern: /\bgit\b/i },
    { skill: 'Machine Learning', pattern: /\bmachine learning\b|\bml\b/i },
    { skill: 'AI', pattern: /\bartificial intelligence\b|\b\bai\b/i },
    { skill: 'Data Analysis', pattern: /\bdata analysis\b|\bdata analytics\b/i },
    { skill: 'Tableau', pattern: /\btableau\b/i },
    { skill: 'Power BI', pattern: /\bpower bi\b/i },
    { skill: 'Excel', pattern: /\bexcel\b/i },
    { skill: 'Figma', pattern: /\bfigma\b/i },
    { skill: 'Agile', pattern: /\bagile\b|\bscrum\b/i },
    { skill: 'Project Management', pattern: /\bproject management\b/i },
    { skill: 'Communication', pattern: /\bcommunication skills\b|\bstrong communication\b/i },
    { skill: 'Leadership', pattern: /\bleadership\b/i },
    { skill: 'Problem Solving', pattern: /\bproblem[- ]solving\b/i },
    { skill: 'Customer Service', pattern: /\bcustomer service\b/i },
    { skill: 'Sales', pattern: /\bsales\b/i },
    { skill: 'Marketing', pattern: /\bmarketing\b/i },
    { skill: 'SEO', pattern: /\bseo\b|\bsearch engine optimization\b/i },
];

const DEFAULT_TOP_SKILLS = 10;
const DEFAULT_TOP_LOCATIONS = 6;

function buildSkillHaystack(job) {
    return [job.title, job.description ?? ''].join(' ').toLowerCase();
}

export function extractSkillsFromJob(job) {
    const haystack = buildSkillHaystack(job);
    const matched = [];

    for (const { skill, pattern } of SKILL_TERMS) {
        if (pattern.test(haystack)) {
            matched.push(skill);
        }
    }

    return matched;
}

function incrementSkillCount(counts, skill) {
    counts.set(skill, (counts.get(skill) ?? 0) + 1);
}

function toRankedSkills(counts, jobCount, limit) {
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([skill, count]) => ({
            skill,
            count,
            percentage: jobCount > 0 ? Math.round((count / jobCount) * 1000) / 10 : 0,
        }));
}

function resolveJobLocations(job) {
    return resolveJobLocationBuckets(job.location ?? '');
}

export function analyzeJobSkills(jobs, options = {}) {
    const topSkillsLimit = options.topSkillsLimit ?? DEFAULT_TOP_SKILLS;
    const topLocationsLimit = options.topLocationsLimit ?? DEFAULT_TOP_LOCATIONS;

    const overallCounts = new Map();
    const locationJobCounts = new Map();
    const locationSkillCounts = new Map();

    for (const job of jobs) {
        const skills = extractSkillsFromJob(job);
        const locations = resolveJobLocations(job);

        for (const skill of skills) {
            incrementSkillCount(overallCounts, skill);
        }

        for (const location of locations) {
            locationJobCounts.set(location, (locationJobCounts.get(location) ?? 0) + 1);

            if (!locationSkillCounts.has(location)) {
                locationSkillCounts.set(location, new Map());
            }

            const counts = locationSkillCounts.get(location);
            for (const skill of skills) {
                incrementSkillCount(counts, skill);
            }
        }
    }

    const topLocations = [...locationJobCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, topLocationsLimit);

    const skillsByLocation = topLocations.map(([location, jobCount]) => ({
        location,
        jobCount,
        skills: toRankedSkills(locationSkillCounts.get(location) ?? new Map(), jobCount, topSkillsLimit),
    }));

    return {
        totalJobsAnalyzed: jobs.length,
        topSkills: toRankedSkills(overallCounts, jobs.length, topSkillsLimit),
        skillsByLocation,
    };
}
