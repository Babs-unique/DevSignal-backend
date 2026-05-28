import mongoose  from 'mongoose'

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devsignal');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

    }catch(e){
        console.error('Failed to connect to MongoDB', e);
        process.exit(1);
    }
}