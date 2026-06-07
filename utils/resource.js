import { prisma } from '../lib/prisma.js';

export const VALID_CATEGORIES = [
    'CAREER_DEVELOPMENT',
    'JOB_SEARCH',
    'RESOURCES',
    'JOB_MARKETING',
    'INTERNSHIPS',
    'OTHER',
];

export const resourceWithVotesInclude = {
    votes: {
        select: { userId: true, upVote: true, downVote: true },
    },
};

export function normalizeCategories(category) {
    if (Array.isArray(category)) {
        return category;
    }
    if (category) {
        return [category];
    }
    return [];
}

export function isValidCategoryList(categories) {
    return categories.length > 0 && categories.every((value) => VALID_CATEGORIES.includes(value));
}

export function formatResourceWithVotes(resource, userId) {
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

export function parseResourceCategoryFilter(categoryParam) {
    if (!categoryParam) {
        return null;
    }

    const categories = normalizeCategories(
        Array.isArray(categoryParam) ? categoryParam : categoryParam.split(','),
    ).filter((value) => VALID_CATEGORIES.includes(value));

    return categories.length > 0 ? categories : null;
}

export async function applyResourceVote(resourceId, userId, vote) {
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
