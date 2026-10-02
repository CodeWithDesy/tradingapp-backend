import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from 'src/banking/entities/wallet.entity';
import { Deposit, DepositMethod, DepositStatus } from 'src/banking/entities/deposit.entity';
import { Withdrawal, WithdrawalStatus, WithdrawalMethod } from 'src/banking/entities/withdrawal.entity';
import { CryptoDepositAddress } from 'src/banking/entities/crypto-deposit-address.entity';
import { CreateDepositParams, CreateWithdrawalParams, QueryTransactionsParams } from 'utils/types';
import { NotificationsService } from 'src/notifications/service/notifications/notifications.service';
import { NotificationCategory } from 'src/notifications/entities/notification.entity';
import { User } from 'src/users/entities/user.entity/user.entity';

const WITHDRAWAL_FEE_RATE = 0.005; // 0.5%, matches the frontend's mock fee

@Injectable()
export class BankingService {

    constructor(
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        @InjectRepository(Deposit) private depositRepository: Repository<Deposit>,
        @InjectRepository(Withdrawal) private withdrawalRepository: Repository<Withdrawal>,
        @InjectRepository(CryptoDepositAddress) private cryptoAddressRepository: Repository<CryptoDepositAddress>,
        private notificationsService: NotificationsService,
    ) {}

    // Shown to any signed-in user on the Deposit page when they choose
    // Crypto Wallet — admin-managed, same for every user (see AdminService
    // for the create/update side).
    async getCryptoDepositAddresses() {
        return this.cryptoAddressRepository.find({ order: { currency: 'ASC' } });
    }

    async createCryptoDepositAddress(currency: string, label: string, address: string) {
        const existing = await this.cryptoAddressRepository.findOne({ where: { currency } });
        if (existing) {
            throw new HttpException(`An address for ${currency} already exists — update it instead.`, HttpStatus.CONFLICT);
        }
        const entry = this.cryptoAddressRepository.create({ currency, label, address });
        return this.cryptoAddressRepository.save(entry);
    }

    async updateCryptoDepositAddress(id: number, updates: { label?: string; address?: string }) {
        const entry = await this.cryptoAddressRepository.findOne({ where: { id } });
        if (!entry) throw new HttpException('Crypto address not found.', HttpStatus.NOT_FOUND);
        Object.assign(entry, updates);
        return this.cryptoAddressRepository.save(entry);
    }

    async createWalletForUser(user: User) {
        const wallet = this.walletRepository.create({ user, balance: 0 });
        return this.walletRepository.save(wallet);
    }

    async getWallet(userId: number) {
        const wallet = await this.walletRepository.findOne({ where: { user: { id: userId } } });
        if (!wallet) {
            throw new HttpException('Wallet not found.', HttpStatus.NOT_FOUND);
        }
        return wallet;
    }

    async debitWallet(userId: number, amount: number) {
        const wallet = await this.getWallet(userId);
        if (Number(wallet.balance) < amount) {
            throw new HttpException('Insufficient balance.', HttpStatus.BAD_REQUEST);
        }
        wallet.balance = Number(wallet.balance) - amount;
        return this.walletRepository.save(wallet);
    }

    async creditWallet(userId: number, amount: number) {
        const wallet = await this.getWallet(userId);
        wallet.balance = Number(wallet.balance) + amount;
        return this.walletRepository.save(wallet);
    }

    async createDeposit(userId: number, createDepositDetails: CreateDepositParams) {
        const wallet = await this.getWallet(userId);
        // Card payments would be processed instantly by a real payment
        // gateway. Crypto has no automated on-chain monitoring here, so —
        // like a bank transfer — it needs an admin to manually verify the
        // payment arrived before it's credited.
        const isInstant = createDepositDetails.method === DepositMethod.CARD;

        const deposit = this.depositRepository.create({
            amount: createDepositDetails.amount,
            method: createDepositDetails.method,
            status: isInstant ? DepositStatus.COMPLETED : DepositStatus.PENDING,
            user: { id: userId } as User,
        });
        const savedDeposit = await this.depositRepository.save(deposit);

        if (isInstant) {
            await this.creditWallet(userId, Number(createDepositDetails.amount));
        }

        await this.notificationsService.create(
            userId,
            NotificationCategory.DEPOSIT,
            isInstant ? 'Deposit completed' : 'Deposit received',
            isInstant
                ? `Your deposit of ${createDepositDetails.amount} has been completed.`
                : `Your deposit of ${createDepositDetails.amount} is pending review.`,
        );

        return savedDeposit;
    }

