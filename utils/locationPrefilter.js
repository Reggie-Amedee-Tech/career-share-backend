const US_CITY_ALIAS_SITES = [
    [/\bnyc\b/i, 'New York, NY'],
    [/\bnew york city\b/i, 'New York, NY'],
    [/\bus-nyc\b/i, 'New York, NY'],
    [/\bus-ny\b/i, 'New York, NY'],
    [/\bsan francisco\b/i, 'San Francisco, CA'],
    [/\bus-sf\b/i, 'San Francisco, CA'],
    [/\bsf\b/i, 'San Francisco, CA'],
    [/\bsf bay area\b/i, 'San Francisco, CA'],
    [/\bseattle\b/i, 'Seattle, WA'],
    [/\bus-sea\b/i, 'Seattle, WA'],
    [/\bsea\b/i, 'Seattle, WA'],
    [/\bchicago\b/i, 'Chicago, IL'],
    [/\bus-chicago\b/i, 'Chicago, IL'],
    [/\bboston\b/i, 'Boston, MA'],
    [/\batlanta\b/i, 'Atlanta, GA'],
    [/\baustin\b/i, 'Austin, TX'],
    [/\blos angeles\b/i, 'Los Angeles, CA'],
    [/\bwashington,?\s*d\.?c\.?\b/i, 'Washington, DC'],
    [/\bdenver\b/i, 'Denver, CO'],
];

export { US_CITY_ALIAS_SITES };

const CITY_ALIASES = {
    'new york': ['nyc', 'new york city', 'manhattan', 'brooklyn', 'queens', 'bronx'],
    'los angeles': ['los angeles'],
    'san francisco': ['san francisco', 'sf bay area'],
    'chicago': ['chicago'],
    'seattle': ['seattle'],
};

const VAGUE_LOCATION_MARKERS = [
    'multiple locations',
    'various locations',
    'americas',
    'emea',
    'apac',
    'latam',
    'global',
    'worldwide',
    'anywhere',
    'multiple offices',
];

const US_STATE_NAMES_TO_ABBR = {
    alabama: 'AL',
    alaska: 'AK',
    arizona: 'AZ',
    arkansas: 'AR',
    california: 'CA',
    colorado: 'CO',
    connecticut: 'CT',
    delaware: 'DE',
    florida: 'FL',
    georgia: 'GA',
    hawaii: 'HI',
    idaho: 'ID',
    illinois: 'IL',
    indiana: 'IN',
    iowa: 'IA',
    kansas: 'KS',
    kentucky: 'KY',
    louisiana: 'LA',
    maine: 'ME',
    maryland: 'MD',
    massachusetts: 'MA',
    michigan: 'MI',
    minnesota: 'MN',
    mississippi: 'MS',
    missouri: 'MO',
    montana: 'MT',
    nebraska: 'NE',
    nevada: 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    ohio: 'OH',
    oklahoma: 'OK',
    oregon: 'OR',
    pennsylvania: 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    tennessee: 'TN',
    texas: 'TX',
    utah: 'UT',
    vermont: 'VT',
    virginia: 'VA',
    washington: 'WA',
    'west virginia': 'WV',
    wisconsin: 'WI',
    wyoming: 'WY',
    'district of columbia': 'DC',
};

