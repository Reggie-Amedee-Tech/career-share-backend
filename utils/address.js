export function formatAddress({ addressLine1, city, state, zipCode, country }) {
    return [addressLine1, city, state, zipCode, country]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(', ');
}

export function validateAddressInput(address) {
    const { addressLine1, city, state, zipCode, country } = address;

    if (!addressLine1?.trim() || !city?.trim() || !state?.trim() || !zipCode?.trim() || !country?.trim()) {
        return 'All address fields are required';
    }

    return null;
}
