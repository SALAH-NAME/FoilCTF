import { Request, Response } from "express";
import { NotificationService } from "./notification.service";

export class NotificationController{
    constructor(private service: NotificationService){}
    public getNotifications = async (req: Request, res: Response) => {
        try{
            const userId = (req as any).user?.id || 'USER_ID_HERE';
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await this.service.getUserNotifications(userId, page, limit);

            res.json(result);
        }catch (error){
            console.error(error);
            res.status(500).json({ erro: 'Failed to fetch notifications'});
        }
    };
}