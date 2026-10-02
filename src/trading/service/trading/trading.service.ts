import { HttpException, HttpStatus, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interval } from '@nestjs/schedule';
import { Market, MarketCategory } from 'src/trading/entities/market.entity';
import { Trade, TradeSide } from 'src/trading/entities/trade.entity';
import { Position } from 'src/trading/entities/position.entity';
import { User } from 'src/users/entities/user.entity/user.entity';
import { BankingService } from 'src/banking/service/banking/banking.service';
import { CreateTradeParams } from 'utils/types';

@Injectable()
export class TradingService implements OnApplicationBootstrap {

    constructor(
        @InjectRepository(Market) private marketRepository: Repository<Market>,
        @InjectRepository(Trade) private tradeRepository: Repository<Trade>,
        @InjectRepository(Position) private positionRepository: Repository<Position>,
        private bankingService: BankingService,
    ) {}

    async onApplicationBootstrap() {
        const count = await this.marketRepository.count();
        if (count > 0) return;

        await this.marketRepository.save([
            this.marketRepository.create({ symbol: 'EUR/USD', name: 'Euro / US Dollar', category: MarketCategory.FOREX, currentPrice: 1.0850 }),
            this.marketRepository.create({ symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: MarketCategory.FOREX, currentPrice: 1.2650 }),
            this.marketRepository.create({ symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: MarketCategory.FOREX, currentPrice: 149.80 }),
            this.marketRepository.create({ symbol: 'BTC/USD', name: 'Bitcoin', category: MarketCategory.CRYPTO, currentPrice: 62000 }),
            this.marketRepository.create({ symbol: 'ETH/USD', name: 'Ethereum', category: MarketCategory.CRYPTO, currentPrice: 3400 }),
            this.marketRepository.create({ symbol: 'GOLD', name: 'Gold Spot', category: MarketCategory.COMMODITIES, currentPrice: 2350.50 }),
            this.marketRepository.create({ symbol: 'SILVER', name: 'Silver Spot', category: MarketCategory.COMMODITIES, currentPrice: 27.30 }),
            this.marketRepository.create({ symbol: 'OIL', name: 'Crude Oil WTI', category: MarketCategory.COMMODITIES, currentPrice: 78.40 }),
            this.marketRepository.create({ symbol: 'SPX', name: 'S&P 500', category: MarketCategory.INDICES, currentPrice: 5200 }),
            this.marketRepository.create({ symbol: 'NDX', name: 'NASDAQ 100', category: MarketCategory.INDICES, currentPrice: 18200 }),
        ]);
    }

    @Interval(3000)
    async simulatePriceMovement() {
        const markets = await this.marketRepository.find();
        for (const market of markets) {
            const changePercent = (Math.random() - 0.5) * 0.02;
            const newPrice = Number(market.currentPrice) * (1 + changePercent);
            market.currentPrice = Math.max(0.0001, Number(newPrice.toFixed(4)));
            await this.marketRepository.save(market);
        }
    }

    getMarkets() {
        return this.marketRepository.find();
    }

    async getMarketById(id: number) {
        const market = await this.marketRepository.findOneBy({ id });
        if (!market) {
            throw new HttpException('Market not found.', HttpStatus.NOT_FOUND);
        }
        return market;
    }

    async createTrade(userId: number, params: CreateTradeParams) {
        const market = await this.getMarketById(params.marketId);
        const price = Number(market.currentPrice);
        const total = Number((params.quantity * price).toFixed(2));

        if (params.side === TradeSide.BUY) {
            await this.bankingService.debitWallet(userId, total);
        } else {
            const position = await this.positionRepository.findOne({
                where: { user: { id: userId }, market: { id: params.marketId } },
            });
            if (!position || Number(position.quantity) < params.quantity) {
                throw new HttpException('Insufficient position quantity to sell.', HttpStatus.BAD_REQUEST);
            }
            await this.bankingService.creditWallet(userId, total);
        }

        const trade = this.tradeRepository.create({
            side: params.side,
            quantity: params.quantity,
            price,
            total,
            user: { id: userId } as User,
            market,
        });
        const savedTrade = await this.tradeRepository.save(trade);

        await this.applyTradeToPosition(userId, market, params.side, params.quantity, price);

        return savedTrade;
    }

    private async applyTradeToPosition(
        userId: number,
        market: Market,
        side: TradeSide,
        quantity: number,
        price: number,
    ) {
        const existing = await this.positionRepository.findOne({
            where: { user: { id: userId }, market: { id: market.id } },
        });

        if (side === TradeSide.BUY) {
            if (!existing) {
                const position = this.positionRepository.create({
                    user: { id: userId } as User,
                    market,
                    quantity,
                    averageEntryPrice: price,
                });
                await this.positionRepository.save(position);
                return;
            }

            const newQuantity = Number(existing.quantity) + quantity;
            const newAveragePrice =
                (Number(existing.quantity) * Number(existing.averageEntryPrice) + quantity * price) / newQuantity;

            existing.quantity = newQuantity;
            existing.averageEntryPrice = Number(newAveragePrice.toFixed(4));
            await this.positionRepository.save(existing);
            return;
        }

        const remaining = Number(existing!.quantity) - quantity;
        if (remaining <= 0.00000001) {
            await this.positionRepository.remove(existing!);
        } else {
            existing!.quantity = remaining;
            await this.positionRepository.save(existing!);
        }
    }

    getTrades(userId: number) {
        return this.tradeRepository.find({
            where: { user: { id: userId } },
            relations: { market: true },
            order: { createdAt: 'DESC' },
        });
    }

    getPositions(userId: number) {
        return this.positionRepository.find({
            where: { user: { id: userId } },
            relations: { market: true },
        });
    }

    async getPositionById(userId: number, positionId: number) {
        const position = await this.positionRepository.findOne({
            where: { id: positionId, user: { id: userId } },
            relations: { market: true },
        });
        if (!position) {
            throw new HttpException('Position not found.', HttpStatus.NOT_FOUND);
        }
        return position;
    }

    async getAllTrades() {
        const trades = await this.tradeRepository.find({
            relations: { user: true, market: true },
            order: { createdAt: 'DESC' },
        });
        return trades.map((trade) => {
            const { password, ...safeUser } = trade.user;
            return { ...trade, user: safeUser };
        });
    }
}