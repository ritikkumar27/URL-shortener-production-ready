import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ANALYTICS_QUEUE } from "./analytics.constants";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsProcessor } from "./analytics.processor";
import { AnalyticsController } from "./analytics.controller";

@Module({
    imports: [
        BullModule.registerQueue({
            name: ANALYTICS_QUEUE,
        }),
    ],

    controllers: [AnalyticsController],
    providers: [AnalyticsService, AnalyticsProcessor],
    exports: [AnalyticsService],
})
export class AnalyticsModule {}