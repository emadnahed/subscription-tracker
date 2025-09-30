import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js"

export const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // create a new user
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            const error = new Error('Name, email, and password are required');
            error.statusCode = 400;
            throw error;
        }

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('User already exists');
            error.statusCode = 409;
            throw error;
        }

        // hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await User.create([{ name, email, password: hashedPassword }], { session });
        const token = jwt.sign({ userId: newUser[0]._id }, process.env.JWT_SECRET || 'fallback-secret', {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });

        await session.commitTransaction();
        await session.endSession();

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            token,
            user: {
                id: newUser[0]._id,
                name: newUser[0].name,
                email: newUser[0].email
            }
        });


    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error)
    }
}

export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid password');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback-secret', {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });

        return res.status(200).json({
            success: true,
            message: 'User signed in successfully',
            data: {
                token,
                user
            }
        });

    } catch (error) {
        next(error)
    }
}

export const signOut = async (req, res, next) => {
    try {

    } catch (error) {
        next(error)
    }
}
