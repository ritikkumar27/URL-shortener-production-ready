import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiPropertyOptional } from '@nestjs/swagger';
import { LinksService } from './links.service';
import { CreateLinkDto, UpdateLinkDto } from './dto/links.dto';

@ApiTags('Links')
@Controller('links')
export class LinksController {
    constructor (private readonly linksservice: LinksService) {}

    @Post()
    @ApiOperation({summary: 'Create a shortened link'})
    @ApiResponse({status: 201, description: 'Short link successfully creted'})
    create(@Body() dto: CreateLinkDto) {
        return this.linksservice.create(dto);
    }
}