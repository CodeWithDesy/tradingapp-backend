import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SupportService } from 'src/support/service/support/support.service';
import { SendGuestSupportMessageDto } from 'src/support/dto/SendGuestSupportMessage.dto';

// Deliberately has no JwtAuthGuard — this is the whole point: an
// unregistered visitor (or a suspended user who can no longer log in)
// reaches support without an account at all, identified only by a random
// token their own browser generated and is holding in localStorage.
@Controller('support/guest')
export class GuestSupportController {
    constructor(private supportService: SupportService) {}

    @Get('messages/:guestId')
    getConversation(@Param('guestId') guestId: string) {
        return this.supportService.getConversationForGuest(guestId);
    }

    @Get('unread-count/:guestId')
    getUnreadCount(@Param('guestId') guestId: string) {
        return this.supportService.getUnreadCountForGuest(guestId);
    }

    @Post('messages')
    sendMessage(@Body() dto: SendGuestSupportMessageDto) {
        return this.supportService.sendFromGuest(dto.guestId, dto.guestName, dto.content);
    }
}