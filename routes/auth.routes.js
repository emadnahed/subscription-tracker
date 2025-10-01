import { Router } from 'express';
import { signUp, signIn, signOut } from '../controllers/auth.controller.js';
import { authRateLimiter, ipRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const authRouter = Router();

// Apply IP-based rate limiting for authentication attempts (prevents brute force)
authRouter.use(ipRateLimiter);

// Authentication routes with strict IP-based rate limiting for security
authRouter.post('/sign-up', ipRateLimiter, signUp);
authRouter.post('/sign-in', ipRateLimiter, signIn);
authRouter.post('/sign-out', authRateLimiter, signOut); // Token-based for logout

export default authRouter;