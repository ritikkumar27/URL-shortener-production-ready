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
}