import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { TradingService } from 'src/trading/service/trading/trading.service';
import { CreateTradeDto } from 'src/trading/dto/CreateTrade.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard/jwt-auth.guard';

@Controller('trading')
@UseGuards(JwtAuthGuard)
export class TradingController {
    constructor(private tradingService: TradingService) {}

    @Get('markets')
    getMarkets() {
        return this.tradingService.getMarkets();
    }

    @Get('markets/:id')
    getMarketById(@Param('id', ParseIntPipe) id: number) {
        return this.tradingService.getMarketById(id);
    }

    @Post('trades')
    createTrade(@Req() req: any, @Body() createTradeDto: CreateTradeDto) {
        return this.tradingService.createTrade(req.user.userId, createTradeDto);
    }

    @Get('trades')
    getTrades(@Req() req: any) {
        return this.tradingService.getTrades(req.user.userId);
    }

    @Get('positions')
    getPositions(@Req() req: any) {
        return this.tradingService.getPositions(req.user.userId);
    }

    @Get('positions/:id')
    getPositionById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.tradingService.getPositionById(req.user.userId, id);
    }
}