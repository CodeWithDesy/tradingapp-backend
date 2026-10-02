import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { InvestmentsService } from 'src/investments/service/investments/investments.service';
import { CreateInvestmentDto } from 'src/investments/dto/CreateInvestment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard/jwt-auth.guard';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
    constructor(private investmentsService: InvestmentsService) {}

    @Get('plans')
    getPlans() {
        return this.investmentsService.getPlans();
    }

    @Get('plans/:id')
    getPlanById(@Param('id', ParseIntPipe) id: number) {
        return this.investmentsService.getPlanById(id);
    }

    @Post()
    createInvestment(@Req() req: any, @Body() createInvestmentDto: CreateInvestmentDto) {
        return this.investmentsService.createInvestment(req.user.userId, createInvestmentDto);
    }

    @Get()
    getUserInvestments(@Req() req: any) {
        return this.investmentsService.getUserInvestments(req.user.userId);
    }

    // Must come BEFORE @Get(':id') below — NestJS matches routes in
    // declaration order, so 'portfolio' would otherwise be swallowed as an
    // :id value and fail ParseIntPipe.
    @Get('portfolio')
    getPortfolioSummary(@Req() req: any) {
        return this.investmentsService.getPortfolioSummary(req.user.userId);
    }

    @Get(':id')
    getUserInvestmentById(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.investmentsService.getUserInvestmentById(req.user.userId, id);
    }
}