import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";


let authInstance: ReturnType<typeof betterAuth> | null = null;


export const getAuth = async () => {
    if (authInstance) {
        return authInstance;
    }

    const mongoose = await connectToDatabase();

    // Handle missing DB connection (e.g. during build)
    if (!mongoose || !mongoose.connection) {
        console.warn("MongoDB connection not found! Using mock adapter for build.");
        const mockDb = {
            collection: () => ({
                findOne: async () => null,
                find: () => ({ toArray: async () => [] }),
            })
        };

        authInstance = betterAuth({
            database: mongodbAdapter(mockDb as any),
            secret: process.env.BETTER_AUTH_SECRET || "mock-secret-for-build",
            baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
            emailAndPassword: {
                enabled: true,
                disableSignUp: false,
                requireEmailVerification: false,
                minPasswordLength: 8,
                maxPasswordLength: 128,
                autoSignIn: true,
            },
            plugins: [nextCookies()],
        });
        return authInstance;
    }

    const db = mongoose.connection;

    authInstance = betterAuth({
        database: mongodbAdapter(db as any),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()],

    });

    return authInstance;
}

export const auth = await getAuth();