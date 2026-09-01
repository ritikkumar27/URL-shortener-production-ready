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
    constructor (private readonly linksService: LinksService) {}

    @Post()
    @ApiOperation({summary: 'Create a shortened link'})
    @ApiResponse({status: 201, description: 'Short link successfully creted'})
    create(@Body() dto: CreateLinkDto) {
        return this.linksService.create(dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get link details by ID' })
    findById(@Param('id') id: string) {
        return this.linksService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a link' })
    update(@Param('id') id: string, @Body() dto: UpdateLinkDto){
        return this.linksService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a link' })
    remove(@Param('id') id: string){
        return this.linksService.remove(id);
    }
}