import express from 'express';
import { PORT } from './config/env.js';
import userRouter from './routes/user.routes.js';
import authRouter from './routes/auth.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import connectDB from './database/mongodb.js';
import errorMiddleware from './middlewares/error.middleware.js';
import cookieParser from 'cookie-parser';

const app = express();



app.get('/', (req, res) => {
    res.send('Welcome to my Subscription tracker API!');
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);

app.use(errorMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// cookies
app.use(cookieParser());

app.listen(PORT, 
    // async
    async () => {
        console.log(`Server started on http://localhost:${PORT}`);
        await connectDB();
    }
);

export default app;
