import {Processor, WorkerHost} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {Job} from 'bullmq';
import {UAParser} from 'ua-parser-js';
import { PrismaService } from '../../database/prisma.service';
import { ANALYTICS_QUEUE, RECORD_CLICK_JOB, ClickEventPayload } from './analytics.constants';
import * as geoip from 'geoip-lite';
import * as crypto from 'crypto';

@Processor(ANALYTICS_QUEUE)
export class AnalyticsProcessor extends WorkerHost {

    private readonly logger = new Logger(AnalyticsProcessor.name);
    private readonly ipSalt: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        super();
        this.ipSalt = this.configService.get<string>('IP_HASH_SALT)', 'default_salt');
    }

    async process(job: Job<ClickEventPayload>): Promise<void> {
        if(job.name !== RECORD_CLICK_JOB) return;

        const {linkId, ip, userAgent, referrer, timestamp} = job.data;

        try {
            const ipHash = crypto
                .createHash('sha256')
                .update(`${ip}:${this.ipSalt}`)
                .digest('hex');

            // Usr Agent parsing
            const parser = new UAParser(userAgent);
            const browser = parser.getBrowser().name || 'Unknown';
            const os = parser.getOS().name || 'Unknown';
            const deviceType = parser.getDevice().type || 'Desktop';

            //geoip
            const geo = geoip.lookup(ip);
            const country = geo?.country || 'Unknown';
            const city = geo?.city || 'Unkniwn';

            let cleanedReferrer: string | null = null;
            if(referrer) {
                try{
                    const refUrl = new URL(referrer);
                    cleanedReferrer = refUrl.hostname;
                }catch{
                    cleanedReferrer = referrer.slice(0,100);
                }
            }

            await this.prisma.$transaction([
                this.prisma.click.create({
                    data: {
                        linkId,
                        ipHash,
                        country,
                        city,
                        browser,
                        os,
                        device: deviceType,
                        referrer : cleanedReferrer,
                        timestamp: new Date(timestamp),
                    },
                }),
                this.prisma.link.update({
                    where: {id: linkId},
                    data: {clicksCount: {increment: 1}},
                }),
            ]);

            this.logger.debug(`Click recorded for linkId: ${linkId} [${country} / ${browser} / ${deviceType}]`);


        }catch (err) {
            this.logger.error(`Failed to process click analytics for link ${linkId}:`, err);
            throw err;

        }
    }

}