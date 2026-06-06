import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { mockUser } from './fixtures.js';

describe('Auth routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/users', () => {
        it('returns 400 when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ email: 'jane@example.com' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('All fields are required');
        });

        it('returns 409 when email is already in use', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/users')
                .send({
                    fName: 'Jane',
                    lName: 'Doe',
                    email: 'jane@example.com',
                    password: 'secret123',
                });

            expect(res.status).toBe(409);
            expect(res.body.message).toBe('Email already in use');
        });

        it('creates a user and sets session on success', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/users')
                .send({
                    fName: 'Jane',
                    lName: 'Doe',
                    email: 'jane@example.com',
                    password: 'secret123',
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Account created');
            expect(res.body.user).toEqual({
                id: mockUser.id,
                fName: mockUser.fName,
                lName: mockUser.lName,
                email: mockUser.email,
            });
            expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    fName: 'Jane',
                    lName: 'Doe',
                    email: 'jane@example.com',
                    password: 'hashed-password',
                },
            });
        });
    });

    describe('POST /login', () => {
        it('returns 400 when email or password is missing', async () => {
            const res = await request(app)
                .post('/login')
                .send({ email: 'jane@example.com' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email and password are required');
        });

        it('returns 401 for unknown email', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            const res = await request(app)
                .post('/login')
                .send({ email: 'jane@example.com', password: 'wrong' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });

        it('returns 401 for invalid password', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(bcrypt.compare).mockResolvedValue(false);

            const res = await request(app)
                .post('/login')
                .send({ email: 'jane@example.com', password: 'wrong' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });

        it('logs in and returns user on success', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(bcrypt.compare).mockResolvedValue(true);

            const res = await request(app)
                .post('/login')
                .send({ email: 'jane@example.com', password: 'secret123' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Login successful');
            expect(res.body.user.email).toBe(mockUser.email);
        });
    });

    describe('GET /profile', () => {
        it('returns 401 when not authenticated', async () => {
            const res = await request(app).get('/profile');

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
        });

        it('returns user when session exists', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(bcrypt.compare).mockResolvedValue(true);

            const agent = request.agent(app);
            await agent
                .post('/login')
                .send({ email: 'jane@example.com', password: 'secret123' });

            const res = await agent.get('/profile');

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe(mockUser.email);
        });
    });

    describe('POST /logout', () => {
        it('destroys session and returns success', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(bcrypt.compare).mockResolvedValue(true);

            const agent = request.agent(app);
            await agent
                .post('/login')
                .send({ email: 'jane@example.com', password: 'secret123' });

            const logoutRes = await agent.post('/logout');
            expect(logoutRes.status).toBe(200);
            expect(logoutRes.body.message).toBe('Logout successful');

            const profileRes = await agent.get('/profile');
            expect(profileRes.status).toBe(401);
        });
    });
});
