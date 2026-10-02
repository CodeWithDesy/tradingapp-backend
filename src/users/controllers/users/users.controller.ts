import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CreateUserDto } from 'src/users/dto/CreateUser.dto';

import { UpdateUserDto } from 'src/users/dto/UpdateUser.dto';
import { UsersService } from 'src/users/service/users/users.service';

@Controller('users')
export class UsersController {
    constructor(private userService: UsersService) {}
    
    @Get()
    getUsers() {
        return this.userService.fetchUsers();
    }

    @Post()
    @UsePipes(new ValidationPipe())
    async createUser(@Body() createUserDto: CreateUserDto) {
       await this.userService.createUser(createUserDto);
        return {message: 'User created successfully'};
    }

    @Put(':id')
    async updateUserById(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
       await this.userService.updateUser(id, updateUserDto);
        return {message: 'User updated successfully'};
    }

    @Delete(':id')
    async deleteUserById(@Param('id', ParseIntPipe) id: number) {
        await this.userService.deleteUser(id);
        return {message: 'User deleted successfully'};
    }
    }
