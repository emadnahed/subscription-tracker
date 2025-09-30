// config/env.js
import { config } from "dotenv";

// Load env variables immediately
config({
    path: `.env.${process.env.NODE_ENV || 'development'}.local`,
});

// Destructure after config
export const { PORT, NODE_ENV = 'development', DB_URI } = process.env;
