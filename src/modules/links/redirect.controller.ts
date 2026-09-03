import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { LinksService } from './links.service';
import type {Response} from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';


@ApiTags('Redirect')
@Controller()
export class RedirectController {
    constructor(private readonly linksService: LinksService) {}

    @Get(':code')
    @ApiOperation({summary: 'Redirect to original URL'})
    async redirect(@Param('code') code:string, @Res() res: Response) {
        const link = await this.linksService.resolveShortCode(code);
        return res.redirect(HttpStatus.FOUND, link.originalUrl);
    }
}