import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from 'src/admin/entities/audit-log.entity';
import { UsersService } from 'src/users/service/users/users.service';
import { BankingService } from 'src/banking/service/banking/banking.service';
import { InvestmentsService } from 'src/investments/service/investments/investments.service';
import { TradingService } from 'src/trading/service/trading/trading.service';
import { SupportService } from 'src/support/service/support/support.service';
import { DepositStatus, DepositMethod } from 'src/banking/entities/deposit.entity';
import { WithdrawalStatus, WithdrawalMethod } from 'src/banking/entities/withdrawal.entity';
import { CreateInvestmentPlanParams, UpdateInvestmentPlanParams, UpdateUserParams } from 'utils/types';
import { AccountStatus, User } from 'src/users/entities/user.entity/user.entity';

@Injectable()
export class AdminService {

    constructor(
        @InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>,
        private usersService: UsersService,
        private bankingService: BankingService,
        private investmentsService: InvestmentsService,
        private tradingService: TradingService,
        private supportService: SupportService,
    ) {}

    private writeAuditLog(adminId: number, action: string, targetType: string, targetId: number, details: string) {
        const entry = this.auditLogRepository.create({
            admin: { id: adminId } as User,
            action,
            targetType,
            targetId,
            details,
        });
        return this.auditLogRepository.save(entry);
    }

    // ---- Users ----

    getAllUsers() {
        return this.usersService.fetchUsers();
    }

    getUserById(id: number) {
        return this.usersService.getProfile(id);
    }

    async updateUserStatus(adminId: number, userId: number, status: AccountStatus) {
        const user = await this.usersService.updateAccountStatus(userId, status);
        await this.writeAuditLog(adminId, 'USER_STATUS_UPDATE', 'User', userId, `Status changed to ${status}`);
        return user;
    }

    // Real wallet balance for the admin user-detail view — getWallet()
    // already takes any userId (it's not restricted to "my own wallet"
    // the way the customer-facing controller route is), so this just
    // exposes it through an admin-only route.
    getUserWallet(userId: number) {
        return this.bankingService.getWallet(userId);
    }

    async updateUserProfile(adminId: number, userId: number, params: UpdateUserParams) {
        const user = await this.usersService.updateProfile(userId, params);
        await this.writeAuditLog(
            adminId, 'USER_PROFILE_UPDATE', 'User', userId,
            `Updated fields: ${Object.keys(params).join(', ')}`,
        );
        return user;
    }

    // ---- Deposits ----

    getAllDeposits() {
        return this.bankingService.getAllDeposits();
    }

    async getDepositById(id: number) {
        const deposit = await this.bankingService.findDepositByIdAdmin(id);
        const { password, ...safeUser } = deposit.user;
        return { ...deposit, user: safeUser };
    }

    async updateDepositStatus(adminId: number, depositId: number, status: DepositStatus) {
        const deposit = await this.bankingService.updateDepositStatus(depositId, status);
        await this.writeAuditLog(adminId, 'DEPOSIT_STATUS_UPDATE', 'Deposit', depositId, `Status changed to ${status}`);
        return deposit;
    }

    async updateDepositDetails(adminId: number, depositId: number, updates: { amount?: number; method?: DepositMethod }) {
        const deposit = await this.bankingService.updateDepositDetails(depositId, updates);
        await this.writeAuditLog(
            adminId, 'DEPOSIT_DETAILS_UPDATE', 'Deposit', depositId,
            `Edited fields: ${Object.keys(updates).join(', ')}`,
        );
        return deposit;
    }

    // ---- Withdrawals ----

    getAllWithdrawals() {
        return this.bankingService.getAllWithdrawals();
    }

    async getWithdrawalById(id: number) {
        const withdrawal = await this.bankingService.findWithdrawalByIdAdmin(id);
        const { password, ...safeUser } = withdrawal.user;
        return { ...withdrawal, user: safeUser };
    }

    async updateWithdrawalStatus(adminId: number, withdrawalId: number, status: WithdrawalStatus) {
        const withdrawal = await this.bankingService.updateWithdrawalStatus(withdrawalId, status);
        await this.writeAuditLog(
            adminId, 'WITHDRAWAL_STATUS_UPDATE', 'Withdrawal', withdrawalId, `Status changed to ${status}`,
        );
        return withdrawal;
    }

