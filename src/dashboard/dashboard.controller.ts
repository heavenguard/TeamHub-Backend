import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get Stats',
  })
  getDashboard(@Req() req: any) {
    return this.dashboardService.getDashboard(req.user.id);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Get dashboard data for current user',
  })
  findMyDashboard(@Req() req: any) {
    return this.dashboardService.findMyDashboard(req.user.id);
  }
}
