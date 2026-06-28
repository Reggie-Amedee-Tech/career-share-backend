import { JOURNEY_ROLES, resolveJourneyRole } from './journeyRoles.js';

export const JOURNEY_DISCOVERY_QUESTIONS = [
    {
        id: 'work-motivation',
        prompt: 'What kind of work motivates you most?',
        options: [
            {
                id: 'build-systems',
                label: 'Building and improving software systems',
                roleScores: {
                    'software-engineer': 2,
                    'backend-engineer': 3,
                    'full-stack-engineer': 2,
                    'devops-engineer': 2,
                },
            },
            {
                id: 'data-insights',
                label: 'Finding insights in data and trends',
                roleScores: { 'data-analyst': 3, 'data-scientist': 2 },
            },
            {
                id: 'ml-models',
                label: 'Building predictive models and AI',
                roleScores: {
                    'data-scientist': 3,
                    'machine-learning-engineer': 3,
                },
            },
            {
                id: 'user-experience',
                label: 'Crafting intuitive user experiences',
                roleScores: {
                    'product-designer': 3,
                    'frontend-engineer': 2,
                    'ux-researcher': 2,
                },
            },
            {
                id: 'product-strategy',
                label: 'Shaping product strategy and roadmaps',
                roleScores: { 'product-manager': 3, 'project-manager': 1 },
            },
            {
                id: 'help-customers',
                label: 'Helping customers succeed',
                roleScores: {
                    'customer-success-manager': 3,
                    'sales-representative': 2,
                },
            },
            {
                id: 'drive-growth',
                label: 'Driving growth and market reach',
                roleScores: {
                    'marketing-manager': 3,
                    'sales-representative': 2,
                },
            },
        ],
    },
    {
        id: 'technical-depth',
        prompt: 'How technical do you want your day-to-day work to be?',
        options: [
            {
                id: 'very-technical',
                label: 'Very hands-on with code and systems',
                roleScores: {
                    'software-engineer': 2,
                    'backend-engineer': 2,
                    'machine-learning-engineer': 2,
                    'devops-engineer': 2,
                },
            },
            {
                id: 'some-technical',
                label: 'Mix of tools, analysis, and collaboration',
                roleScores: {
                    'data-analyst': 2,
                    'data-scientist': 2,
                    'frontend-engineer': 2,
                    'full-stack-engineer': 2,
                },
            },
            {
                id: 'lightly-technical',
                label: 'Light technical work, more process and people',
                roleScores: {
                    'product-manager': 2,
                    'project-manager': 2,
                    'product-designer': 1,
                },
            },
            {
                id: 'non-technical',
                label: 'Focused on relationships, communication, and strategy',
                roleScores: {
                    'sales-representative': 2,
                    'customer-success-manager': 2,
                    'marketing-manager': 2,
                },
            },
        ],
    },
    {
        id: 'collaboration-style',
        prompt: 'Which work environment sounds most appealing?',
        options: [
            {
                id: 'deep-focus',
                label: 'Deep focus on complex technical problems',
                roleScores: {
                    'backend-engineer': 2,
                    'data-scientist': 2,
                    'machine-learning-engineer': 2,
                    'devops-engineer': 2,
                },
            },
            {
                id: 'cross-functional',
                label: 'Working across design, engineering, and business',
                roleScores: {
                    'product-manager': 3,
                    'full-stack-engineer': 2,
                    'product-designer': 1,
                },
            },
            {
                id: 'client-facing',
                label: 'Regular interaction with clients or stakeholders',
                roleScores: {
                    'customer-success-manager': 2,
                    'sales-representative': 2,
                    'ux-researcher': 2,
                },
            },
            {
                id: 'visual-creative',
                label: 'Visual, creative, and iterative design work',
                roleScores: { 'product-designer': 3, 'frontend-engineer': 1 },
            },
        ],
    },
    {
        id: 'skills-interest',
        prompt: 'Which skills are you most excited to build?',
        options: [
            {
                id: 'programming',
                label: 'Programming and software architecture',
                roleScores: {
                    'software-engineer': 2,
                    'backend-engineer': 2,
                    'full-stack-engineer': 2,
                },
            },
            {
                id: 'frontend-ui',
                label: 'Web interfaces and front-end frameworks',
                roleScores: { 'frontend-engineer': 3, 'full-stack-engineer': 2 },
            },
            {
                id: 'data-sql',
                label: 'SQL, dashboards, and business analytics',
                roleScores: { 'data-analyst': 3 },
            },
            {
                id: 'statistics-ml',
                label: 'Statistics, machine learning, and experimentation',
                roleScores: {
                    'data-scientist': 2,
                    'machine-learning-engineer': 2,
                },
            },
            {
                id: 'design-research',
                label: 'Design tools and user research',
                roleScores: { 'product-designer': 2, 'ux-researcher': 3 },
            },
            {
                id: 'coordination',
                label: 'Planning, coordination, and delivery',
                roleScores: { 'project-manager': 3, 'product-manager': 1 },
            },
        ],
    },
    {
        id: 'career-path',
        prompt: 'What kind of career path are you aiming for?',
        options: [
            {
                id: 'ic-technical',
                label: 'Individual contributor in a technical specialty',
                roleScores: {
                    'software-engineer': 1,
                    'data-analyst': 1,
                    'data-scientist': 1,
                    'machine-learning-engineer': 1,
                    'devops-engineer': 1,
                },
            },
            {
                id: 'ic-design',
                label: 'Specialist in design or research',
                roleScores: { 'product-designer': 2, 'ux-researcher': 2 },
            },
            {
                id: 'leadership',
                label: 'Leading products, programs, or teams',
                roleScores: {
                    'product-manager': 2,
                    'project-manager': 2,
                    'marketing-manager': 1,
                },
            },
            {
                id: 'revenue',
                label: 'Revenue, partnerships, and business development',
                roleScores: {
                    'sales-representative': 3,
                    'customer-success-manager': 1,
                },
            },
        ],
    },
    {
        id: 'problem-domain',
        prompt: 'What type of problems do you enjoy tackling?',
        options: [
            {
                id: 'scalability',
                label: 'Reliability, scale, and infrastructure',
                roleScores: { 'devops-engineer': 3, 'backend-engineer': 2 },
            },
            {
                id: 'user-needs',
                label: 'Understanding and solving user needs',
                roleScores: {
                    'ux-researcher': 2,
                    'product-designer': 2,
                    'product-manager': 2,
                },
            },
            {
                id: 'business-metrics',
                label: 'Business metrics, forecasting, and reporting',
                roleScores: { 'data-analyst': 2, 'marketing-manager': 1 },
            },
            {
                id: 'market-growth',
                label: 'Market positioning and customer acquisition',
                roleScores: {
                    'marketing-manager': 2,
                    'sales-representative': 2,
                },
            },
        ],
    },
];

