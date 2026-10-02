import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAvatarDto {
    // Placeholder: accepts a URL/string for now. A real upload (Multer,
    // saved file, returned path) comes in a later stage.
    @IsString()
    @IsNotEmpty()
    avatar: string;
}