import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { mockUser, mockResource, resourceWithVotes } from './fixtures.js';

async function authenticatedAgent() {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true);

    const agent = request.agent(app);
    await agent
        .post('/login')
        .send({ email: mockUser.email, password: 'secret123' });
    return agent;
}

describe('Resource routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /resources', () => {
        it('returns 400 when required fields are missing', async () => {
            const res = await request(app)
                .post('/resources')
                .send({ title: 'Only title' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Title, description, url, and category are required');
        });

        it('returns 400 for invalid category', async () => {
            const res = await request(app)
                .post('/resources')
                .send({
                    title: 'Test',
                    description: 'Desc',
                    url: 'https://example.com',
                    category: 'INVALID',
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid category');
        });

        it('creates a resource with valid data', async () => {
            vi.mocked(prisma.resource.create).mockResolvedValue(mockResource);

            const res = await request(app)
                .post('/resources')
                .send({
                    title: 'Test Resource',
                    description: 'A helpful resource',
                    url: 'https://example.com',
                    category: 'JOB_SEARCH',
                });

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockResource);
            expect(prisma.resource.create).toHaveBeenCalledWith({
                data: {
                    title: 'Test Resource',
                    description: 'A helpful resource',
                    url: 'https://example.com',
                    category: ['JOB_SEARCH'],
                },
            });
        });
    });

    describe('GET /resources', () => {
        it('returns all resources with vote counts', async () => {
            const resource = resourceWithVotes({
                votes: [
                    { userId: 'user-2', upVote: true, downVote: false },
                    { userId: 'user-3', upVote: false, downVote: true },
                ],
            });
            vi.mocked(prisma.resource.findMany).mockResolvedValue([resource]);

            const res = await request(app).get('/resources');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].upvoteCount).toBe(1);
            expect(res.body[0].downvoteCount).toBe(1);
            expect(res.body[0].userVote).toBeNull();
            expect(res.body[0].votes).toBeUndefined();
        });

        it('filters by category query param', async () => {
            vi.mocked(prisma.resource.findMany).mockResolvedValue([]);

            await request(app).get('/resources?category=JOB_SEARCH,INTERNSHIPS');

            expect(prisma.resource.findMany).toHaveBeenCalledWith({
                where: { category: { hasSome: ['JOB_SEARCH', 'INTERNSHIPS'] } },
                include: {
                    votes: {
                        select: { userId: true, upVote: true, downVote: true },
                    },
                },
            });
        });

        it('includes userVote when authenticated', async () => {
            const resource = resourceWithVotes({
                votes: [{ userId: mockUser.id, upVote: true, downVote: false }],
            });
            vi.mocked(prisma.resource.findMany).mockResolvedValue([resource]);

            const agent = await authenticatedAgent();
            const res = await agent.get('/resources');

            expect(res.status).toBe(200);
            expect(res.body[0].userVote).toBe('up');
        });
    });

    describe('GET /resources/:id', () => {
        it('returns 404 when resource does not exist', async () => {
            vi.mocked(prisma.resource.findUnique).mockResolvedValue(null);

            const res = await request(app).get('/resources/missing-id');

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Resource not found');
        });

        it('returns formatted resource when found', async () => {
            const resource = resourceWithVotes();
            vi.mocked(prisma.resource.findUnique).mockResolvedValue(resource);

            const res = await request(app).get('/resources/resource-1');

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('resource-1');
            expect(res.body.upvoteCount).toBe(0);
            expect(res.body.downvoteCount).toBe(0);
        });
    });

    describe('PATCH /resources/:id', () => {
        it('returns 404 when resource does not exist', async () => {
            vi.mocked(prisma.resource.findUnique).mockResolvedValue(null);

            const res = await request(app)
                .patch('/resources/missing-id')
                .send({ title: 'Updated' });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Resource not found');
        });

        it('returns 401 when voting without authentication', async () => {
            vi.mocked(prisma.resource.findUnique).mockResolvedValue(mockResource);

            const res = await request(app)
                .patch('/resources/resource-1')
                .send({ vote: 'up' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
        });

        it('returns 400 for invalid vote value', async () => {
            vi.mocked(prisma.resource.findUnique).mockResolvedValue(mockResource);

            const agent = await authenticatedAgent();
            const res = await agent
                .patch('/resources/resource-1')
                .send({ vote: 'sideways' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Vote must be "up" or "down"');
        });

        it('creates an upvote for authenticated user', async () => {
            const updated = resourceWithVotes({
                votes: [{ userId: mockUser.id, upVote: true, downVote: false }],
            });
            vi.mocked(prisma.resource.findUnique)
                .mockResolvedValueOnce(mockResource)
                .mockResolvedValueOnce(updated);
            vi.mocked(prisma.vote.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.vote.create).mockResolvedValue({});

            const agent = await authenticatedAgent();
            const res = await agent
                .patch('/resources/resource-1')
                .send({ vote: 'up' });

            expect(res.status).toBe(200);
            expect(res.body.userVote).toBe('up');
            expect(res.body.upvoteCount).toBe(1);
            expect(prisma.vote.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUser.id,
                    resourceId: 'resource-1',
                    upVote: true,
                    downVote: false,
                },
            });
        });

        it('updates resource fields', async () => {
            const updated = resourceWithVotes({ title: 'Updated Title' });
            vi.mocked(prisma.resource.findUnique)
                .mockResolvedValueOnce(mockResource)
                .mockResolvedValueOnce(updated);
            vi.mocked(prisma.resource.update).mockResolvedValue(updated);

            const res = await request(app)
                .patch('/resources/resource-1')
                .send({ title: 'Updated Title' });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Updated Title');
            expect(prisma.resource.update).toHaveBeenCalledWith({
                where: { id: 'resource-1' },
                data: { title: 'Updated Title' },
            });
        });

        it('returns 400 for invalid category on update', async () => {
            vi.mocked(prisma.resource.findUnique).mockResolvedValue(mockResource);

            const res = await request(app)
                .patch('/resources/resource-1')
                .send({ category: 'NOT_A_CATEGORY' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid category');
        });
    });

    describe('DELETE /resources/:id', () => {
        it('deletes and returns the resource', async () => {
            vi.mocked(prisma.resource.delete).mockResolvedValue(mockResource);

            const res = await request(app).delete('/resources/resource-1');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockResource);
            expect(prisma.resource.delete).toHaveBeenCalledWith({
                where: { id: 'resource-1' },
            });
        });
    });
});
