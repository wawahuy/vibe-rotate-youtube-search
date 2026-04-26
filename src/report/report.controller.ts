import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';

@ApiTags('report')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard summary stats' })
  dashboard() {
    return this.reportService.getDashboardStats();
  }

  @Get('usage')
  @ApiOperation({ summary: 'Paginated usage logs' })
  usage(@Query() query: ReportQueryDto) {
    return this.reportService.getUsageLogs(query);
  }

  @Get('usage/time')
  @ApiOperation({ summary: 'Requests grouped by day' })
  usageByTime(@Query() query: ReportQueryDto) {
    return this.reportService.getUsageByTime(query);
  }

  @Get('provider')
  @ApiOperation({ summary: 'Requests grouped by provider' })
  provider(@Query() query: ReportQueryDto) {
    return this.reportService.getProviderStats(query);
  }

  @Get('user')
  @ApiOperation({ summary: 'Top user API key usage' })
  user(@Query() query: ReportQueryDto) {
    return this.reportService.getUserStats(query);
  }
}
