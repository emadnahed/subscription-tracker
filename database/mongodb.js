import mongoose from 'mongoose';
import { DB_URI } from '../config/env.js';

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
};

export default connectDB;