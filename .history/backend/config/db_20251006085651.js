import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Before connecting, let's clear the database if it exists, as requested.
    // NOTE: This is a destructive operation and should only be used in development.
    const tempConn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
    await tempConn.dropDatabase();
    console.log('Existing database dropped.');
    await tempConn.close();

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;



