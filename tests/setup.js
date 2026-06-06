import 'dotenv/config';
import { vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        resource: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        vote: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed-password'),
        compare: vi.fn(),
    },
}));

process.env.NODE_ENV = 'test';

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is required. Add it to your .env file.');
}

