import mongoose from "mongoose";
import { validatePaymentEnvironment } from "../../deployment-config.mjs";

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
    throw new Error("Please define MONGO_URL in .env.local");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    };
}

const TRANSIENT_CONNECTION_CODES = new Set([
    "ETIMEOUT",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientConnectionError(error) {
    const code = String(error?.code || "").toUpperCase();
    const message = String(error?.message || "");
    return TRANSIENT_CONNECTION_CODES.has(code) ||
        /querySrv|dns|timed? ?out|server selection/i.test(message);
}

async function connectWithRetry(options) {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await mongoose.connect(MONGO_URL, options);
        } catch (error) {
            lastError = error;
            if (!isTransientConnectionError(error) || attempt === 2) throw error;
            // Short bounded backoff for transient Atlas SRV/DNS failures.
            await sleep(300 * (attempt + 1));
        }
    }
    throw lastError;
}

export async function connectDB() {
    validatePaymentEnvironment(process.env);
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const options = {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 30000,
        };

        // Optional: pin the database. Without it Mongoose uses the URI default ("test").
        if (process.env.DB_NAME) {
            options.dbName = process.env.DB_NAME;
        }

        cached.promise = connectWithRetry(options).catch((error) => {
            cached.promise = null;
            throw error;
        });
    }

    cached.conn = await cached.promise;

    return cached.conn;
}
