# Subscription Tracker API

A Node.js/Express REST API for tracking and managing subscriptions with user authentication, role-based access control, and MongoDB database integration.

## Features

- **User Authentication**: Complete JWT-based authentication system with sign-up, sign-in, and token validation
- **Role-Based Access Control (RBAC)**: Scalable permission system with roles (Admin, Manager, Premium User, User)
- **User Management**: Full CRUD operations for user accounts with role assignment
- **Subscription Management**: Comprehensive subscription tracking with multi-currency support
- **Payment Method Tracking**: Store and track various payment methods for subscriptions
- **Status Management**: Track subscription status (active, cancelled, expired) with automatic renewal calculations
- **Multi-Currency Support**: Support for USD, EUR, GBP, INR, and PKR
- **Subscription Categories**: Organize subscriptions by Entertainment, Health, Education, Fitness, or Other
- **Hybrid Rate Limiting**: Advanced IP and token-based rate limiting with intelligent strategy selection

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs for password hashing
- **Environment Management**: dotenv
- **Development**: nodemon for hot reloading
- **Linting**: ESLint

## Project Structure

```
subscription-tracker/
├── app.js                         # Main application entry point
├── config/
│   ├── env.js                     # Environment configuration
│   └── roles.js                   # Role and permission definitions
├── controllers/
│   ├── auth.controller.js         # Authentication logic (sign-up, sign-in)
│   ├── user.controller.js         # User management operations
│   └── rateLimit.controller.js    # Rate limiting monitoring and statistics
├── database/
│   └── mongodb.js                 # MongoDB connection setup
├── middlewares/
│   ├── auth.middleware.js         # Authentication and authorization middleware
│   ├── error.middleware.js        # Global error handling
│   └── rateLimiter.middleware.js  # Hybrid rate limiting (IP + token-based)
├── models/
│   ├── user.model.js             # User schema with roles
│   ├── subscription.model.js     # Subscription schema
│   └── rateLimitLog.model.js     # Rate limiting data storage
├── routes/
│   ├── auth.routes.js            # Authentication endpoints
│   ├── user.routes.js            # User management endpoints
│   └── subscription.routes.js    # Subscription management endpoints
├── .env.development.local        # Development environment variables
├── .env.production.local         # Production environment variables
├── package.json
└── README.md
```

## Authentication Flow

### User Registration
1. Client sends POST request to `/api/v1/auth/sign-up` with user credentials
2. Server validates input, checks for existing users, and hashes password
3. JWT token is generated and returned with user data
4. Passwords are never stored in plain text using bcrypt hashing

### User Login
1. Client sends POST request to `/api/v1/auth/sign-in` with email/password
2. Server validates credentials and checks password hash
3. New JWT token is generated and returned

### Protected Routes
1. Client includes JWT token in `Authorization: Bearer <token>` header
2. Authentication middleware validates token and extracts user info
3. Authorization middleware checks user permissions based on role
4. Route handler executes if user has required permissions

## Role-Based Access Control

The system implements a scalable RBAC with the following roles:

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Full system access | All permissions including user management and system configuration |
| **Manager** | Management access | User and subscription management, analytics |
| **Premium User** | Enhanced user access | Extended subscription management, user profile access |
| **User** | Standard user access | Basic subscription management |

## Rate Limiting

The API implements sophisticated **hybrid rate limiting** combining both IP-based and token-based strategies to provide comprehensive protection:

### Rate Limiting Strategies

#### 1. **IP-Based Rate Limiting** (For Public Routes)
- **Used for**: User registration, login attempts, public endpoints
- **Identifier**: Client IP address (supports IPv4/IPv6 normalization)
- **Purpose**: Prevents abuse from unauthenticated users
- **Example**: Max 3 registrations per minute from same IP

#### 2. **Token-Based Rate Limiting** (For Authenticated Users)
- **Used for**: API endpoints requiring authentication
- **Identifier**: User ID extracted from JWT token
- **Purpose**: Fair usage limits per individual user
- **Example**: Max 60 requests per minute per authenticated user

#### 3. **Hybrid Rate Limiting** (Intelligent Switching)
- **Automatically chooses** between IP or token-based limiting
- **Prefers token-based** when user is authenticated
- **Falls back to IP-based** for public routes
- **Benefits**: Maximum protection with user experience

### Rate Limiting Tiers

| Route Type | Strategy | Window | Max Requests | Purpose |
|------------|----------|--------|--------------|---------|
| **Authentication** | IP-Based | 15 minutes | 5 requests | Prevent brute force attacks |
| **User Registration** | IP-Based | 1 minute | 3 requests | Prevent spam registrations |
| **Sensitive Operations** | Hybrid | 1 minute | 10 requests | Protect admin/user management |
| **General API** | Hybrid | 1 minute | 60 requests | Standard API usage |

### Rate Limit Headers

All responses include detailed rate limiting headers:
```http
X-RateLimit-Limit: 60          # Maximum requests allowed
X-RateLimit-Remaining: 45      # Requests remaining in window
X-RateLimit-Reset: 2024-01-01T12:01:00.000Z  # When window resets
X-RateLimit-Type: token        # 'ip' or 'token' based on strategy used
```

