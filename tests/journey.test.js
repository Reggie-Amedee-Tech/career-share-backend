import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { mockJourney, mockUser } from './fixtures.js';

const journeyPayload = {
    name: 'Backend Developer',
    targetJobRoleId: 'backend-engineer',
    targetJobLocation: 'San Francisco, CA',
    chartConfig: { topSkillsLimit: 8, topLocationsLimit: 4 },
};

async function login(agent) {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    const bcrypt = await import('bcryptjs');
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true);
    await agent.post('/login').send({ email: mockUser.email, password: 'secret123' });
}

describe('Journey routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/journeys', () => {
        it('returns 401 when not authenticated', async () => {
            const res = await request(app).get('/api/journeys');
            expect(res.status).toBe(401);
        });

        it('returns journeys for the signed-in user', async () => {
            vi.mocked(prisma.professionalJourney.findMany).mockResolvedValue([mockJourney]);
            const agent = request.agent(app);
            await login(agent);

            const res = await agent.get('/api/journeys');

            expect(res.status).toBe(200);
            expect(res.body.journeys).toHaveLength(1);
            expect(res.body.journeys[0].name).toBe('Frontend Developer');
        });
    });

    describe('POST /api/journeys', () => {
        it('returns 400 when required fields are missing', async () => {
            const agent = request.agent(app);
            await login(agent);

            const res = await agent.post('/api/journeys').send({ name: 'Only a name' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Target job title is required');
        });

        it('creates a journey for the signed-in user', async () => {
            vi.mocked(prisma.professionalJourney.create).mockResolvedValue({
                ...mockJourney,
                ...journeyPayload,
                id: 'journey-2',
            });
            const agent = request.agent(app);
            await login(agent);

            const res = await agent.post('/api/journeys').send(journeyPayload);

            expect(res.status).toBe(201);
            expect(res.body.journey.name).toBe('Backend Developer');
            expect(prisma.professionalJourney.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: mockUser.id,
                    name: 'Backend Developer',
                    targetJobTitle: 'backend-engineer',
                    targetJobLocation: 'San Francisco, CA',
                }),
            });
        });
    });

    describe('PATCH /api/journeys/:id', () => {
        it('returns 404 when journey does not belong to user', async () => {
            vi.mocked(prisma.professionalJourney.findFirst).mockResolvedValue(null);
            const agent = request.agent(app);
            await login(agent);

            const res = await agent
                .patch('/api/journeys/journey-1')
                .send({ name: 'Updated name' });

            expect(res.status).toBe(404);
        });

        it('updates an owned journey', async () => {
            vi.mocked(prisma.professionalJourney.findFirst).mockResolvedValue(mockJourney);
            vi.mocked(prisma.professionalJourney.update).mockResolvedValue({
                ...mockJourney,
                name: 'Updated Frontend',
            });
            const agent = request.agent(app);
            await login(agent);

            const res = await agent
                .patch('/api/journeys/journey-1')
                .send({ name: 'Updated Frontend' });

            expect(res.status).toBe(200);
            expect(res.body.journey.name).toBe('Updated Frontend');
        });
    });

    describe('DELETE /api/journeys/:id', () => {
        it('deletes an owned journey', async () => {
            vi.mocked(prisma.professionalJourney.findFirst).mockResolvedValue(mockJourney);
            vi.mocked(prisma.professionalJourney.delete).mockResolvedValue(mockJourney);
            const agent = request.agent(app);
            await login(agent);

            const res = await agent.delete('/api/journeys/journey-1');

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Journey deleted');
        });
    });
});
