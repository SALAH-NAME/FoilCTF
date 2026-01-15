import { db } from './db'

export class NotificationService {
  public async getUserNotifications(userId: string, page: number, limit: number){
    const offset = (page - 1) * limit;
    const listQuery = `
      SELECT
        n.id,
        n.contents,
        nu.is_read,
        n.created_at
      
      FROM notification_users nu
      JOIN notifications n ON nu.notification_id = n.id
      WHERE nu.notified_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const unreadQuery=`
      SELECT COUNT(*) as count
      WHERE notified_id = $1
      AND is_read = FALSE
    `;

    const totalQuery=`
      SELECT COUNT(*) as count
      FROM notification_users
      WHERE notified_id = $1
    `;

    const [listResult, unreadResult, totalResult] = await Promise.all([
      db.query(listQuery, [userId, limit, offset]),
      db.query(unreadQuery,[userId]),
      db.query(totalQuery, [userId]),
    ]);

    const formattedNotifications = listResult.rows.map((row:any) => ({
      id:row.id,
      ...row.countents,
      is_read: row.is_read,
      created_at: row.created_at
    }));

    return{
      Notification: formattedNotifications,
      total_count: parseInt(totalResult.rows[0].count, 10),
      unread_count: parseInt(unreadResult.rows[0].count, 10)
    };

  }
}