    async updateWithdrawalDetails(
        adminId: number,
        withdrawalId: number,
        updates: {
            amount?: number; method?: WithdrawalMethod; bankAccountName?: string;
            bankAccountNumber?: string; bankName?: string; bankRoutingNumber?: string; cryptoAddress?: string;
        },
    ) {
        const withdrawal = await this.bankingService.updateWithdrawalDetails(withdrawalId, updates);
        await this.writeAuditLog(
            adminId, 'WITHDRAWAL_DETAILS_UPDATE', 'Withdrawal', withdrawalId,
            `Edited fields: ${Object.keys(updates).join(', ')}`,
        );
        return withdrawal;
    }

    // ---- Investment plans ----

    async createInvestmentPlan(adminId: number, params: CreateInvestmentPlanParams) {
        const plan = await this.investmentsService.createPlan(params);
        await this.writeAuditLog(
            adminId, 'INVESTMENT_PLAN_CREATED', 'InvestmentPlan', plan.id, `Created plan "${plan.name}"`,
        );
        return plan;
    }

    async updateInvestmentPlan(adminId: number, planId: number, params: UpdateInvestmentPlanParams) {
        const plan = await this.investmentsService.updatePlan(planId, params);
        await this.writeAuditLog(
            adminId, 'INVESTMENT_PLAN_UPDATED', 'InvestmentPlan', planId,
            `Updated fields: ${Object.keys(params).join(', ')}`,
        );
        return plan;
    }

    // ---- Crypto deposit addresses ----

    async createCryptoAddress(adminId: number, currency: string, label: string, address: string) {
        const entry = await this.bankingService.createCryptoDepositAddress(currency, label, address);
        await this.writeAuditLog(
            adminId, 'CRYPTO_ADDRESS_CREATED', 'CryptoDepositAddress', entry.id, `Added ${label} (${currency}) deposit address`,
        );
        return entry;
    }

    async updateCryptoAddress(adminId: number, id: number, updates: { label?: string; address?: string }) {
        const entry = await this.bankingService.updateCryptoDepositAddress(id, updates);
        await this.writeAuditLog(
            adminId, 'CRYPTO_ADDRESS_UPDATED', 'CryptoDepositAddress', id, `Updated ${entry.label} (${entry.currency}) deposit address`,
        );
        return entry;
    }

    getAllInvestments() {
        return this.investmentsService.getAllInvestments();
    }

    // ---- Support ----

    getSupportConversations() {
        return this.supportService.getAllConversations();
    }

    getSupportConversation(userId: number) {
        return this.supportService.getConversationForAdmin(userId);
    }

    replyToSupportConversation(adminId: number, userId: number, content: string) {
        // Not audit-logged — a routine reply isn't an account-affecting
        // action the way a status change or a deposit approval is, and
        // logging every message would clutter the audit log with chat
        // content rather than meaningful administrative actions.
        return this.supportService.sendFromAdmin(userId, content);
    }

    getGuestSupportConversation(guestId: string) {
        return this.supportService.getConversationForGuestAdmin(guestId);
    }

    replyToGuestSupportConversation(guestId: string, content: string) {
        return this.supportService.sendFromAdminToGuest(guestId, content);
    }

    // ---- Trading ----

    getAllTrades() {
        return this.tradingService.getAllTrades();
    }

    // ---- Audit log ----

    getAuditLogs() {
        return this.auditLogRepository.find({
            relations: { admin: true },
            order: { createdAt: 'DESC' },
        });
    }

    // ---- Dashboard ----

    async getDashboardStats() {
        const [users, deposits, withdrawals, investments, trades] = await Promise.all([
            this.usersService.fetchUsers(),
            this.bankingService.getAllDeposits(),
            this.bankingService.getAllWithdrawals(),
            this.investmentsService.getAllInvestments(),
            this.tradingService.getAllTrades(),
        ]);

        return {
            totalUsers: users.length,
            activeUsers: users.filter((u) => u.accountStatus === AccountStatus.ACTIVE).length,
            suspendedUsers: users.filter((u) => u.accountStatus === AccountStatus.SUSPENDED).length,
            pendingDeposits: deposits.filter((d) => d.status === DepositStatus.PENDING).length,
            pendingWithdrawals: withdrawals.filter((w) => w.status === WithdrawalStatus.PENDING).length,
            totalInvestments: investments.length,
            totalTrades: trades.length,
        };
    }
}