export const US_ADJACENT_STATES = {
    AL: ['TN', 'GA', 'FL', 'MS'],
    AK: [],
    AZ: ['CA', 'NV', 'UT', 'CO', 'NM'],
    AR: ['MO', 'TN', 'MS', 'LA', 'TX', 'OK'],
    CA: ['OR', 'NV', 'AZ'],
    CO: ['WY', 'NE', 'KS', 'OK', 'NM', 'AZ', 'UT'],
    CT: ['NY', 'MA', 'RI'],
    DE: ['MD', 'PA', 'NJ'],
    FL: ['GA', 'AL'],
    GA: ['FL', 'AL', 'TN', 'NC', 'SC'],
    HI: [],
    ID: ['MT', 'WY', 'UT', 'NV', 'OR', 'WA'],
    IL: ['WI', 'IA', 'MO', 'KY', 'IN'],
    IN: ['MI', 'OH', 'KY', 'IL'],
    IA: ['MN', 'WI', 'IL', 'MO', 'NE', 'SD'],
    KS: ['NE', 'MO', 'OK', 'CO'],
    KY: ['IL', 'IN', 'OH', 'WV', 'VA', 'TN', 'MO'],
    LA: ['TX', 'AR', 'MS'],
    ME: ['NH'],
    MD: ['PA', 'DE', 'VA', 'WV'],
    MA: ['NH', 'RI', 'CT', 'NY', 'VT'],
    MI: ['OH', 'IN', 'WI'],
    MN: ['WI', 'IA', 'SD', 'ND'],
    MS: ['TN', 'AL', 'LA', 'AR'],
    MO: ['IA', 'IL', 'KY', 'TN', 'AR', 'OK', 'KS', 'NE'],
    MT: ['ND', 'SD', 'WY', 'ID'],
    NE: ['SD', 'IA', 'MO', 'KS', 'CO', 'WY'],
    NV: ['OR', 'ID', 'UT', 'AZ', 'CA'],
    NH: ['ME', 'MA', 'VT'],
    NJ: ['NY', 'PA', 'DE'],
    NM: ['CO', 'OK', 'TX', 'AZ'],
    NY: ['NJ', 'CT', 'PA', 'MA', 'VT'],
    NC: ['VA', 'TN', 'GA', 'SC'],
    ND: ['MN', 'SD', 'MT'],
    OH: ['MI', 'PA', 'WV', 'KY', 'IN'],
    OK: ['KS', 'MO', 'AR', 'TX', 'NM', 'CO'],
    OR: ['WA', 'ID', 'NV', 'CA'],
    PA: ['NY', 'NJ', 'DE', 'MD', 'WV', 'OH'],
    RI: ['MA', 'CT'],
    SC: ['NC', 'GA'],
    SD: ['ND', 'MN', 'IA', 'NE', 'WY', 'MT'],
    TN: ['KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR', 'MO'],
    TX: ['OK', 'AR', 'LA', 'NM'],
    UT: ['ID', 'WY', 'CO', 'NM', 'AZ', 'NV'],
    VT: ['NH', 'MA', 'NY'],
    VA: ['MD', 'WV', 'KY', 'TN', 'NC'],
    WA: ['ID', 'OR'],
    WV: ['OH', 'PA', 'MD', 'VA', 'KY'],
    WI: ['MI', 'IL', 'IA', 'MN'],
    WY: ['MT', 'SD', 'NE', 'CO', 'UT', 'ID'],
    DC: ['MD', 'VA'],
};

export function normalizeState(value) {
    const trimmed = value?.trim();
    if (!trimmed) {
        return '';
    }

    const upper = trimmed.toUpperCase();
    if (US_ADJACENT_STATES[upper]) {
        return upper;
    }

    return US_STATE_NAMES_TO_ABBR[trimmed.toLowerCase()] ?? '';
}

const US_COUNTRY_PATTERN =
    /\b(?:united states(?:\s+of\s+america)?|usa|u\.?\s?s\.?\s?a\.?)\b/i;

const US_COUNTRY_SUFFIX_PATTERN =
    /^(?:united states(?:\s+of\s+america)?|usa|u\.?\s?s\.?\s?a\.?|us)$/i;

const US_REMOTE_HYBRID_PATTERN = /\b(?:remote|hybrid|work from home|wfh)\b/i;

function locationMatchesUsCityAlias(location) {
    return US_CITY_ALIAS_SITES.some(([pattern]) => pattern.test(location));
}

function locationMentionsUsCountry(location) {
    return (
        US_COUNTRY_PATTERN.test(location) ||
        /\b(?:us|usa|u\.?\s?s\.?\s?a\.?)\b/i.test(location)
    );
}

function locationIsUsRemoteOrHybrid(location) {
    if (/\(\s*(?:us|usa|u\.?\s?s\.?\s?a\.?)\s*\)$/i.test(location)) {
        return true;
    }

    if (!US_REMOTE_HYBRID_PATTERN.test(location)) {
        return false;
    }

    const scopeMatch = location.match(
        /\b(?:remote|hybrid)\b\s*[-–/|,\s]\s*(.+)$/i,
    );
    if (scopeMatch) {
        const scope = scopeMatch[1].trim();
        if (normalizeState(scope) || US_COUNTRY_SUFFIX_PATTERN.test(scope)) {
            return true;
        }

        if (locationMentionsUsCountry(scope)) {
            return true;
        }

        return locationIsUsRemoteOrHybrid(scope);
    }

    if (locationMentionsUsCountry(location)) {
        return true;
    }

    return !/,.+/.test(location);
}

export function extractStateAbbreviations(location) {
    const abbreviations = new Set();
    const normalized = location.toLowerCase();

    const commaMatch = location.match(/,\s*([A-Za-z]{2})\b/);
    if (commaMatch) {
        const abbr = normalizeState(commaMatch[1]);
        if (abbr) {
            abbreviations.add(abbr);
        }
    }

    for (const [name, abbr] of Object.entries(US_STATE_NAMES_TO_ABBR)) {
        if (normalized.includes(name)) {
            abbreviations.add(abbr);
        }
    }

    return abbreviations;
}

