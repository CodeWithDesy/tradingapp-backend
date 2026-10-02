import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCryptoAddressDto {
    @IsString()
    @IsNotEmpty()
    currency: string; // short code, e.g. 'BTC'

    @IsString()
    @IsNotEmpty()
    label: string; // display name, e.g. 'Bitcoin'

    @IsString()
    @IsNotEmpty()
    address: string;
}