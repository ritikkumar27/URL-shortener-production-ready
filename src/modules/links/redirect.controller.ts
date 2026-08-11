import { Controller, Get, Param, Res, Req, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { LinksService } from './links.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(
    private readonly linksService: LinksService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Public() // Public access for short links
  @Get(':code')
  @ApiOperation({ summary: 'Redirect to original URL with async analytics tracking' })
  async redirect(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const link = await this.linksService.resolveShortCode(code);

    const ip =
      (req.headers['cf-connecting-ip'] as string) ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.ip ||
      '127.0.0.1';

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referrer = req.headers['referer'] || (req.headers['referrer'] as string | undefined);

    this.analyticsService.trackClick({
      linkId: link.id,
      ip,
      userAgent,
      referrer,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return res.redirect(HttpStatus.FOUND, link.originalUrl);
  }
}


// import { Controller, Get, Param, Res, Req, HttpStatus } from '@nestjs/common';
// import { ApiTags, ApiOperation } from '@nestjs/swagger';
// import type { Request, Response } from 'express';
// import { LinksService } from './links.service';
// import { AnalyticsService } from '../analytics/analytics.service';
// import { Public } from '../../common/decorators/public.decorator';

// @ApiTags('Redirect')
// @Controller()
// export class RedirectController {
//   constructor(
//     private readonly linksService: LinksService,
//     private readonly analyticsService: AnalyticsService,
//   ) {}

//   @Get(':code')
//   @ApiOperation({ summary: 'Redirect to original URL with async analytics tracking' })
//   async redirect(
//     @Param('code') code: string,
//     @Req() req: Request,
//     @Res() res: Response,
//   ) {

//     // resolbing short code
//     const link = await this.linksService.resolveShortCode(code);

//     // extracting metadata
//     const ip =
//       (req.headers['cf-connecting-ip'] as string) ||
//       (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
//       req.ip ||
//       req.socket.remoteAddress ||
//       '127.0.0.1';

//     const userAgent = req.headers['user-agent'] || 'Unknown';
//     const referrer = req.headers['referer'] || req.headers['referrer'] as string | undefined;


//     // dispatch analytics async manner
//     this.analyticsService.trackClick({
//       linkId: link.id,
//       ip,
//       userAgent,
//       referrer,
//       timestamp: new Date().toISOString(),
//     }).catch(() => {}); //prevent unhandled promise rejection

//     return res.redirect(HttpStatus.FOUND, link.originalUrl); // 302 Found
//   }
// }