const questionsById = new Map(
    JOURNEY_DISCOVERY_QUESTIONS.map((question) => [question.id, question]),
);

const optionByQuestionId = new Map(
    JOURNEY_DISCOVERY_QUESTIONS.map((question) => [
        question.id,
        new Map(question.options.map((option) => [option.id, option])),
    ]),
);

const MAX_RECOMMENDATIONS = 3;

function formatReasonSnippet(optionLabel) {
    return optionLabel.trim().toLowerCase();
}

function buildRecommendationReason(roleId, contributingAnswers) {
    const role = resolveJourneyRole(roleId);
    const snippets = contributingAnswers
        .filter((entry) => entry.roleScores[roleId] > 0)
        .slice(0, 2)
        .map((entry) => formatReasonSnippet(entry.optionLabel));

    if (snippets.length === 0) {
        return `A strong match for a ${role?.label ?? roleId} career path based on your answers.`;
    }

    if (snippets.length === 1) {
        return `Your interest in ${snippets[0]} aligns well with a ${role?.label ?? roleId} path.`;
    }

    return `Your interests in ${snippets[0]} and ${snippets[1]} point toward ${role?.label ?? roleId}.`;
}

export function listDiscoveryQuestions() {
    return JOURNEY_DISCOVERY_QUESTIONS.map(({ id, prompt, options }) => ({
        id,
        prompt,
        options: options.map(({ id: optionId, label }) => ({
            id: optionId,
            label,
        })),
    }));
}

export function validateDiscoveryAnswers(answers) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        return 'Answers must be an object keyed by question id';
    }

    for (const question of JOURNEY_DISCOVERY_QUESTIONS) {
        const selectedOptionId = answers[question.id];
        if (!selectedOptionId) {
            return `Answer required for "${question.prompt}"`;
        }

        const options = optionByQuestionId.get(question.id);
        if (!options?.has(selectedOptionId)) {
            return `Invalid answer for "${question.prompt}"`;
        }
    }

    return null;
}

export function recommendJourneyRoles(answers) {
    const validationError = validateDiscoveryAnswers(answers);
    if (validationError) {
        return { error: validationError };
    }

    const roleScores = new Map();
    const contributingAnswers = [];

    for (const question of JOURNEY_DISCOVERY_QUESTIONS) {
        const option = optionByQuestionId.get(question.id).get(answers[question.id]);
        contributingAnswers.push({
            questionId: question.id,
            optionId: option.id,
            optionLabel: option.label,
            roleScores: option.roleScores,
        });

        for (const [roleId, points] of Object.entries(option.roleScores)) {
            roleScores.set(roleId, (roleScores.get(roleId) ?? 0) + points);
        }
    }

    const ranked = [...roleScores.entries()]
        .filter(([roleId]) => resolveJourneyRole(roleId))
        .sort((left, right) => {
            if (right[1] !== left[1]) {
                return right[1] - left[1];
            }

            const leftIndex = JOURNEY_ROLES.findIndex((role) => role.id === left[0]);
            const rightIndex = JOURNEY_ROLES.findIndex((role) => role.id === right[0]);
            return leftIndex - rightIndex;
        })
        .slice(0, MAX_RECOMMENDATIONS)
        .map(([roleId, score]) => {
            const role = resolveJourneyRole(roleId);
            return {
                roleId,
                label: role.label,
                score,
                reason: buildRecommendationReason(roleId, contributingAnswers),
            };
        });

    if (ranked.length === 0) {
        return { error: 'No matching roles found for your answers' };
    }

    return { recommendations: ranked };
}
