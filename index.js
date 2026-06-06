import 'dotenv/config';
import express from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import session from 'express-session';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function toSessionUser(user) {
    return {
        id: user.id,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
    };
}

function logApiError(operation, error, req) {
    console.error(`[API Error] ${operation}`, {
        method: req?.method,
        path: req?.originalUrl ?? req?.url,
        message: error?.message,
        stack: error?.stack,
    });
}

function handleApiError(res, operation, error, req) {
    logApiError(operation, error, req);
    res.status(500).json({ error: error.message });
}

function getSessionUserId(req) {
    return req.session.user?.id ?? null;
}

function formatResourceWithVotes(resource, userId) {
    const upvotes = resource.votes.filter((vote) => vote.upVote);
    const downvotes = resource.votes.filter((vote) => vote.downVote);
    const { votes, ...rest } = resource;

    let userVote = null;
    if (userId) {
        const userVoteRecord = resource.votes.find((vote) => vote.userId === userId);
        if (userVoteRecord?.upVote) {
            userVote = 'up';
        } else if (userVoteRecord?.downVote) {
            userVote = 'down';
        }
    }

    return {
        ...rest,
        upvoteCount: upvotes.length,
        downvoteCount: downvotes.length,
        userVote,
    };
}

const VALID_CATEGORIES = [
    'CAREER_DEVELOPMENT',
    'JOB_SEARCH',
    'RESOURCES',
    'JOB_MARKETING',
    'INTERNSHIPS',
    'OTHER',
];

function normalizeCategories(category) {
    if (Array.isArray(category)) {
        return category;
    }
    if (category) {
        return [category];
    }
    return [];
}

function isValidCategoryList(categories) {
    return categories.length > 0 && categories.every((value) => VALID_CATEGORIES.includes(value));
}

const resourceWithVotesInclude = {
    votes: {
        select: { userId: true, upVote: true, downVote: true },
    },
};

async function applyResourceVote(resourceId, userId, vote) {
    const existingVote = await prisma.vote.findFirst({
        where: { resourceId, userId },
    });

    const isUpvote = vote === 'up';
    const isSameVote = existingVote && (
        (isUpvote && existingVote.upVote) || (!isUpvote && existingVote.downVote)
    );

    if (isSameVote) {
        await prisma.vote.delete({ where: { id: existingVote.id } });
    } else if (existingVote) {
        await prisma.vote.update({
            where: { id: existingVote.id },
            data: { upVote: isUpvote, downVote: !isUpvote },
        });
    } else {
        await prisma.vote.create({
            data: {
                userId,
                resourceId,
                upVote: isUpvote,
                downVote: !isUpvote,
            },
        });
    }
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_URL);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// User authentication routes

app.post('/api/users', async (req, res) => {
    try {
        const { fName, lName, email, password } = req.body;

        if (!fName || !lName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { fName, lName, email, password: hashedPassword },
        });

        req.session.user = toSessionUser(user);
        res.status(201).json({ message: 'Account created', user: req.session.user });
    } catch (error) {
        handleApiError(res, 'POST /api/users', error, req);
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.user = toSessionUser(user);
        res.json({ message: 'Login successful', user: req.session.user });
    } catch (error) {
        handleApiError(res, 'POST /login', error, req);
    }
});

app.get('/profile', (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json({ user: req.session.user });
    } catch (error) {
        handleApiError(res, 'GET /profile', error, req);
    }
});

app.post('/logout', (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                logApiError('POST /logout', err, req);
                return res.status(500).json({ message: 'Logout failed' });
            }
            res.json({ message: 'Logout successful' });
        });
    } catch (error) {
        handleApiError(res, 'POST /logout', error, req);
    }
});

// Resource routes
app.post("/resources", async (req, res) => {
    try {
        const { title, description, url, category } = req.body;

        if (!title || !description || !url || !category) {
            return res.status(400).json({
                message: 'Title, description, url, and category are required',
            });
        }

        const categories = normalizeCategories(category);
        if (!isValidCategoryList(categories)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const resource = await prisma.resource.create({
            data: { title, description, url, category: categories },
        });
        res.json(resource);
    } catch (error) {
        handleApiError(res, 'POST /resources', error, req);
    }
});

app.patch("/resources/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, url, category, vote } = req.body;
        const userId = getSessionUserId(req);

        const resource = await prisma.resource.findUnique({ where: { id } });
        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        if (vote !== undefined) {
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            if (vote !== 'up' && vote !== 'down') {
                return res.status(400).json({ message: 'Vote must be "up" or "down"' });
            }

            await applyResourceVote(id, userId, vote);
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (url !== undefined) updateData.url = url;
        if (category !== undefined) {
            const categories = normalizeCategories(category);
            if (!isValidCategoryList(categories)) {
                return res.status(400).json({ message: 'Invalid category' });
            }
            updateData.category = categories;
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.resource.update({
                where: { id },
                data: updateData,
            });
        }

        const updatedResource = await prisma.resource.findUnique({
            where: { id },
            include: resourceWithVotesInclude,
        });

        res.json(formatResourceWithVotes(updatedResource, userId));
    } catch (error) {
        handleApiError(res, 'PATCH /resources/:id', error, req);
    }
});

app.delete("/resources/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await prisma.resource.delete({
            where: { id }
        });
        res.json(resource);
    } catch (error) {
        handleApiError(res, 'DELETE /resources/:id', error, req);
    }
});

function parseResourceCategoryFilter(categoryParam) {
    if (!categoryParam) {
        return null;
    }

    const categories = normalizeCategories(
        Array.isArray(categoryParam) ? categoryParam : categoryParam.split(','),
    ).filter((value) => VALID_CATEGORIES.includes(value));

    return categories.length > 0 ? categories : null;
}

app.get("/resources", async (req, res) => {
    try {
        const userId = getSessionUserId(req);
        const filterCategories = parseResourceCategoryFilter(req.query.category);
        const where = filterCategories
            ? { category: { hasSome: filterCategories } }
            : undefined;

        const resources = await prisma.resource.findMany({
            where,
            include: resourceWithVotesInclude,
        });
        res.json(resources.map((resource) => formatResourceWithVotes(resource, userId)));
    } catch (error) {
        handleApiError(res, 'GET /resources', error, req);
    }
});

app.get("/resources/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const userId = getSessionUserId(req);
        const resource = await prisma.resource.findUnique({
            where: { id },
            include: resourceWithVotesInclude,
        });

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        res.json(formatResourceWithVotes(resource, userId));
    } catch (error) {
        handleApiError(res, 'GET /resources/:id', error, req);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


