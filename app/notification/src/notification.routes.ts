import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

const router = Router();
const service = new NotificationService();
const controller = new NotificationController(service);

router.get('/', controller.getNotifications);

export default router;