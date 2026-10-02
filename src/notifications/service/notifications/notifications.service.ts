import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationCategory } from 'src/notifications/entities/notification.entity';
import { User } from 'src/users/entities/user.entity/user.entity';


@Injectable()
export class NotificationsService {

    constructor(
        @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
    ) {}

    create(userId: number, category: NotificationCategory, title: string, message: string) {
        const notification = this.notificationRepository.create({
            user: { id: userId } as User,
            category,
            title,
            message,
            isRead: false,
        });
        return this.notificationRepository.save(notification);
    }

    getMyNotifications(userId: number) {
        return this.notificationRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
        });
    }

    getUnreadCount(userId: number) {
        return this.notificationRepository
            .count({ where: { user: { id: userId }, isRead: false } })
            .then((unreadCount) => ({ unreadCount }));
    }

    async markAsRead(userId: number, notificationId: number) {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, user: { id: userId } },
        });
        if (!notification) {
            throw new HttpException('Notification not found.', HttpStatus.NOT_FOUND);
        }
        notification.isRead = true;
        return this.notificationRepository.save(notification);
    }

    async markAllAsRead(userId: number) {
        await this.notificationRepository.update({ user: { id: userId } }, { isRead: true });
        return { message: 'All notifications marked as read' };
    }
}