export function locationIsUsDomestic(location) {
    const trimmed = location?.trim() ?? '';
    if (!trimmed) {
        return false;
    }

    if (extractStateAbbreviations(trimmed).size > 0) {
        return true;
    }

    if (locationMentionsUsCountry(trimmed)) {
        return true;
    }

    if (locationIsUsRemoteOrHybrid(trimmed)) {
        return true;
    }

    if (locationMatchesUsCityAlias(trimmed)) {
        return true;
    }

    return false;
}

export function locationIsForeignForBucket(location) {
    const trimmed = location?.trim() ?? '';
    if (!trimmed) {
        return false;
    }

    return !locationIsUsDomestic(trimmed);
}

function buildUserCountryTerms(user) {
    return [user.country, user.countryShortName]
        .map((value) => value?.trim().toLowerCase())
        .filter(Boolean);
}

function locationAppearsGeographic(location) {
    const trimmed = location?.trim() ?? '';
    if (!trimmed) {
        return false;
    }

    if (locationIsVagueRegion(trimmed)) {
        return true;
    }

    if (/,/.test(trimmed)) {
        return true;
    }

    if (US_REMOTE_HYBRID_PATTERN.test(trimmed)) {
        return true;
    }

    return /^[A-Za-z][A-Za-z .'-]+$/.test(trimmed);
}

export function locationMentionsForeignCountry(location, user) {
    if (locationIsUsDomestic(location)) {
        return false;
    }

    const normalizedLocation = location.toLowerCase();
    const userCountryTerms = buildUserCountryTerms(user);

    if (userCountryTerms.some((term) => normalizedLocation.includes(term))) {
        return false;
    }

    return locationAppearsGeographic(location);
}

export function getEligibleUsStates(userState, radiusMiles) {
    const normalizedState = normalizeState(userState);
    if (!normalizedState) {
        return null;
    }

    const eligibleStates = new Set([normalizedState]);

    if (radiusMiles <= 100) {
        for (const adjacent of US_ADJACENT_STATES[normalizedState] ?? []) {
            eligibleStates.add(adjacent);
        }
        return eligibleStates;
    }

    if (radiusMiles <= 500) {
        const firstHop = US_ADJACENT_STATES[normalizedState] ?? [];
        for (const state of firstHop) {
            eligibleStates.add(state);
            for (const secondHop of US_ADJACENT_STATES[state] ?? []) {
                eligibleStates.add(secondHop);
            }
        }
        return eligibleStates;
    }

    return null;
}

function locationMentionsCity(location, city) {
    const normalizedCity = city?.trim().toLowerCase();
    if (!normalizedCity) {
        return false;
    }

    const normalizedLocation = location.toLowerCase();
    if (normalizedLocation.includes(normalizedCity)) {
        return true;
    }

    const aliases = CITY_ALIASES[normalizedCity] ?? [];
    return aliases.some((alias) => normalizedLocation.includes(alias));
}

function locationMentionsUserState(location, state) {
    const stateAbbr = normalizeState(state);
    if (!stateAbbr) {
        return false;
    }

    return extractStateAbbreviations(location).has(stateAbbr);
}

function locationIsVagueRegion(location) {
    const normalizedLocation = location.toLowerCase();
    return VAGUE_LOCATION_MARKERS.some((marker) =>
        normalizedLocation.includes(marker),
    );
}

function locationMentionsEligibleUsState(location, eligibleStates) {
    const mentionedStates = extractStateAbbreviations(location);
    for (const state of mentionedStates) {
        if (eligibleStates.has(state)) {
            return true;
        }
    }

    return false;
}

export function locationWorthGeocoding(location, user, radiusMiles) {
    if (locationMentionsForeignCountry(location, user)) {
        return false;
    }

    if (locationIsVagueRegion(location)) {
        return false;
    }

    if (user.countryShortName?.toUpperCase() !== 'US') {
        return true;
    }

    if (locationMentionsCity(location, user.city)) {
        return true;
    }

    if (locationMentionsUserState(location, user.state)) {
        return true;
    }

    const eligibleStates = getEligibleUsStates(user.state, radiusMiles);
    if (!eligibleStates) {
        return true;
    }

    const mentionedStates = extractStateAbbreviations(location);
    if (mentionedStates.size === 0) {
        return false;
    }

    return locationMentionsEligibleUsState(location, eligibleStates);
}
