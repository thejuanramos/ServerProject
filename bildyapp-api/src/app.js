import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import userRouter from './routes/user.routes.js';
import clientRouter from './routes/client.routes.js';
import projectRouter from './routes/project.routes.js';
import deliveryNoteRouter from './routes/deliverynote.routes.js';
import errorHandler from './middleware/error-handler.js';
import rateLimiter from './middleware/rate-limit.js';
import sanitize from './middleware/sanitize.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Socket.IO Auth Middleware
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) return next(new Error('Authentication error: No token provided'));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  if (socket.user?.company) {
    socket.join(socket.user.company.toString());
  }
  socket.on('disconnect', () => {});
});

app.set('io', io);

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(sanitize);
app.use(rateLimiter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/user', userRouter);
app.use('/api/client', clientRouter);
app.use('/api/project', projectRouter);
app.use('/api/deliverynote', deliveryNoteRouter);

// Error Handler
app.use(errorHandler);

export { app, httpServer };