import { Router } from 'express';
import { getUsers, getUser } from '../controllers/user.controller.js';
import { getUserRateLimit, getAllRateLimitStats } from '../controllers/rateLimit.controller.js';
import authenticate from '../middlewares/auth.middleware.js';
import { generalRateLimiter, strictRateLimiter, registrationRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const userRouter = Router();

// Public routes (no auth required, but IP rate limited for security)
userRouter.post('/', registrationRateLimiter, (req, res) => res.send({ title: 'CREATE new user' }));

// Protected routes with authentication and authorization
userRouter.use(authenticate); // Apply authentication to all routes below this line

// Apply general rate limiting to all authenticated routes
userRouter.use(generalRateLimiter);

// Protected routes that require authentication
userRouter.get('/', getUsers);
userRouter.get('/:id', strictRateLimiter, getUser);

// Rate limiting stats endpoints (admin only for global stats)
userRouter.get('/:id/rate-limit', strictRateLimiter, getUserRateLimit);
userRouter.get('/admin/rate-limit-stats', strictRateLimiter, getAllRateLimitStats);

// Admin only routes with stricter rate limiting
userRouter.put('/:id', strictRateLimiter, (req, res) => res.send({ title: 'UPDATE user' }));
userRouter.delete('/:id', strictRateLimiter, (req, res) => res.send({ title: 'DELETE user' }));

export default userRouter;