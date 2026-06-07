export function logApiError(operation, error, req) {
    console.error(`[API Error] ${operation}`, {
        method: req?.method,
        path: req?.originalUrl ?? req?.url,
        message: error?.message,
        stack: error?.stack,
    });
}

export function handleApiError(res, operation, error, req) {
    logApiError(operation, error, req);
    res.status(500).json({ error: error.message });
}
