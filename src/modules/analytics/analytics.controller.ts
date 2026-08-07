import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController{
    constructor(private readonly analyticsService: AnalyticsService){}

    @Get(':linkId')
    @ApiOperation({summary: 'Get summary analytics for a link'})
    getAnalytics(@Param('linkId') linkId: string){
        return this.analyticsService.getLinkAnalytics(linkId);
    }

    @Get(':linkId/timeseries')
    @ApiOperation({summary: 'Get time-series click data for graphs'})
    @ApiQuery({name: 'days', required: false, type: Number, description: 'Number of past days(default: 7)'})
    getTimeSeries(@Param('linkId') linkId: string, @Query('days') days?: number){
        return this.analyticsService.getTimeSeriesAnalytics(linkId, days ? Number(days) : 7);
    }
}