import {Controller, Get, Param, Query} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiQuery, ApiBearerAuth} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {CurrentUser} from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('api/v1/analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get(':linkId')
    @ApiOperation({summary: 'Get summary analytics for a link'})
    getAnalytics(@Param('linkId') linkId: string, @CurrentUser('id') userId: string){
        return this.analyticsService.getLinkAnalytics(linkId, userId);
    }

    @Get(':linkId/timeseries')
    @ApiOperation({summary: 'Get time-series click data for graphs'})
    @ApiQuery({name: 'days', required: false, type: Number, description: 'Number of past days (default: 7)'})
    getTimeSeries(@Param('linkId') linkId: string,@CurrentUser('id') userId: string, @Query('days') days?: number){
        return this.analyticsService.getTimeSeriesAnalytics(linkId,userId, days ? Number(days) : 7);

    }
}