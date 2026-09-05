import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { ANALYTICS_QUEUE, RECORD_CLICK_JOB, ClickEventPayload } from './analytics.constants';


@Injectable()
export class AnalyticsService {
    constructor(
        @InjectQueue(ANALYTICS_QUEUE) private readonly analyticsQueue: Queue,
        private readonly prismaService : PrismaService,
    ){}

    // clickevent pus
    async trackClick(payload: ClickEventPayload): Promise<void> {
        await this.analyticsQueue.add(RECORD_CLICK_JOB, payload, {
            removeOnComplete: 1000,
            removeOnFail: 5000,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        },
    )};

    async getLinkAnalytics(linkId: string) {
        const link = await this.prismaService.link.findUnique({
            where: {id: linkId},
            select: {
                id: true,
                shortCode: true,
                originalUrl: true,
                title: true,
                clicksCount: true,
                createdAt: true,
            }
        });

        if(!link){
            throw new NotFoundException('Link not found');
        }

        const [topCountries, topBrowsers, topDevices, topReferrers, uniqueVisitors] = await Promise.all([
            this.prismaService.click.groupBy({
                by: ['country'],
                where: {linkId},
                _count: {id: true},
                orderBy: {_count: {id: 'desc'}},
                take: 5,
            }),

            this.prismaService.click.groupBy({
                by: ['browser'],
                where: {linkId},
                _count: {id: true},
                orderBy: {_count: {id: 'desc'}},
                take: 5
,            }),

            this.prismaService.click.groupBy({
                by: ['device'],
                where: {linkId},
                _count: {id: true},
                orderBy: {_count: {id: 'desc'}},
                take: 5,
            }),

            this.prismaService.click.groupBy({
                by: ['referrer'],
                where: {linkId},
                _count: {id: true},
                orderBy: {_count: {id: 'desc'}},
                take: 5,

            }),

            this.prismaService.click.findMany({
                where: {linkId},
                distinct: ['ipHash'],
                select: {ipHash: true},
            }),
        ]);

        return {
            link,
            summary: {
                totalClicks: link.clicksCount,
                uniqueVisitors: uniqueVisitors.length,
            },
            topCountries: topCountries.map((c) => ({
                country: c.country, clicks: c._count.id
            })),
            topBrowsers: topBrowsers.map((b) => ({
                browser: b.browser, clicks: b._count.id,
            })),
            topDevices: topDevices.map((d) => ({
                device: d.device, clicks: d._count.id,
            })),
            topReferrers: topReferrers.map((r) => ({
                referrer: r.referrer, clicks: r._count.id
            })),
        };
    }

    // getting hourly/daily clicks counts for graph charting


    async getTimeSeriesAnalytics(linkId: string, days = 7){

        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        const clicks = await this.prismaService.click.findMany({
            where: {
                linkId,
                timestamp: {gte: sinceDate},
            },

            select: {timestamp: true},
            orderBy: {timestamp: 'asc'},
        });


        const dailyMap: Record<string, number> = {};
        for (let i = 0; i< days; i++){
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyMap[key] = 0;
        }

        clicks.forEach((c) => {
            const day = c.timestamp.toISOString().split('T')[0];
            if(dailyMap[day] !== undefined) {
                dailyMap[day]++;
            }
        });

        return Object.entries(dailyMap)
            .map(([date, clicks]) => ({date, clicks}))
            .sort((a,b) => a.date.localeCompare(b.date));



    }



}