import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateCryptoAddressDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    label?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    address?: string;
}