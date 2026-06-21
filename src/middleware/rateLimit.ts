import rateLimit from 'express-rate-limit';
export const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.OAUTH_MAX_REQUESTS || '50', 10), // Limit each IP to 50 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_MAX_REQUESTS || '50', 10), // Limit each IP to 50 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    }
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.API_MAX_REQUESTS || '100', 10), // Limit each IP to 100 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
})
