import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
    InternalServerErrorException,
    GoneException
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateLinkDto } from './dto/links.dto';
import { UpdateLinkDto } from './dto/links.dto';
import { generateShortCode } from '../../utils/base62.util';
import { validateTargetUrl } from '../../utils/url-validator';
import * as crypto from 'crypto';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);
  private readonly baseUrl : string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000')
  }

  // functuin i will use to create new entry in database and warm my cache with newly created DB entry
  async create(dto: CreateLinkDto, userId?: string) {
    const validatedUrl = validateTargetUrl(dto.originalUrl);

    let shortCode: string;

    if (dto.customCode) {
      const existing = await this.prisma.link.findUnique({
        where: { shortCode: dto.customCode },
      });

      if (existing) {
        throw new ConflictException(
          `Custom alias '${dto.customCode}' is already taken`,
        );
      }

      shortCode = dto.customCode;
    } else {
      shortCode = await this.generateUniqueShortCode();
    }

    let passwordHash: string | null = null;
    if (dto.password) {
      passwordHash = crypto
        .createHash('sha256')
        .update(dto.password)
        .digest('hex');
    }

    const link = await this.prisma.link.create({
      data: {
        userId: userId ?? null,
        shortCode,
        originalUrl: validatedUrl,
        title: dto.title ?? null,
        description: dto.description ?? null,
        expiresAt: dto.expiresAt ?? null,
        passwordHash: passwordHash,
      },
    });

    await this.redisService.setCachedLink(link.shortCode, {
      id: link.id,
      originalUrl: link.originalUrl,
      isActive: link.isActive,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      passwordHash: link.passwordHash,
    });

    return link;
  }

  // function i will use for getting the original url from shortcode
  async resolveShortCode(shortCode: string): Promise<{originalUrl: string, id: string}> {
    
    const cached = await this.redisService.getCachedLink(shortCode);

    //cache hit
    if (cached) {
      this.logger.debug(`Cache hit for '${shortCode}'`);

      if (!cached.isActive) {
        throw new GoneException('This short URL has been deactivated');
      }

      if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
        await this.redisService.invalidateCachedLink(shortCode);
        throw new GoneException('This short URL has expired');
      }

      this.logger.debug(`Cache HIT success for '${shortCode}'`);
      return { originalUrl: cached.originalUrl, id: cached.id };
    }

    //cache miss
    this.logger.debug(`Cache miss for '${shortCode}'`);
    this.logger.debug(`Querying Database for shortCode`);

    const link = await this.prisma.link.findUnique({
      where: { shortCode: shortCode },
    });

    if (!link) {
      throw new NotFoundException(`Short Link '${shortCode}' not found`);
    }

    if (!link.isActive) {
      throw new GoneException('This short URL has been deactivated');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new GoneException('This short URL has expired');
    }

    await this.redisService.setCachedLink(link.shortCode, {
      id: link.id,
      originalUrl: link.originalUrl,
      isActive: link.isActive,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      passwordHash: link.passwordHash,
    });

    return { originalUrl: link.originalUrl, id: link.id };
  }


  //function to use when updating entry details, after updating always it invalidates the cached data of older link
  async update(id: string, dto: UpdateLinkDto, userId?: string) {
    const link = await this.prisma.link.findFirst({
        where: {
            id,
            ...(userId ? {userId} : {}),
        },
    });

    if(!link){
        throw new NotFoundException('Link Not Found');
    }

    const updated = await this.prisma.link.update({
        where: {id},
        data: {
            ...(dto.title !== undefined && {title: dto.title}),
            ...(dto.description !== undefined && {description: dto.description}),
            ...(dto.isActive !== undefined && {isActive: dto.isActive}),
            ...(dto.expiresAt !== undefined && {
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            }),
        },
    });

    await this.redisService.invalidateCachedLink(link.shortCode);
    return updated;
  }

  async findOne(id: string, userId?: string){
    const link = await this.prisma.link.findFirst({
        where: {
            id,
            ...(userId ? {userId} : {}),
        },
    });

    if(!link){
        throw new NotFoundException('Link not found');
    }

    return {
        ...link,
        shortUrl: `${link.shortCode}`,
    };
  }

  async findAll(userId?: string){
    const links = await this.prisma.link.findMany({
        where: userId ? {userId} : {},
        orderBy: {createdAt: 'desc'},
    });

    return links.map((link) => ({
        ...link,
        shortUrl: `${link.shortCode}`,
    }));

  }

  async remove(id: string, userId?: string) {
    const link = await this.prisma.link.findFirst({
        where: {
            id,
            ...(userId ? {userId} : {}),
        },
    });

    if(!link){
        throw new NotFoundException('Link not found');
    }

    await this.prisma.link.delete({where: {id}});

    await this.redisService.invalidateCachedLink(link.shortCode);

    return {message: 'Link successfully deleted'};
    
  }


  private async generateUniqueShortCode(maxRetries = 5): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = generateShortCode(6);
      const existing = await this.prisma.link.findUnique({
        where: { shortCode: code },
        select: { id: true },
      });

      if (!existing) {
        return code;
      }
      this.logger.warn(
        `Collison detected for code '${code}', retrying (attempt ${attempt + 1}/${maxRetries})`,
      );
    }
    throw new InternalServerErrorException(
      'Failed to generate a unique short code. Please retry.',
    );
  }
}