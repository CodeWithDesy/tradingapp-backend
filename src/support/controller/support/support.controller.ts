import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SupportService } from 'src/support/service/support/support.service';
import { SendSupportMessageDto } from 'src/support/dto/SendSupportMessage.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard/jwt-auth.guard';

// Every route acts on the CALLER's own conversation (req.user.userId) —
// same self-service pattern as BankingController/ProfileController.
@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
    constructor(private supportService: SupportService) {}

    @Get('messages')
    getConversation(@Req() req: any) {
        return this.supportService.getConversationForUser(req.user.userId);
    }

    @Get('unread-count')
    getUnreadCount(@Req() req: any) {
        return this.supportService.getUnreadCountForUser(req.user.userId);
    }

    @Post('messages')
    sendMessage(@Req() req: any, @Body() dto: SendSupportMessageDto) {
        return this.supportService.sendFromUser(req.user.userId, dto.content);
    }
}