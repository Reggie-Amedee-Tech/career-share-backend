export const mockUser = {
    id: 'user-1',
    fName: 'Jane',
    lName: 'Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
};

export const mockResource = {
    id: 'resource-1',
    title: 'Test Resource',
    description: 'A helpful resource',
    url: 'https://example.com',
    category: ['JOB_SEARCH'],
    userId: null,
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z',
    votes: [],
};

export function resourceWithVotes(overrides = {}) {
    return {
        ...mockResource,
        votes: [],
        ...overrides,
    };
}
