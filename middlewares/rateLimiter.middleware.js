import RateLimitLog from "../models/rateLimitLog.model.js";

/**
 * Universal rate limiting middleware supporting both IP and token-based limiting
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000ms = 1 minute)
 * @param {number} options.maxRequests - Maximum requests per window (default: 20)
 * @param {string} options.message - Custom error message (default: "Too many requests")
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests (default: false)
 * @param {boolean} options.skipFailedRequests - Don't count failed requests (default: false)
 * @param {string} options.type - 'ip' for IP-based, 'token' for token-based, 'hybrid' for both (default: 'hybrid')
 */
const createRateLimiter = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute
        maxRequests = 20,
        message = "Too many requests 🚫",
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        type = 'hybrid' // 'ip', 'token', or 'hybrid'
    } = options;

    return async (req, res, next) => {
        try {
            const now = Date.now();
            let identifier;

            // Determine rate limiting strategy
            if (type === 'token' && req.user) {
                // Token-based rate limiting for authenticated users
                identifier = req.user?.id || req.user?.userId;
                if (!identifier) {
                    return next(); // Skip if no user ID available
                }
            } else if (type === 'ip' || !req.user) {
                // IP-based rate limiting for public routes or when user not authenticated
                identifier = req.ip || req.connection?.remoteAddress || 'unknown';
                // Normalize IPv6 localhost
                if (identifier === '::1' || identifier === '127.0.0.1') {
                    identifier = 'localhost';
                }
            } else {
                // Hybrid approach - prefer token-based if user is authenticated
                if (req.user) {
                    identifier = req.user?.id || req.user?.userId;
                } else {
                    identifier = req.ip || req.connection?.remoteAddress || 'unknown';
                    if (identifier === '::1' || identifier === '127.0.0.1') {
                        identifier = 'localhost';
                    }
                }
            }

            if (!identifier || identifier === 'unknown') {
                return next(); // Skip rate limiting if no identifier
            }

            let record = await RateLimitLog.findOne({ identifier });

            // Create new record if doesn't exist
            if (!record) {
                record = await RateLimitLog.create({
                    identifier,
                    count: 1,
                    lastRequest: now,
                    windowStart: now
                });

                // Set rate limit headers
                res.set({
                    "X-RateLimit-Limit": maxRequests,
                    "X-RateLimit-Remaining": maxRequests - 1,
                    "X-RateLimit-Reset": new Date(now + windowMs).toISOString(),
                    "X-RateLimit-Type": req.user ? 'token' : 'ip'
                });

                return next();
            }

            // Check if window has expired
            if (record.isWindowExpired(windowMs)) {
                record.resetWindow();
                await record.save();

                res.set({
                    "X-RateLimit-Limit": maxRequests,
                    "X-RateLimit-Remaining": maxRequests - 1,
                    "X-RateLimit-Reset": new Date(now + windowMs).toISOString(),
                    "X-RateLimit-Type": req.user ? 'token' : 'ip'
                });

                return next();
            }

            // Check if under limit
            if (record.count >= maxRequests) {
                const resetTime = new Date(record.windowStart.getTime() + windowMs);

                return res.status(429).json({
                    success: false,
                    message,
                    error: "RATE_LIMIT_EXCEEDED",
                    retryAfter: Math.ceil((resetTime.getTime() - now) / 1000),
                    limit: maxRequests,
                    remaining: 0,
                    resetTime: resetTime.toISOString(),
                    type: req.user ? 'token' : 'ip'
                });
            }

            // Increment counter
            record.count += 1;
            record.lastRequest = now;
            await record.save();

            // Set rate limit headers
            const remaining = Math.max(0, maxRequests - record.count);
            res.set({
                "X-RateLimit-Limit": maxRequests,
                "X-RateLimit-Remaining": remaining,
                "X-RateLimit-Reset": new Date(record.windowStart.getTime() + windowMs).toISOString(),
                "X-RateLimit-Type": req.user ? 'token' : 'ip'
            });

            // Store original res.json for potential skipping
            const originalJson = res.json;
            let requestSucceeded = false;

            // Override res.json to track success/failure
            res.json = function(body) {
                if (!skipSuccessfulRequests && !skipFailedRequests) {
                    return originalJson.call(this, body);
                }

                // Determine if request was successful (status 2xx or 3xx)
                requestSucceeded = res.statusCode >= 200 && res.statusCode < 400;

                if ((requestSucceeded && skipSuccessfulRequests) || (!requestSucceeded && skipFailedRequests)) {
                    // Decrement counter since we're skipping this request
                    record.count -= 1;
                    record.save().catch(err => console.error("Failed to decrement rate limit counter:", err));
                }

                return originalJson.call(this, body);
            };

            next();

        } catch (error) {
            console.error("Rate limiting error:", error);
            // On error, allow request but log the issue
            next();
        }
    };
};

// Pre-configured rate limiters for different scenarios

// Authentication routes - strict limits to prevent brute force
export const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    message: "Too many authentication attempts. Please try again later.",
    type: 'hybrid' // Use IP for unauthenticated, token for authenticated
});

// General API rate limiting - moderate limits for normal usage
export const generalRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute for general API
    message: "Too many requests. Please slow down.",
    type: 'hybrid'
});

// Strict rate limiting - for sensitive operations
export const strictRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute for sensitive operations
    message: "Rate limit exceeded for sensitive operations.",
    type: 'hybrid'
});

// IP-based rate limiting - specifically for public routes
export const ipRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute from same IP
    message: "Too many requests from this IP address.",
    type: 'ip' // Force IP-based limiting
});

// High-frequency IP limiting - for public registration forms
export const registrationRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // Only 3 registrations per minute from same IP
    message: "Too many registration attempts. Please wait before trying again.",
    type: 'ip'
});

export default createRateLimiter;
