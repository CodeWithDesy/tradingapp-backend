import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SendSupportMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;
}