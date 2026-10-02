import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SendGuestSupportMessageDto {
    @IsString()
    @IsNotEmpty()
    guestId: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    guestName?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;
}