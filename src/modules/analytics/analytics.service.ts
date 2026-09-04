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
        ])
    }
}