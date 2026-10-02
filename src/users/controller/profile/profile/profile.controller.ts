import { Body, Controller, Delete, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UsersService } from 'src/users/service/users/users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard/jwt-auth.guard';
import { UpdateUserDto } from 'src/users/dto/UpdateUser.dto';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto/change-password.dto';
import { UpdateAvatarDto } from 'src/users/dto/change-avatar.dto/change-avatar.dto';

// Every route here acts on the CALLER's own account (req.user.userId, set
// by JwtStrategy from the token) — never on an :id from the URL. That's the
// difference from UsersController's admin-style /users/:id routes.
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(private userService: UsersService) {}

    @Get()
    getProfile(@Req() req: any) {
        return this.userService.getProfile(req.user.userId);
    }

    @Put()
    updateProfile(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateProfile(req.user.userId, updateUserDto);
    }

    @Put('avatar')
    updateAvatar(@Req() req: any, @Body() updateAvatarDto: UpdateAvatarDto) {
        return this.userService.updateProfile(req.user.userId, { avatar: updateAvatarDto.avatar });
    }

    @Put('password')
    changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
        return this.userService.changePassword(
            req.user.userId,
            changePasswordDto.currentPassword,
            changePasswordDto.newPassword,
        );
    }

    @Delete()
    deactivateAccount(@Req() req: any) {
        return this.userService.deactivateAccount(req.user.userId);
    }
}