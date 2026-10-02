import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountStatus, User } from 'src/users/entities/user.entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserParams, UpdateUserParams } from 'utils/types';
import * as bcrypt from 'bcrypt';
import { BankingService } from 'src/banking/service/banking/banking.service';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        private bankingService: BankingService,
    ) {}

    private sanitize(user: User) {
        const { password, ...safe } = user;
        return safe;
    }

    async fetchUsers() {
        const users = await this.usersRepository.find();
        return users.map((user) => this.sanitize(user));
    }

    findById(id: number) {
        return this.usersRepository.findOneBy({ id });
    }

    findByEmail(email: string) {
        return this.usersRepository.findOneBy({ email });
    }

    async createUser(userDetails: CreateUserParams) {
        const existing = await this.findByEmail(userDetails.email.toLowerCase());
        if (existing) {
            throw new HttpException(
                'An account with this email already exists.',
                HttpStatus.CONFLICT
            );
        }

        const hashedPassword = await bcrypt.hash(userDetails.password, SALT_ROUNDS);
        const newUser = this.usersRepository.create({
            ...userDetails,
            email: userDetails.email.toLowerCase(),
            password: hashedPassword,
        });
        const savedUser = await this.usersRepository.save(newUser);
        await this.bankingService.createWalletForUser(savedUser);
        return savedUser;
    }

    async updateUser(id: number, updateUserDetails: UpdateUserParams) {
        const user = await this.findById(id);
        if (!user) {
            throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
        }
        return this.usersRepository.update(id, { ...updateUserDetails });
    }

    async deleteUser(id: number) {
        const user = await this.findById(id);
        if (!user) {
            throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
        }
        return this.usersRepository.delete(id);
    }

    async getProfile(id: number) {
        const user = await this.findById(id);
        if (!user) {
            throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
        }
        return this.sanitize(user);
    }

    async updateProfile(id: number, updateProfileDetails: UpdateUserParams) {
        await this.updateUser(id, updateProfileDetails);
        return this.getProfile(id);
    }

    async changePassword(id: number, currentPassword: string, newPassword: string) {
        const user = await this.findById(id);
        if (!user) {
            throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
        }

        const matches = await bcrypt.compare(currentPassword, user.password);
        if (!matches) {
            throw new HttpException('Current password is incorrect.', HttpStatus.UNAUTHORIZED);
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await this.usersRepository.update(id, { password: hashedPassword });
        return { message: 'Password updated successfully' };
    }

    async deactivateAccount(id: number) {
        const user = await this.findById(id);
        if (!user) {
            throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
        }
        await this.usersRepository.update(id, { accountStatus: AccountStatus.DELETED });
        return { message: 'Account deactivated successfully' };
    }

    async updateAccountStatus(id: number, status: AccountStatus) {
        const user = await this.findById(id);
        if (!user) {
            throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
        }
        await this.usersRepository.update(id, { accountStatus: status });
        return this.getProfile(id);
    }
}