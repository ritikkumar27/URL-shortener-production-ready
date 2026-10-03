import { Controller, Get, Param, Res,Req, HttpStatus, Post, Body, UnauthorizedException } from '@nestjs/common';
import { LinksService } from './links.service';
import type {Response, Request} from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from '../analytics/analytics.service';
import { Public } from '../../common/decorators/public.decorator';



@ApiTags('Redirect')
@Controller()
export class RedirectController {
    constructor(
        private readonly linksService: LinksService,
        private readonly analyticsService: AnalyticsService,
    
    ) {}

    @Public()
    @Get(':code')
    @ApiOperation({summary: 'Redirect to original URL'})
    async redirect(
        @Param('code') code:string, 
        @Res() res: Response,
        @Req() req: Request,

    
    ) {


            try {
        const link = await this.linksService.resolveShortCode(code);

        const ip = 
            (req.headers['cf-connecting-ip'] as string) ||
            (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
            req.ip ||
            req.socket.remoteAddress ||
            '127.0.0.1';

        const userAgent = req.headers['user-agent'] || 'Unknown';
        const referrer = req.headers['referer'] || req.headers['referrer'] as string || undefined;

        this.analyticsService.trackClick({
            linkId: link.id,
            ip,
            userAgent,
            referrer,
            timestamp: new Date().toISOString(),
        }).catch(() => {});
        
        return res.redirect(HttpStatus.FOUND, link.originalUrl);

    } catch (error) {
        if (error instanceof UnauthorizedException && error.message === 'Password required') {
            return res.status(HttpStatus.UNAUTHORIZED).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Password Required</title>
                    <style>
                        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f9fafb; margin: 0; }
                        .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                        input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; margin-right: 0.5rem; }
                        button { padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; }
                        button:hover { background: #2563eb; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Password Protected Link</h2>
                        <form method="POST" action="/${code}">
                            <input type="password" name="password" placeholder="Enter password" required />
                            <button type="submit">Submit</button>
                        </form>
                    </div>
                </body>
                </html>
            `);
        }
        throw error;
    }
        // const link = await this.linksService.resolveShortCode(code);

        // const ip = 
        //     (req.headers['cf-connecting-ip'] as string) ||
        //     (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        //     req.ip ||
        //     req.socket.remoteAddress ||
        //     '127.0.0.1';

        // const userAgent = req.headers['user-agent'] || 'Unknown';
        // const referrer = req.headers['referer'] || req.headers['referrer'] as string || undefined;


        // this.analyticsService.trackClick({
        //     linkId: link.id,
        //     ip,
        //     userAgent,
        //     referrer,
        //     timestamp: new Date().toISOString(),
        // }).catch(() => {});

        
        // return res.redirect(HttpStatus.FOUND, link.originalUrl);
    }


}