import mongoose  from 'mongoose'
import { env } from './env.js'

export const connectDB = async () => {
    try {
        console.log(`${env.MONGO_URI} is connected`)
        const conn = await mongoose.connect(env.MONGO_URI as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

    }catch(e){
        console.error('Failed to connect to MongoDB', e);
        process.exit(1);
    }
}