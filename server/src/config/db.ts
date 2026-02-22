import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MongoDB URL not found.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');
  } catch (error) {
    if (error instanceof Error) {
      console.log('Database connection failed: ', error.message);
    } else {
      console.log('Unknown database error');
    }

    process.exit(1); // Stop server if DB failed
  }
};
