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
    votes: [],
};

export function resourceWithVotes(overrides = {}) {
    return {
        ...mockResource,
        votes: [],
        ...overrides,
    };
}