### Rate Limit Exceeded Response

When limits are exceeded, the API returns:
```json
{
  "success": false,
  "message": "Too many requests 🚫",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "limit": 60,
  "remaining": 0,
  "resetTime": "2024-01-01T12:01:00.000Z",
  "type": "token"
}
```

### Rate Limiting Statistics

The API provides endpoints to monitor rate limiting usage:

#### Get User's Rate Limit Status
```bash
curl -X GET http://localhost:3000/api/v1/users/YOUR_USER_ID/rate-limit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentUsage": 15,
    "limit": 60,
    "remaining": 45,
    "resetTime": "2024-01-01T12:01:00.000Z",
    "windowMs": 60000,
    "lastRequest": "2024-01-01T12:00:15.000Z"
  }
}
```

#### Get Global Rate Limiting Statistics (Admin Only)
```bash
curl -X GET http://localhost:3000/api/v1/users/admin/rate-limit-stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 150,
      "totalRequests": 4500,
      "avgRequestsPerUser": 30
    },
    "recentActivity": [
      {
        "identifier": "user_id_1",
        "count": 25,
        "lastRequest": "2024-01-01T12:00:45.000Z"
      }
    ]
  }
}
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd subscription-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env.development.local` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_URI=mongodb://localhost:27017/subscription-tracker
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   JWT_EXPIRES_IN=7d
   ```

   For production, create `.env.production.local`:
   ```env
   PORT=3000
   NODE_ENV=production
   DB_URI=mongodb+srv://username:password@cluster.mongodb.net/subscription-tracker
   JWT_SECRET=your-production-jwt-secret-here
   JWT_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or update the `DB_URI` to point to your MongoDB instance.

## Usage

### Development Mode
```bash
npm run dev
# or
yarn dev
```

### Production Mode
```bash
npm start
# or
yarn start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication Routes (`/api/v1/auth`)
- `POST /sign-up` - User registration (Public)
- `POST /sign-in` - User login (Public)
- `POST /sign-out` - User logout (Protected)

### User Routes (`/api/v1/users`)
- `GET /` - Get all users (Protected - Admin/Manager only)
- `GET /:id` - Get user by ID (Protected - Own profile or Admin)
- `GET /:id/rate-limit` - Get user's current rate limit usage (Protected)
- `GET /admin/rate-limit-stats` - Get global rate limiting statistics (Protected - Admin only)
- `POST /` - Create new user (Public - Registration)
- `PUT /:id` - Update user (Protected - Own profile or Admin)
- `DELETE /:id` - Delete user (Protected - Admin only)

### Subscription Routes (`/api/v1/subscriptions`)
- `GET /` - Get all subscriptions (Protected)
- `GET /:id` - Get subscription by ID (Protected)
- `POST /` - Create new subscription (Protected)
- `PUT /:id` - Update subscription (Protected)
- `DELETE /:id` - Delete subscription (Protected)
- `GET /user/:id` - Get all subscriptions for a user (Protected)
- `PUT /:id/cancel` - Cancel subscription (Protected)
- `GET /upcoming-renewals` - Get upcoming renewals (Protected)

## Data Models

### User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, hashed with bcrypt),
  role: String (enum: ['admin', 'manager', 'premium_user', 'user']),
  isActive: Boolean (default: true),
  permissions: Array of Strings (custom permissions),
  timestamps: true
}
```

### Subscription Model
```javascript
{
  name: String (required, 2-100 chars),
  price: Number (required, positive),
  currency: String (enum: ['USD', 'EUR', 'GBP', 'INR', 'PKR']),
  frequency: String (enum: ['Monthly', 'Yearly', 'Weekly']),
  category: String (enum: ['Entertainment', 'Health', 'Education', 'Fitness', 'Other']),
  paymentMethod: String (required),
  status: String (enum: ['active', 'cancelled', 'expired']),
  startDate: Date (required, past date),
  renewalDate: Date (required, after start date),
  user: ObjectId (reference to User),
  timestamps: true
}
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port number | Yes | - |
| `NODE_ENV` | Environment mode | No | `development` |
| `DB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT token signing | Yes | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | No | `7d` |

## Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
This project uses ESLint for code linting. Make sure to run `npm run lint` before committing code.

### API Testing Examples

#### Register a new user
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

#### Access protected route (replace TOKEN with actual JWT)
```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer TOKEN"
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt before storage
- **JWT Authentication**: Stateless authentication with secure token validation
- **Role-Based Access**: Granular permissions system for different user roles
- **Input Validation**: Comprehensive validation of all user inputs
- **Error Handling**: Secure error messages that don't expose sensitive information

## License

This project is private and not licensed for public use.

## Support

For support or questions, please contact the development team.

---

**Recent Updates:**
- ✅ User authentication system with JWT tokens
- ✅ Role-based access control implementation
- ✅ Enhanced user management with permissions
- ✅ Authentication middleware for route protection
- ✅ Token-based rate limiting system
- ✅ Advanced error handling and input validation
- ✅ Multi-environment configuration
- ✅ Comprehensive API documentation
