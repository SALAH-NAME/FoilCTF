import express from 'express';
import cors from 'cors';
import notificationRoutes from './notification.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  (req as any).user = {id: 1};
  next();
});

app.use('/notifications', notificationRoutes);

export default app;
