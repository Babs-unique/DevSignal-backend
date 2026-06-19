import mongoose  from 'mongoose'

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

    }catch(e){
        console.error('Failed to connect to MongoDB', e);
        process.exit(1);
    }
}