import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { LinksService } from './links.service';

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(private readonly linksService: LinksService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Redirect to original URL' })
  async redirect(@Param('code') code: string, @Res() res: Response) {
    const link = await this.linksService.resolveShortCode(code);
    return res.redirect(HttpStatus.FOUND, link.originalUrl); // 302 Found
  }
}