    async getDeposits(userId: number) {
        return this.depositRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
        });
    }

    async getDepositById(userId: number, depositId: number) {
        const deposit = await this.depositRepository.findOne({
            where: { id: depositId, user: { id: userId } },
        });
        if (!deposit) {
            throw new HttpException('Deposit not found.', HttpStatus.NOT_FOUND);
        }
        return deposit;
    }

    // A correcting entry for an admin amount-edit on an already-settled
    // transaction, kept separate from the original record so the
    // customer's transaction history stays honest: the original entry is
    // never silently rewritten, and this new one shows up as its own,
    // clearly-labelled line for exactly the difference. Positive delta
    // (money added) becomes a completed deposit; negative delta (money
    // taken back) becomes a completed withdrawal. The wallet itself was
    // already adjusted by the caller before this runs.
    private async createAdjustmentRecord(userId: number, delta: number) {
        if (delta > 0) {
            const adjustment = this.depositRepository.create({
                amount: delta,
                method: DepositMethod.ADMIN_ADJUSTMENT,
                status: DepositStatus.COMPLETED,
                user: { id: userId } as User,
            });
            await this.depositRepository.save(adjustment);
        } else {
            const adjustment = this.withdrawalRepository.create({
                amount: -delta,
                fee: 0,
                method: WithdrawalMethod.ADMIN_ADJUSTMENT,
                status: WithdrawalStatus.COMPLETED,
                user: { id: userId } as User,
            });
            await this.withdrawalRepository.save(adjustment);
        }
        await this.notificationsService.create(
            userId,
            NotificationCategory.ACCOUNT,
            delta > 0 ? 'Account credited' : 'Account debited',
            delta > 0
                ? `${delta} was added to your account by our team.`
                : `${-delta} was deducted from your account by our team.`,
        );
    }

    // Admin-only correction of a deposit's details, editable regardless of
    // status. Method can still be edited directly on the record at any
    // time (it never affects the wallet). Amount is different: while the
    // deposit is still PENDING or already FAILED, the wallet was never
    // credited either way, so correcting a data-entry mistake can just
    // update the field directly. But once a deposit is COMPLETED, the
    // customer has already seen that exact amount land — so instead of
    // rewriting it, the wallet is adjusted by the difference and a
    // separate adjustment record captures that difference on its own.
    async updateDepositDetails(depositId: number, updates: { amount?: number; method?: DepositMethod }) {
        const deposit = await this.findDepositByIdAdmin(depositId);

        if (updates.amount !== undefined && updates.amount !== Number(deposit.amount) && deposit.status === DepositStatus.COMPLETED) {
            const delta = updates.amount - Number(deposit.amount);
            if (delta > 0) {
                await this.creditWallet(deposit.user.id, delta);
            } else {
                await this.debitWallet(deposit.user.id, -delta); // throws if the user no longer has enough balance to take back
            }
            // The original record's amount is still updated to the new value
            // (so a later edit computes its own delta against the true
            // current amount, not a stale one) — the adjustment record
            // alongside it is what gives the customer a visible, separate
            // entry marking exactly what changed and when.
            await this.createAdjustmentRecord(deposit.user.id, delta);
        }

        Object.assign(deposit, updates);
        const saved = await this.depositRepository.save(deposit);
        const { password, ...safeUser } = saved.user;
        return { ...saved, user: safeUser };
    }

    async createWithdrawal(userId: number, createWithdrawalDetails: CreateWithdrawalParams) {
        const fee = Number((createWithdrawalDetails.amount * WITHDRAWAL_FEE_RATE).toFixed(2));

        await this.debitWallet(userId, createWithdrawalDetails.amount);

        const withdrawal = this.withdrawalRepository.create({
            amount: createWithdrawalDetails.amount,
            fee,
            method: createWithdrawalDetails.method,
            bankAccountName: createWithdrawalDetails.bankAccountName,
            bankAccountNumber: createWithdrawalDetails.bankAccountNumber,
            bankName: createWithdrawalDetails.bankName,
            bankRoutingNumber: createWithdrawalDetails.bankRoutingNumber,
            cryptoAddress: createWithdrawalDetails.cryptoAddress,
            status: WithdrawalStatus.PENDING,
            user: { id: userId } as User,
        });
        const saved = await this.withdrawalRepository.save(withdrawal);

        await this.notificationsService.create(
            userId,
            NotificationCategory.WITHDRAWAL,
            'Withdrawal requested',
            `Your withdrawal request of ${createWithdrawalDetails.amount} has been received and is being processed.`,
        );

        return saved;
    }

    async getWithdrawals(userId: number) {
        return this.withdrawalRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
        });
    }

    async getWithdrawalById(userId: number, withdrawalId: number) {
        const withdrawal = await this.withdrawalRepository.findOne({
            where: { id: withdrawalId, user: { id: userId } },
        });
        if (!withdrawal) {
            throw new HttpException('Withdrawal not found.', HttpStatus.NOT_FOUND);
        }
        return withdrawal;
    }

    // Admin-only correction of a withdrawal's details, editable regardless
    // of status. Method and destination fields can still be edited
    // directly on the record (they don't touch the wallet). Amount is
    // different: a withdrawal debits the wallet the moment it's created
    // and stays debited through PENDING and COMPLETED — the customer saw
    // their balance drop by that exact amount already — so for those two
    // statuses, an amount change adjusts the wallet by the difference and
    // records that difference as its own separate entry, rather than
    // rewriting the original. Only a FAILED withdrawal (debit already
    // refunded, nothing currently reflected) can have its amount corrected
    // directly, since there's no customer-visible effect to preserve.
    async updateWithdrawalDetails(
        withdrawalId: number,
        updates: {
            amount?: number;
            method?: WithdrawalMethod;
            bankAccountName?: string;
            bankAccountNumber?: string;
            bankName?: string;
            bankRoutingNumber?: string;
            cryptoAddress?: string;
        },
    ) {
        const withdrawal = await this.findWithdrawalByIdAdmin(withdrawalId);
        const hasActiveDebit = withdrawal.status === WithdrawalStatus.PENDING || withdrawal.status === WithdrawalStatus.COMPLETED;

        if (updates.amount !== undefined && updates.amount !== Number(withdrawal.amount)) {
            const newAmount = updates.amount; // narrowed to number here, kept as its own const so it stays narrowed throughout this block
            if (hasActiveDebit) {
                const delta = newAmount - Number(withdrawal.amount);
                if (delta > 0) {
                    // Increasing the withdrawal means debiting the extra amount —
                    // debitWallet itself checks the user actually has it.
                    await this.debitWallet(withdrawal.user.id, delta);
                } else {
                    // Decreasing it means refunding the difference.
                    await this.creditWallet(withdrawal.user.id, -delta);
                }
                withdrawal.fee = Number((newAmount * WITHDRAWAL_FEE_RATE).toFixed(2));
                // Same reasoning as updateDepositDetails: the original record's
                // amount still gets updated to the new value so a later edit
                // computes correctly, and the adjustment record alongside it is
                // the customer-visible entry marking what changed. Sign is
                // flipped from the withdrawal's own delta because this is from
                // the wallet's point of view: taking more money out (positive
                // delta here) is a debit for the customer, giving some back
                // (negative delta here) is a credit.
                await this.createAdjustmentRecord(withdrawal.user.id, -delta);
            } else {
                withdrawal.fee = Number((newAmount * WITHDRAWAL_FEE_RATE).toFixed(2));
            }
        }

        Object.assign(withdrawal, updates);
        const saved = await this.withdrawalRepository.save(withdrawal);
        const { password, ...safeUser } = saved.user;
        return { ...saved, user: safeUser };
    }

    async getTransactionHistory(userId: number, query: QueryTransactionsParams) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;

        const deposits = query.type === 'WITHDRAWAL'
            ? []
            : await this.depositRepository.find({ where: { user: { id: userId } } });

        const withdrawals = query.type === 'DEPOSIT'
            ? []
            : await this.withdrawalRepository.find({ where: { user: { id: userId } } });

        type UnifiedTransaction = {
            reference: string;
            type: 'DEPOSIT' | 'WITHDRAWAL';
            amount: number;
            method: string;
            status: string;
            createdAt: Date;
        };

        let merged: UnifiedTransaction[] = [
            ...deposits.map((d): UnifiedTransaction => ({
                reference: `DEP-${d.id}`,
                type: 'DEPOSIT',
                amount: d.amount,
                method: d.method,
                status: d.status,
                createdAt: d.createdAt,
            })),
            ...withdrawals.map((w): UnifiedTransaction => ({
                reference: `WD-${w.id}`,
                type: 'WITHDRAWAL',
                amount: w.amount,
                method: w.method,
                status: w.status,
                createdAt: w.createdAt,
            })),
        ];

        if (query.startDate) {
            const start = new Date(query.startDate);
            merged = merged.filter((t) => t.createdAt >= start);
        }
        if (query.endDate) {
            const end = new Date(query.endDate);
            merged = merged.filter((t) => t.createdAt <= end);
        }
        if (query.search) {
            const term = query.search.toLowerCase();
            merged = merged.filter((t) =>
                t.reference.toLowerCase().includes(term) ||
                t.method.toLowerCase().includes(term) ||
                t.status.toLowerCase().includes(term)
            );
        }

        merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const total = merged.length;
        const start = (page - 1) * limit;
        const data = merged.slice(start, start + limit);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getAllDeposits() {
        const deposits = await this.depositRepository.find({
            relations: { user: true },
            order: { createdAt: 'DESC' },
        });
        return deposits.map((deposit) => {
            const { password, ...safeUser } = deposit.user;
            return { ...deposit, user: safeUser };
        });
    }

    async getAllWithdrawals() {
        const withdrawals = await this.withdrawalRepository.find({
            relations: { user: true },
            order: { createdAt: 'DESC' },
        });
        return withdrawals.map((withdrawal) => {
            const { password, ...safeUser } = withdrawal.user;
            return { ...withdrawal, user: safeUser };
        });
    }

    async findDepositByIdAdmin(depositId: number) {
        const deposit = await this.depositRepository.findOne({
            where: { id: depositId },
            relations: { user: true },
        });
        if (!deposit) {
            throw new HttpException('Deposit not found.', HttpStatus.NOT_FOUND);
        }
        return deposit;
    }

    async findWithdrawalByIdAdmin(withdrawalId: number) {
        const withdrawal = await this.withdrawalRepository.findOne({
            where: { id: withdrawalId },
            relations: { user: true },
        });
        if (!withdrawal) {
            throw new HttpException('Withdrawal not found.', HttpStatus.NOT_FOUND);
        }
        return withdrawal;
    }

    async updateDepositStatus(depositId: number, status: DepositStatus) {
        const deposit = await this.findDepositByIdAdmin(depositId);
        if (deposit.status !== DepositStatus.PENDING) {
            throw new HttpException(
                `This deposit is already ${deposit.status} and cannot be changed.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        if (status === DepositStatus.COMPLETED) {
            await this.creditWallet(deposit.user.id, Number(deposit.amount));
        }

        deposit.status = status;
        const saved = await this.depositRepository.save(deposit);

        await this.notificationsService.create(
            deposit.user.id,
            NotificationCategory.DEPOSIT,
            status === DepositStatus.COMPLETED ? 'Deposit completed' : 'Deposit failed',
            status === DepositStatus.COMPLETED
                ? `Your deposit of ${deposit.amount} has been completed.`
                : `Your deposit of ${deposit.amount} could not be completed.`,
        );

        const { password, ...safeUser } = saved.user;
        return { ...saved, user: safeUser };
    }

    async updateWithdrawalStatus(withdrawalId: number, status: WithdrawalStatus) {
        const withdrawal = await this.findWithdrawalByIdAdmin(withdrawalId);
        if (withdrawal.status !== WithdrawalStatus.PENDING) {
            throw new HttpException(
                `This withdrawal is already ${withdrawal.status} and cannot be changed.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        if (status === WithdrawalStatus.FAILED) {
            await this.creditWallet(withdrawal.user.id, Number(withdrawal.amount));
        }

        withdrawal.status = status;
        const saved = await this.withdrawalRepository.save(withdrawal);

        await this.notificationsService.create(
            withdrawal.user.id,
            NotificationCategory.WITHDRAWAL,
            status === WithdrawalStatus.COMPLETED ? 'Withdrawal completed' : 'Withdrawal failed',
            status === WithdrawalStatus.COMPLETED
                ? `Your withdrawal of ${withdrawal.amount} has been completed.`
                : `Your withdrawal of ${withdrawal.amount} failed and the funds have been returned to your wallet.`,
        );

        const { password, ...safeUser } = saved.user;
        return { ...saved, user: safeUser };
    }
}