export const JOURNEY_ROLES = [
    {
        id: 'data-analyst',
        label: 'Data Analyst',
        primaryPhrases: ['data analyst', 'data analytics'],
        relatedPhrases: [
            'analytics engineer',
            'business intelligence',
            'bi analyst',
            'business analyst',
            'insights analyst',
            'reporting analyst',
            'advanced analytics',
            'product analyst',
            'growth analyst',
            'marketing analyst',
            'operations analyst',
            'strategy analyst',
            'quantitative analyst',
            'analytics manager',
            'analytics lead',
            'revenue analyst',
            'sales analyst',
            'research analyst',
            'decision scientist',
            'metric analyst',
        ],
    },
    {
        id: 'data-scientist',
        label: 'Data Scientist',
        primaryPhrases: ['data scientist', 'data science'],
        relatedPhrases: [
            'machine learning engineer',
            'applied scientist',
            'research scientist',
            'ml engineer',
            'ai scientist',
            'decision scientist',
            'quantitative researcher',
        ],
    },
    {
        id: 'software-engineer',
        label: 'Software Engineer',
        primaryPhrases: ['software engineer', 'software developer'],
        relatedPhrases: [
            'backend engineer',
            'frontend engineer',
            'full stack engineer',
            'fullstack engineer',
            'platform engineer',
            'application engineer',
            'site reliability engineer',
            'systems engineer',
            'infrastructure engineer',
            'mobile engineer',
            'ios engineer',
            'android engineer',
            'staff engineer',
            'principal engineer',
        ],
    },
    {
        id: 'frontend-engineer',
        label: 'Frontend Engineer',
        primaryPhrases: ['frontend engineer', 'front end engineer', 'front-end engineer'],
        relatedPhrases: [
            'frontend developer',
            'front end developer',
            'ui engineer',
            'web engineer',
            'react engineer',
            'javascript engineer',
        ],
    },
    {
        id: 'backend-engineer',
        label: 'Backend Engineer',
        primaryPhrases: ['backend engineer', 'back end engineer', 'back-end engineer'],
        relatedPhrases: [
            'backend developer',
            'back end developer',
            'api engineer',
            'services engineer',
            'platform engineer',
            'distributed systems engineer',
        ],
    },
    {
        id: 'full-stack-engineer',
        label: 'Full Stack Engineer',
        primaryPhrases: ['full stack engineer', 'fullstack engineer', 'full-stack engineer'],
        relatedPhrases: [
            'full stack developer',
            'fullstack developer',
            'full-stack developer',
            'web developer',
        ],
    },
    {
        id: 'machine-learning-engineer',
        label: 'Machine Learning Engineer',
        primaryPhrases: ['machine learning engineer', 'ml engineer'],
        relatedPhrases: [
            'deep learning engineer',
            'ai engineer',
            'applied machine learning',
            'mlops engineer',
            'computer vision engineer',
            'nlp engineer',
        ],
    },
    {
        id: 'devops-engineer',
        label: 'DevOps / SRE Engineer',
        primaryPhrases: [
            'devops engineer',
            'site reliability engineer',
            'sre',
            'devsecops engineer',
        ],
        relatedPhrases: [
            'platform reliability engineer',
            'infrastructure engineer',
            'cloud engineer',
            'release engineer',
            'production engineer',
            'systems reliability engineer',
        ],
    },
    {
        id: 'product-manager',
        label: 'Product Manager',
        primaryPhrases: ['product manager'],
        relatedPhrases: [
            'product lead',
            'technical product manager',
            'group product manager',
            'principal product manager',
            'associate product manager',
            'product owner',
            'program manager',
        ],
    },
    {
        id: 'product-designer',
        label: 'Product Designer',
        primaryPhrases: ['product designer', 'ux designer', 'ui designer'],
        relatedPhrases: [
            'experience designer',
            'interaction designer',
            'visual designer',
            'design lead',
            'senior designer',
        ],
    },
    {
        id: 'ux-researcher',
        label: 'UX Researcher',
        primaryPhrases: ['ux researcher', 'user researcher'],
        relatedPhrases: [
            'design researcher',
            'research operations',
            'qualitative researcher',
            'usability researcher',
        ],
    },
    {
        id: 'project-manager',
        label: 'Project Manager',
        primaryPhrases: ['project manager'],
        relatedPhrases: [
            'program manager',
            'technical program manager',
            'delivery manager',
            'scrum master',
            'agile coach',
        ],
    },
    {
        id: 'marketing-manager',
        label: 'Marketing Manager',
        primaryPhrases: ['marketing manager'],
        relatedPhrases: [
            'growth marketing',
            'product marketing manager',
            'digital marketing manager',
            'content marketing manager',
            'demand generation',
            'brand manager',
        ],
    },
    {
        id: 'customer-success-manager',
        label: 'Customer Success Manager',
        primaryPhrases: ['customer success manager', 'customer success'],
        relatedPhrases: [
            'client success manager',
            'account manager',
            'customer experience manager',
            'implementation manager',
        ],
    },
    {
        id: 'sales-representative',
        label: 'Sales / Account Executive',
        primaryPhrases: [
            'account executive',
            'sales representative',
            'sales development representative',
            'business development representative',
        ],
        relatedPhrases: [
            'enterprise account executive',
            'commercial account executive',
            'inside sales',
            'sales manager',
            'partnerships manager',
        ],
    },
];

const rolesById = new Map(JOURNEY_ROLES.map((role) => [role.id, role]));
const rolesByLabel = new Map(
    JOURNEY_ROLES.map((role) => [role.label.trim().toLowerCase(), role]),
);

export function listJourneyRoles() {
    return JOURNEY_ROLES.map(({ id, label }) => ({ id, label }));
}

export function resolveJourneyRole(roleRef) {
    const normalized = String(roleRef ?? '').trim();
    if (!normalized) {
        return null;
    }

    const byId = rolesById.get(normalized.toLowerCase());
    if (byId) {
        return byId;
    }

    return rolesByLabel.get(normalized.toLowerCase()) ?? null;
}

export function isSupportedJourneyRole(roleRef) {
    return resolveJourneyRole(roleRef) !== null;
}
