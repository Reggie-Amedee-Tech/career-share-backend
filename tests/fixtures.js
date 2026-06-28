export const mockUser = {
    id: 'user-1',
    fName: 'Jane',
    lName: 'Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
    addressLine1: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    location: '123 Main St, New York, NY 10001, United States',
    latitude: 40.7484,
    longitude: -73.9967,
    countryShortName: 'US',
};

export const mockJourney = {
    id: 'journey-1',
    userId: mockUser.id,
    name: 'Frontend Developer',
    targetJobTitle: 'frontend-engineer',
    targetJobLocation: 'New York, NY',
    chartConfig: { topSkillsLimit: 10, topLocationsLimit: 6 },
    createdAt: new Date('2026-06-01T12:00:00.000Z'),
    updatedAt: new Date('2026-06-01T12:00:00.000Z'),
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
