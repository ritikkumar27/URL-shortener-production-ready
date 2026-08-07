import { Module } from '@nestjs/common';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { RedirectController } from './redirect.controller';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [LinksController, RedirectController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}