import app from './app.js';
import dbConnect from './config/index.js';
import './services/notification.service.js';

const PORT = process.env.PORT || 3000;

await dbConnect();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
