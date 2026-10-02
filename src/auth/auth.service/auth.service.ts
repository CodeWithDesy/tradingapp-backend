import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from 'src/users/service/users/users.service';
import { CreateUserDto } from 'src/users/dto/CreateUser.dto';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { NotificationsService } from 'src/notifications/service/notifications/notifications.service';
import { NotificationCategory } from 'src/notifications/entities/notification.entity';
import { EmailService } from 'src/email/service/email/email.service';
import { LoginDto } from '../dto/login.dto/login.dto';
import { User, AccountStatus } from 'src/users/entities/user.entity/user.entity';

const REFRESH_TOKEN_BYTES = 40;
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>,
        private usersService: UsersService,
        private jwtService: JwtService,
        private notificationsService: NotificationsService,
        private emailService: EmailService,
    ) {}

    private sanitize(user: User) {
        const { password, ...safe } = user;
        return safe;
    }

    private signToken(user: User): string {
        return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    }

    private async issueRefreshToken(userId: number): Promise<string> {
        const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

        const refreshToken = this.refreshTokenRepository.create({
            tokenHash: hashToken(rawToken),
            expiresAt,
            revoked: false,
            user: { id: userId } as User,
        });
        await this.refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    async register(dto: CreateUserDto) {
        const user = await this.usersService.createUser(dto);
        const token = this.signToken(user);
        const refreshToken = await this.issueRefreshToken(user.id);

        await this.notificationsService.create(
            user.id,
            NotificationCategory.ACCOUNT,
            'Welcome to ProlificFX',
            'Your account has been created successfully.',
        );
        await this.emailService.sendWelcomeEmail(user.email, user.fullName);

        return { user: this.sanitize(user), token, refreshToken };
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email.toLowerCase());
        if (!user) {
            throw new HttpException('Invalid email or password.', HttpStatus.UNAUTHORIZED);
        }

        const matches = await bcrypt.compare(dto.password, user.password);
        if (!matches) {
            throw new HttpException('Invalid email or password.', HttpStatus.UNAUTHORIZED);
        }

        if (user.accountStatus !== AccountStatus.ACTIVE) {
            throw new HttpException('This account is not active. Contact support for assistance.', HttpStatus.FORBIDDEN);
        }

        const token = this.signToken(user);
        const refreshToken = await this.issueRefreshToken(user.id);

        return { user: this.sanitize(user), token, refreshToken };
    }

    async getCurrentUser(userId: number) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new HttpException('User not found.', HttpStatus.UNAUTHORIZED);
        }
        return this.sanitize(user);
    }

    async refreshAccessToken(rawRefreshToken: string) {
        const tokenHash = hashToken(rawRefreshToken);
        const stored = await this.refreshTokenRepository.findOne({
            where: { tokenHash },
            relations: { user: true },
        });

        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            throw new HttpException('Invalid or expired refresh token.', HttpStatus.UNAUTHORIZED);
        }

        stored.revoked = true;
        await this.refreshTokenRepository.save(stored);

        const token = this.signToken(stored.user);
        const refreshToken = await this.issueRefreshToken(stored.user.id);

        return { token, refreshToken };
    }

    async logout(rawRefreshToken: string) {
        const tokenHash = hashToken(rawRefreshToken);
        await this.refreshTokenRepository.update({ tokenHash }, { revoked: true });
        return { message: 'Logged out successfully' };
    }
}