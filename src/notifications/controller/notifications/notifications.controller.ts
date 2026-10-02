import { Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard/jwt-auth.guard';
import { NotificationsService } from 'src/notifications/service/notifications/notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) {}

    @Get()
    getMyNotifications(@Req() req: any) {
        return this.notificationsService.getMyNotifications(req.user.userId);
    }

    @Get('unread-count')
    getUnreadCount(@Req() req: any) {
        return this.notificationsService.getUnreadCount(req.user.userId);
    }

    @Patch('read-all')
    markAllAsRead(@Req() req: any) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }

    @Patch(':id/read')
    markAsRead(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.notificationsService.markAsRead(req.user.userId, id);
    }
}