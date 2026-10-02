import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { AdminService } from 'src/admin/service/admin/admin.service';
import { UpdateUserStatusDto } from 'src/admin/dto/UpdateUserStatus.dto';
import { UpdateUserDto } from 'src/users/dto/UpdateUser.dto';
import { SendSupportMessageDto } from 'src/support/dto/SendSupportMessage.dto';
import { UpdateDepositStatusDto } from 'src/admin/dto/UpdateDepositStatus.dto';
import { UpdateWithdrawalStatusDto } from 'src/admin/dto/UpdateWithdrawalStatus.dto';
import { UpdateDepositDetailsDto } from 'src/admin/dto/UpdateDepositDetails.dto';
import { UpdateWithdrawalDetailsDto } from 'src/admin/dto/UpdateWithdrawalDetails.dto';
import { CreateInvestmentPlanDto } from 'src/admin/dto/CreateInvestmentPlan.dto';
import { UpdateInvestmentPlanDto } from 'src/admin/dto/UpdateInvestmentPlan.dto';
import { CreateCryptoAddressDto } from 'src/admin/dto/CreateCryptoAddress.dto';
import { UpdateCryptoAddressDto } from 'src/admin/dto/UpdateCryptoAddress.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard/jwt-auth.guard';
import { UserRole } from 'src/users/entities/user.entity/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private adminService: AdminService) {}

    @Get('dashboard')
    getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('users')
    getAllUsers() {
        return this.adminService.getAllUsers();
    }

    @Get('users/:id')
    getUserById(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.getUserById(id);
    }

    @Patch('users/:id/status')
    updateUserStatus(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserStatusDto,
    ) {
        return this.adminService.updateUserStatus(req.user.userId, id, dto.status);
    }

    @Get('users/:id/wallet')
    getUserWallet(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.getUserWallet(id);
    }

    @Patch('users/:id')
    updateUserProfile(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto,
    ) {
        return this.adminService.updateUserProfile(req.user.userId, id, dto);
    }

    @Get('deposits')
    getAllDeposits() {
        return this.adminService.getAllDeposits();
    }

    @Get('deposits/:id')
    getDepositById(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.getDepositById(id);
    }

    @Patch('deposits/:id/status')
    updateDepositStatus(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDepositStatusDto,
    ) {
        return this.adminService.updateDepositStatus(req.user.userId, id, dto.status);
    }

    @Patch('deposits/:id/details')
    updateDepositDetails(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDepositDetailsDto,
    ) {
        return this.adminService.updateDepositDetails(req.user.userId, id, dto);
    }

    @Get('withdrawals')
    getAllWithdrawals() {
        return this.adminService.getAllWithdrawals();
    }

    @Get('withdrawals/:id')
    getWithdrawalById(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.getWithdrawalById(id);
    }

    @Patch('withdrawals/:id/status')
    updateWithdrawalStatus(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateWithdrawalStatusDto,
    ) {
        return this.adminService.updateWithdrawalStatus(req.user.userId, id, dto.status);
    }

    @Patch('withdrawals/:id/details')
    updateWithdrawalDetails(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateWithdrawalDetailsDto,
    ) {
        return this.adminService.updateWithdrawalDetails(req.user.userId, id, dto);
    }

    @Post('investment-plans')
    createInvestmentPlan(@Req() req: any, @Body() dto: CreateInvestmentPlanDto) {
        return this.adminService.createInvestmentPlan(req.user.userId, dto);
    }

    @Patch('investment-plans/:id')
    updateInvestmentPlan(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateInvestmentPlanDto,
    ) {
        return this.adminService.updateInvestmentPlan(req.user.userId, id, dto);
    }

    @Get('investments')
    getAllInvestments() {
        return this.adminService.getAllInvestments();
    }

    @Get('support/conversations')
    getSupportConversations() {
        return this.adminService.getSupportConversations();
    }

    @Get('support/conversations/:userId')
    getSupportConversation(@Param('userId', ParseIntPipe) userId: number) {
        return this.adminService.getSupportConversation(userId);
    }

    @Post('support/conversations/:userId')
    replyToSupportConversation(
        @Req() req: any,
        @Param('userId', ParseIntPipe) userId: number,
        @Body() dto: SendSupportMessageDto,
    ) {
        return this.adminService.replyToSupportConversation(req.user.userId, userId, dto.content);
    }

    @Get('support/guest-conversations/:guestId')
    getGuestSupportConversation(@Param('guestId') guestId: string) {
        return this.adminService.getGuestSupportConversation(guestId);
    }

    @Post('support/guest-conversations/:guestId')
    replyToGuestSupportConversation(
        @Param('guestId') guestId: string,
        @Body() dto: SendSupportMessageDto,
    ) {
        return this.adminService.replyToGuestSupportConversation(guestId, dto.content);
    }

    @Post('crypto-addresses')
    createCryptoAddress(@Req() req: any, @Body() dto: CreateCryptoAddressDto) {
        return this.adminService.createCryptoAddress(req.user.userId, dto.currency, dto.label, dto.address);
    }

    @Patch('crypto-addresses/:id')
    updateCryptoAddress(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCryptoAddressDto,
    ) {
        return this.adminService.updateCryptoAddress(req.user.userId, id, dto);
    }

    @Get('trades')
    getAllTrades() {
        return this.adminService.getAllTrades();
    }

    @Get('audit-logs')
    getAuditLogs() {
        return this.adminService.getAuditLogs();
    }
}