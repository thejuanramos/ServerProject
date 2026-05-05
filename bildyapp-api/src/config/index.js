import mongoose from 'mongoose';

const dbConnect = async () => {
  const DBURI = process.env.DBURI;

  if (!DBURI) {
    console.error('DBURI is not defined');
    process.exit(1);
  }

  try {
    await mongoose.connect(DBURI, { family: 4 });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
};

export default dbConnect;