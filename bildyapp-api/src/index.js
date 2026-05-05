import 'dotenv/config';
import { httpServer } from './app.js';
import dbConnect from './config/index.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await dbConnect();
    httpServer.listen(PORT, () => {
      console.log(`BildyApp API running on port ${PORT}`);
      console.log(`Real-time WebSockets enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();