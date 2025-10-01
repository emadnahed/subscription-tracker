import { Router } from 'express';
import { getUsers, getUser } from '../controllers/user.controller.js';
import { getUserRateLimit, getAllRateLimitStats } from '../controllers/rateLimit.controller.js';
import authenticate from '../middlewares/auth.middleware.js';
import { generalRateLimiter, strictRateLimiter, registrationRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const userRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         role:
 *           type: string
 *           enum: [admin, manager, premium_user, user]
 *           example: "user"
 *         isActive:
 *           type: boolean
 *           example: true
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["read_user", "create_subscription"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserRateLimit:
 *       type: object
 *       properties:
 *         currentUsage:
 *           type: number
 *           example: 15
 *         limit:
 *           type: number
 *           example: 60
 *         remaining:
 *           type: number
 *           example: 45
 *         resetTime:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T12:01:00.000Z"
 *         windowMs:
 *           type: number
 *           example: 60000
 *         lastRequest:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T12:00:15.000Z"
 *     RateLimitStats:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *           properties:
 *             totalUsers:
 *               type: number
 *               example: 150
 *             totalRequests:
 *               type: number
 *               example: 4500
 *             avgRequestsPerUser:
 *               type: number
 *               example: 30
 *         recentActivity:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: "user_id_1"
 *               count:
 *                 type: number
 *                 example: 25
 *               lastRequest:
 *                 type: string
 *                 format: date-time
 */

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Register a new user (Public)
 *     description: Create a new user account. Limited to 3 requests per minute per IP address.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 5
 *                 example: "securepassword123"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitExceeded'
 */
userRouter.post('/', registrationRateLimiter, (req, res) => res.send({ title: 'CREATE new user' }));

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (Admin/Manager only)
 *     description: Retrieve a list of all users. Requires admin or manager role.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Users fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRouter.get('/', getUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID. Users can access their own profile, admins can access any profile.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRouter.get('/:id', strictRateLimiter, getUser);

/**
 * @swagger
 * /api/v1/users/{id}/rate-limit:
 *   get:
 *     summary: Get user's rate limit status
 *     description: Check current rate limit usage for a specific user. Limited to 10 requests per minute.
 *     tags: [Rate Limiting]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Rate limit status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserRateLimit'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRouter.get('/:id/rate-limit', strictRateLimiter, getUserRateLimit);

/**
 * @swagger
 * /api/v1/users/admin/rate-limit-stats:
 *   get:
 *     summary: Get global rate limiting statistics (Admin only)
 *     description: Retrieve comprehensive rate limiting statistics across all users. Admin role required.
 *     tags: [Rate Limiting]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Rate limit statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RateLimitStats'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRouter.get('/admin/rate-limit-stats', strictRateLimiter, getAllRateLimitStats);

// Admin only routes with stricter rate limiting
userRouter.put('/:id', strictRateLimiter, (req, res) => res.send({ title: 'UPDATE user' }));
userRouter.delete('/:id', strictRateLimiter, (req, res) => res.send({ title: 'DELETE user' }));

export default userRouter;