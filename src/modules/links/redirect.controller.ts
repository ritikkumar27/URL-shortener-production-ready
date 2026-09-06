import { Controller, Get, Param, Res,Req, HttpStatus } from '@nestjs/common';
import { LinksService } from './links.service';
import type {Response, Request} from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from '../analytics/analytics.service';


@ApiTags('Redirect')
@Controller()
export class RedirectController {
    constructor(
        private readonly linksService: LinksService,
        private readonly analyticsService: AnalyticsService,
    
    ) {}

    @Get(':code')
    @ApiOperation({summary: 'Redirect to original URL'})
    async redirect(
        @Param('code') code:string, 
        @Res() res: Response,
        @Req() req: Request,

    
    ) {
        const link = await this.linksService.resolveShortCode(code);

        const ip = 
            (req.headers['cf-connecting-ip'] as string) ||
            (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
            req.ip ||
            req.socket.remoteAddress ||
            '127.0.0.1';



        return res.redirect(HttpStatus.FOUND, link.originalUrl);
    }


}