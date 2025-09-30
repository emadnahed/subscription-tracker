# Subscription Tracker API

A Node.js/Express REST API for tracking and managing subscriptions with user authentication and MongoDB database integration.

## Features

- **User Authentication**: Sign up, sign in, and sign out functionality
- **User Management**: Create and manage user accounts
- **Subscription Management**: Full CRUD operations for subscriptions
- **Multi-Currency Support**: Support for USD, EUR, GBP, INR, and PKR
- **Subscription Categories**: Organize subscriptions by Entertainment, Health, Education, Fitness, or Other
- **Payment Method Tracking**: Store and track payment methods for subscriptions
- **Status Management**: Track subscription status (active, cancelled, expired)
- **Automatic Renewal Calculations**: Automatically calculate renewal dates based on subscription frequency
- **Upcoming Renewals**: View upcoming subscription renewals

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Environment Management**: dotenv
- **Development**: nodemon for hot reloading
- **Linting**: ESLint

## Project Structure

```
subscription-tracker/
├── app.js                 # Main application entry point
├── config/
│   └── env.js            # Environment configuration
├── database/
│   └── mongodb.js        # MongoDB connection setup
├── models/
│   ├── user.model.js     # User schema
│   └── subscription.model.js # Subscription schema
├── routes/
│   ├── auth.routes.js    # Authentication endpoints
│   ├── user.routes.js    # User management endpoints
│   └── subscription.routes.js # Subscription management endpoints
├── .env.development.local # Development environment variables
├── .env.production.local  # Production environment variables
├── package.json
└── README.md
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
   ```

   For production, create `.env.production.local`:
   ```env
   PORT=3000
   NODE_ENV=production
   DB_URI=mongodb+srv://username:password@cluster.mongodb.net/subscription-tracker
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
- `POST /sign-up` - User registration
- `POST /sign-in` - User login
- `POST /sign-out` - User logout

### User Routes (`/api/v1/users`)
- `GET /` - Get all users
- `GET /:id` - Get user by ID
- `POST /` - Create new user
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user

### Subscription Routes (`/api/v1/subscriptions`)
- `GET /` - Get all subscriptions
- `GET /:id` - Get subscription by ID
- `POST /` - Create new subscription
- `PUT /:id` - Update subscription
- `DELETE /:id` - Delete subscription
- `GET /user/:id` - Get all subscriptions for a user
- `PUT /:id/cancel` - Cancel subscription
- `GET /upcoming-renewals` - Get upcoming renewals

## Data Models

### User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, min 5 chars),
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

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port number | - |
| `NODE_ENV` | Environment mode | `development` |
| `DB_URI` | MongoDB connection string | - |

## Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
This project uses ESLint for code linting. Make sure to run `npm run lint` before committing code.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and not licensed for public use.

## Support

For support or questions, please contact the development team.
