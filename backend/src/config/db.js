const mongoose = require('mongoose');
require('dotenv').config();

const dbString = process.env.DBSTRING;

const connectDB = async () => {
    if (!dbString) {
        throw new Error('DBSTRING is not set in the environment');
    }
    try {
        console.log('Connecting to database...');
        await mongoose.connect(dbString);
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};
module.exports = connectDB;
