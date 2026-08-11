import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Links')
@ApiBearerAuth()
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a shortened link (associated with current user if logged in)' })
  @ApiResponse({ status: 201, description: 'Short link successfully created' })
  create(
    @Body() createLinkDto: CreateLinkDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.linksService.create(createLinkDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user links (User Dashboard)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findUserLinks(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.linksService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get link details by ID' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.linksService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update link settings' })
  update(
    @Param('id') id: string,
    @Body() updateLinkDto: UpdateLinkDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.linksService.update(id, updateLinkDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a shortened URL' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.linksService.remove(id, userId);
  }
}


// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
//   HttpCode,
//   HttpStatus,
// } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { LinksService } from './links.service';
// import { CreateLinkDto } from './dto/create-link.dto';
// import { UpdateLinkDto } from './dto/update-link.dto';

// @ApiTags('Links')
// @Controller('links')
// export class LinksController {
//   constructor(private readonly linksService: LinksService) {}


//   //incoming json is extracted by @Body() | converted into createLinkDto | whose type is CreateLinkDto
//   @Post()
//   @ApiOperation({ summary: 'Create a shortened URL' })
//   @ApiResponse({ status: 201, description: 'URL successfully shortened' })
//   create(@Body() createLinkDto: CreateLinkDto) {
//     return this.linksService.create(createLinkDto);
//   }

//   @Get()
//   @ApiOperation({ summary: 'Get all links' })
//   findAll() {
//     return this.linksService.findAll();
//   }

//   @Get(':id')
//   @ApiOperation({ summary: 'Get link details by ID' })
//   findOne(@Param('id') id: string) {
//     return this.linksService.findOne(id);
//   }

//   @Patch(':id')
//   @ApiOperation({ summary: 'Update link settings' })
//   update(@Param('id') id: string, @Body() updateLinkDto: UpdateLinkDto) {
//     return this.linksService.update(id, updateLinkDto);
//   }

//   @Delete(':id')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Delete a shortened URL' })
//   remove(@Param('id') id: string) {
//     return this.linksService.remove(id);
//   }
// }