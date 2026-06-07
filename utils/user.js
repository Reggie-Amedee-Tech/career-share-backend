export function toSessionUser(user) {
    return {
        id: user.id,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
    };
}

export function getSessionUserId(req) {
    return req.session.user?.id ?? null;
}
