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
import { ApiTags, ApiOperation, ApiResponse, ApiPropertyOptional, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LinksService } from './links.service';
import { CreateLinkDto, UpdateLinkDto } from './dto/links.dto';
import { CurrentUser, UserPayLoad } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Links')
@ApiBearerAuth()
@Controller('links')
export class LinksController {
    constructor (private readonly linksService: LinksService) {}

    @Post()
    @ApiOperation({summary: 'Create a shortened link'})
    @ApiResponse({status: 201, description: 'Short link successfully creted'})
    create(@Body() createLinkDto: CreateLinkDto,
            @CurrentUser('id') userId?: string,
        ) {
        return this.linksService.create(createLinkDto, userId);
    }

    @Get('/resolve/:code')
    @ApiOperation({summary: 'Resolve shortcode and get related data object'})
    resolveCode(@Param('code') code: string){
        return this.linksService.resolveShortCode(code);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get link details by ID' })
    findById(@Param('id') id: string,@CurrentUser('id') userId?: string) {
        return this.linksService.findOne(id, userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a link' })
    update(
        @Param('id') id: string, 
        @Body() updateLinkDto: UpdateLinkDto,
        @CurrentUser('id') userId: string,
    ){
        return this.linksService.update(id, updateLinkDto, userId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a link' })
    remove(@Param('id') id: string, @CurrentUser('id') userId: string){
        return this.linksService.remove(id, userId);
    }
}