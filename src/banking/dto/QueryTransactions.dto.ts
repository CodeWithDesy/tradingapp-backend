import { IsIn, IsInt, IsOptional, IsDateString, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTransactionsDto {
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
    @IsOptional() @IsIn(['DEPOSIT', 'WITHDRAWAL']) type?: 'DEPOSIT' | 'WITHDRAWAL';
    @IsOptional() @IsString() search?: string;
    @IsOptional() @IsDateString() startDate?: string;
    @IsOptional() @IsDateString() endDate?: string;
}