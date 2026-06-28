import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { mockUser } from './fixtures.js';
import {
    JOURNEY_DISCOVERY_QUESTIONS,
    listDiscoveryQuestions,
    recommendJourneyRoles,
    validateDiscoveryAnswers,
} from '../utils/journeyDiscovery.js';

const dataAnalystAnswers = {
    'work-motivation': 'data-insights',
    'technical-depth': 'some-technical',
    'collaboration-style': 'cross-functional',
    'skills-interest': 'data-sql',
    'career-path': 'ic-technical',
    'problem-domain': 'business-metrics',
};

const productDesignerAnswers = {
    'work-motivation': 'user-experience',
    'technical-depth': 'lightly-technical',
    'collaboration-style': 'visual-creative',
    'skills-interest': 'design-research',
    'career-path': 'ic-design',
    'problem-domain': 'user-needs',
};

async function login(agent) {
    const bcrypt = await import('bcryptjs');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true);
    await agent.post('/login').send({ email: mockUser.email, password: 'secret123' });
}

describe('journey discovery utils', () => {
    it('lists questions without role scoring metadata', () => {
        const questions = listDiscoveryQuestions();

        expect(questions).toHaveLength(JOURNEY_DISCOVERY_QUESTIONS.length);
        expect(questions[0]).toEqual({
            id: JOURNEY_DISCOVERY_QUESTIONS[0].id,
            prompt: JOURNEY_DISCOVERY_QUESTIONS[0].prompt,
            options: JOURNEY_DISCOVERY_QUESTIONS[0].options.map(({ id, label }) => ({
                id,
                label,
            })),
        });
        expect(questions[0].options[0]).not.toHaveProperty('roleScores');
    });

    it('validates required and supported answers', () => {
        expect(validateDiscoveryAnswers(null)).toContain('object');
        expect(validateDiscoveryAnswers({})).toContain('Answer required');
        expect(
            validateDiscoveryAnswers({
                ...dataAnalystAnswers,
                'work-motivation': 'not-real',
            }),
        ).toContain('Invalid answer');
        expect(validateDiscoveryAnswers(dataAnalystAnswers)).toBeNull();
    });

    it('recommends data analyst for analytics-oriented answers', () => {
        const result = recommendJourneyRoles(dataAnalystAnswers);

        expect(result.error).toBeUndefined();
        expect(result.recommendations[0]).toMatchObject({
            roleId: 'data-analyst',
            label: 'Data Analyst',
        });
        expect(result.recommendations[0].reason).toContain('Data Analyst');
    });

    it('recommends product designer for design-oriented answers', () => {
        const result = recommendJourneyRoles(productDesignerAnswers);

        expect(result.recommendations[0]).toMatchObject({
            roleId: 'product-designer',
            label: 'Product Designer',
        });
    });
});

describe('Journey discovery routes', () => {
    it('returns 401 when not authenticated', async () => {
        const questionsRes = await request(app).get('/api/journey-discovery/questions');
        const recommendRes = await request(app)
            .post('/api/journey-discovery/recommend')
            .send({ answers: dataAnalystAnswers });

        expect(questionsRes.status).toBe(401);
        expect(recommendRes.status).toBe(401);
    });

    it('returns discovery questions for signed-in users', async () => {
        const agent = request.agent(app);
        await login(agent);

        const res = await agent.get('/api/journey-discovery/questions');

        expect(res.status).toBe(200);
        expect(res.body.questions).toHaveLength(JOURNEY_DISCOVERY_QUESTIONS.length);
    });

    it('returns role recommendations for valid answers', async () => {
        const agent = request.agent(app);
        await login(agent);

        const res = await agent
            .post('/api/journey-discovery/recommend')
            .send({ answers: dataAnalystAnswers });

        expect(res.status).toBe(200);
        expect(res.body.recommendations[0].roleId).toBe('data-analyst');
    });
});
