import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { LinksService } from './links.service';
import type {Response} from 'express';

@Controller()
export class RedirectController {
    constructor(private readonly linksService: LinksService) {}

    @Get(':code')
    async redirect(@Param('code') code:string, @Res() res: Response) {
        const link = await this.linksService.resolveShortCode(code);
        return res.redirect(HttpStatus.FOUND, link.originalUrl);
    }
}