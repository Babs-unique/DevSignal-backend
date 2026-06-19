import mongoose  from 'mongoose'
import { env } from './env.js'

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.MONGO_URI as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

    }catch(e){
        console.error('Failed to connect to MongoDB', e);
        process.exit(1);
    }
}