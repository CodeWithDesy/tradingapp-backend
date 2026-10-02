import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    fullName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @IsString()
    phone: string;
    
    @IsNotEmpty()
    @IsString()
    country: string;

    @IsNotEmpty()   
    @IsString()
    @MinLength(8)
    password: string; 
}