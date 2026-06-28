export function toSessionUser(user) {
    return {
        id: user.id,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
        addressLine1: user.addressLine1,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,
        countryShortName: user.countryShortName,
    };
}

export function getSessionUserId(req) {
    return req.session.user?.id ?? null;
}
