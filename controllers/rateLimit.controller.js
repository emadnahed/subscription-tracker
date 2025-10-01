import RateLimitLog from "../models/rateLimitLog.model.js";

export const getUserRateLimit = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const record = await RateLimitLog.findOne({ identifier: userId });

        if (!record) {
            return res.status(200).json({
                success: true,
                data: {
                    currentUsage: 0,
                    limit: 60, // General API limit
                    remaining: 60,
                    resetTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
                    windowMs: 60000
                }
            });
        }

        const now = Date.now();
        const windowMs = 60000; // 1 minute for general API
        const remaining = Math.max(0, 60 - record.count);

        return res.status(200).json({
            success: true,
            data: {
                currentUsage: record.count,
                limit: 60,
                remaining: remaining,
                resetTime: new Date(record.windowStart.getTime() + windowMs).toISOString(),
                windowMs: windowMs,
                lastRequest: record.lastRequest
            }
        });

    } catch (error) {
        next(error);
    }
};

export const getAllRateLimitStats = async (req, res, next) => {
    try {
        // Only admins should access this
        const stats = await RateLimitLog.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalRequests: { $sum: "$count" },
                    avgRequestsPerUser: { $avg: "$count" }
                }
            }
        ]);

        const recentActivity = await RateLimitLog.find({})
            .sort({ lastRequest: -1 })
            .limit(10)
            .select('identifier count lastRequest');

        return res.status(200).json({
            success: true,
            data: {
                summary: stats[0] || { totalUsers: 0, totalRequests: 0, avgRequestsPerUser: 0 },
                recentActivity: recentActivity
            }
        });

    } catch (error) {
        next(error);
    }
};
