import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/service/users/users.service';
import { AccountStatus } from 'src/users/entities/user.entity/user.entity';


export interface JwtPayload {
    sub: number;
    email: string;
    role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService, private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET') as string,
        });
    }

    // Whatever this returns becomes `req.user` in every guarded route. Runs
    // on every single authenticated request, so an admin suspending or
    // deleting a user takes effect immediately — the user's existing,
    // still-unexpired token stops working on their very next request,
    // rather than quietly continuing to work until it naturally expires.
    async validate(payload: JwtPayload) {
        const user = await this.usersService.getProfile(payload.sub);
        if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
            throw new UnauthorizedException('This account is no longer active.');
        }
        return { userId: payload.sub, id: payload.sub, email: payload.email, role: payload.role };
    }
}