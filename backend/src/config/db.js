const prisma = require("./prisma");
require("dotenv").config();

const dbString = process.env.DATABASE_URL;

const connectDB = async () => {
    if (!dbString) {
        throw new Error("DATABASE_URL is not set in the environment");
    }
    try {
        console.log("Connecting to database...");
        await prisma.$connect();
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
};
module.exports = connectDB;
