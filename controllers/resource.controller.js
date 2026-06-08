import { prisma } from '../lib/prisma.js';
import { handleApiError } from '../utils/errors.js';
import { getSessionUserId } from '../utils/user.js';
import {
    applyResourceVote,
    formatResourceWithVotes,
    isValidCategoryList,
    normalizeCategories,
    parseResourceCategoryFilter,
    resourceWithVotesInclude,
} from '../utils/resource.js';

export async function createResource(req, res) {
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
}

export async function updateResource(req, res) {
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
}

export async function deleteResource(req, res) {
    try {
        const { id } = req.params;
        const resource = await prisma.resource.delete({
            where: { id },
        });
        res.json(resource);
    } catch (error) {
        handleApiError(res, 'DELETE /resources/:id', error, req);
    }
}

export async function listResources(req, res) {
    try {
        const userId = getSessionUserId(req);
        const filterCategories = parseResourceCategoryFilter(req.query.category);
        const where = filterCategories
            ? { category: { hasSome: filterCategories } }
            : undefined;

        const resources = await prisma.resource.findMany({
            where,
            include: resourceWithVotesInclude,
            orderBy: { createdAt: 'desc' },
        });
        res.json(resources.map((resource) => formatResourceWithVotes(resource, userId)));
    } catch (error) {
        handleApiError(res, 'GET /resources', error, req);
    }
}

export async function getResource(req, res) {
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
}
