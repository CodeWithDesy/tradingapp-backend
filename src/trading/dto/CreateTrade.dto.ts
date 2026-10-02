import { IsEnum, IsInt, IsNumber, Min } from 'class-validator';
import { TradeSide } from 'src/trading/entities/trade.entity';

export class CreateTradeDto {
    @IsInt()
    marketId: number;

    @IsEnum(TradeSide)
    side: TradeSide;

    @IsNumber()
    @Min(0.00000001)
    quantity: number;
}