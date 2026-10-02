import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/CreateUser.dto';
import { RefreshTokenDto } from 'src/auth/dto/RefreshToken.dto';
import { AuthService } from '../auth.service/auth.service';
import { LoginDto } from '../dto/login.dto/login.dto';
import { JwtAuthGuard } from '../jwt-auth.guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() dto: CreateUserDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh')
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshAccessToken(dto.refreshToken);
    }

    @Post('logout')
    logout(@Body() dto: RefreshTokenDto) {
        return this.authService.logout(dto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: any) {
        return this.authService.getCurrentUser(req.user.userId);
    }
}