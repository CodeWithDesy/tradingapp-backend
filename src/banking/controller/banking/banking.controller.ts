import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BankingService } from 'src/banking/service/banking/banking.service';
import { CreateDepositDto } from 'src/banking/dto/CreateDeposit.dto';
import { CreateWithdrawalDto } from 'src/banking/dto/CreateWithdrawal.dto';
import { QueryTransactionsDto } from 'src/banking/dto/QueryTransactions.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard/jwt-auth.guard';

// Every route acts on the CALLER's own wallet/deposits/withdrawals
// (req.user.userId) — same self-service pattern as ProfileController.
@Controller('banking')
@UseGuards(JwtAuthGuard)
export class BankingController {
    constructor(private bankingService: BankingService) {}

    @Get('wallet')
    getWallet(@Req() req: any) {
        return this.bankingService.getWallet(req.user.userId);
    }

    @Get('crypto-addresses')
    getCryptoDepositAddresses() {
        return this.bankingService.getCryptoDepositAddresses();
    }

    @Post('deposits')
    createDeposit(@Req() req: any, @Body() createDepositDto: CreateDepositDto) {
        return this.bankingService.createDeposit(req.user.userId, createDepositDto);
    }

    @Get('deposits')
    getDeposits(@Req() req: any) {
        return this.bankingService.getDeposits(req.user.userId);
    }

    @Get('deposits/:id')
    getDepositById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.bankingService.getDepositById(req.user.userId, id);
    }

    @Post('withdrawals')
    createWithdrawal(@Req() req: any, @Body() createWithdrawalDto: CreateWithdrawalDto) {
        return this.bankingService.createWithdrawal(req.user.userId, createWithdrawalDto);
    }

    @Get('withdrawals')
    getWithdrawals(@Req() req: any) {
        return this.bankingService.getWithdrawals(req.user.userId);
    }

    @Get('withdrawals/:id')
    getWithdrawalById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.bankingService.getWithdrawalById(req.user.userId, id);
    }

    @Get('transactions')
    getTransactionHistory(@Req() req: any, @Query() query: QueryTransactionsDto) {
        return this.bankingService.getTransactionHistory(req.user.userId, query);
    }
}