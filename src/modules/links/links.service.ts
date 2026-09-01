import {
<<<<<<< HEAD
  Injectable,
  ConflictException,
  NotFoundException,
  GoneException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Base62 } from '../../common/utils/base62.util';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { RedisService, CachedLink } from 'src/redis/redis.service';


@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
  }

  async create(dto: CreateLinkDto, userId?: string) {
    let shortCode = dto.customAlias;

    if (shortCode) {
      if (Base62.isReserved(shortCode)) {
        throw new BadRequestException(`The alias '${shortCode}' is a reserved system keyword`);
      }

      const existing = await this.prisma.link.findUnique({
        where: { shortCode },
      });

      if (existing) {
        throw new ConflictException(`The alias '${shortCode}' is already in use`);
      }
    } else {
      // Auto-generate Base62 code with retry mechanism for collision safety
      shortCode = await this.generateUniqueShortCode();
    }

    const link = await this.prisma.link.create({
      data: {
        shortCode,
        originalUrl: dto.originalUrl,
        title: dto.title,
        description: dto.description,
        userId: userId ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    // adding created entry into my redis cache
    await this.redisService.setCachedLink(link.shortCode, {
      id: link.id,
      originalUrl: link.originalUrl,
      isActive: link.isActive,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      passwordHash: link.passwordHash,

    });

    return {
      ...link,
      shortUrl: `${this.baseUrl}/${link.shortCode}`,
    };
  }

  async resolveShortCode(shortCode: string): Promise<{originalUrl: string; id: string}> {

    // Cache HIT
    const cached = await this.redisService.getCachedLink(shortCode);
    if(cached){
      if(!cached.isActive){
        throw new GoneException('This short URL has been deactivated');
      }

      if (cached.expiresAt && new Date(cached.expiresAt) < new Date()){
        await this.redisService.invalidateCachedLink(shortCode);
        throw new GoneException('This short URL has expired');
      }

      this.logger.debug(`Cache HIT for '${shortCode}'`);
      return { originalUrl: cached.originalUrl, id: cached.id};
    }

    // Cache MISS
    this.logger.debug(`Cache MISS for '${shortCode}', querying PostgreSQL`);

    const link = await this.prisma.link.findUnique({
      where: { shortCode },
    });

    if (!link) {
      throw new NotFoundException('Short URL not found');
    }

    if (!link.isActive) {
      throw new GoneException('This short URL has been deactivated');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new GoneException('This short URL has expired');
    }

    // populate redis cache for subsequent requests
    await this.redisService.setCachedLink(link.shortCode, {
      id: link.id,
      originalUrl: link.originalUrl,
      isActive: link.isActive,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      passwordHash: link.passwordHash,
    });

    return {originalUrl: link.originalUrl, id: link.id};
  }

  async findOne(id: string, userId?: string) {
    const link = await this.prisma.link.findFirst({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    return {
      ...link,
      shortUrl: `${this.baseUrl}/${link.shortCode}`,
    };
  }

  async findAll(userId?: string) {
    const links = await this.prisma.link.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });

    return links.map((link) => ({
      ...link,
      shortUrl: `${this.baseUrl}/${link.shortCode}`,
    }));
  }

  async update(id: string, dto: UpdateLinkDto, userId?: string) {
    const link = await this.prisma.link.findFirst({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    const updated = await this.prisma.link.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
      },
    });

    //invalidating redis cache 
    await this.redisService.invalidateCachedLink(link.shortCode);
    return updated;
  }

  async remove(id: string, userId?: string) {
    const link = await this.prisma.link.findFirst({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.prisma.link.delete({ where: { id } });

    //invalidate redis cache
    await this.redisService.invalidateCachedLink(link.shortCode);

    return { message: 'Link successfully deleted' };
  }

  private async generateUniqueShortCode(maxRetries = 5): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = Base62.generate(6);

      if (Base62.isReserved(code)) continue;

      const existing = await this.prisma.link.findUnique({
        where: { shortCode: code },
      });

      if (!existing) {
        return code;
      }
    }

    // Fallback: 8 characters if collisions happen
    return Base62.generate(8);
  }
=======
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
    InternalServerErrorException
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateLinkDto } from './dto/links.dto';
import { UpdateLinkDto } from './dto/links.dto';
import { generateShortCode } from '../../utils/base62.util';
import { validateTargetUrl } from '../../utils/url-validator';
import * as crypto from 'crypto';

@Injectable()
export class LinksService {
    private readonly logger = new Logger(LinksService.name);

    constructor(private readonly prisma: PrismaService){}

    async create(dto: CreateLinkDto, userId?: string ) {
        const validatedUrl = validateTargetUrl(dto.originalUrl);

        let shortCode: string;

        if (dto.customCode){
            const existing = await this.prisma.link.findUnique({
                where: {shortCode: dto.customCode}
            });

            if(existing) {
                throw new ConflictException(`Custom alias '${dto.customCode}' is already taken`);
            }

            shortCode = dto.customCode;
        } else {
            shortCode = await this.generateUniqueShortCode();
        }

        let passwordHash: string | null = null;
        if(dto.password){
            passwordHash = crypto.createHash('sha256').update(dto.password).digest('hex');
        }

        const link = await this.prisma.link.create({
            data: {
                userId: userId ?? null,
                shortCode,
                originalUrl: validatedUrl,
                title: dto.title ?? null,
                description: dto.description ?? null,
                expiresAt: dto.expiresAt ?? null,
                passwordHash: passwordHash
            },
        });

        return link;
    }

    async findById(id: string){
        const link = await this.prisma.link.findUnique({
            where: {id: id},
            include: {
                _count: {
                    select: {clicks: true},
                },
            },
        });

        if(!link){
            throw new NotFoundException(`Link with ID ${id} not found`);
        }

        return link;
    }

    async findByShortCode(shortCode: string){
        const link = await this.prisma.link.findUnique({
            where: {shortCode: shortCode},
        });

        if(!link){
            throw new NotFoundException(`Short Link '${shortCode}' not found`);
        }

        return link;
    }

    async update(id: string, dto: UpdateLinkDto){
        const link = await this.findById(id);

        let originalUrl = link.originalUrl;

        if (dto.originalUrl) {
            originalUrl = validateTargetUrl(dto.originalUrl);
        }

        return this.prisma.link.update({
            where: {id: id},
            data: {
                ...dto,
                originalUrl,
            },
        });
    }

    async remove(id: string){
        await this.findById(id);
        return this.prisma.link.delete({
            where: {id: id},
        });
    }

    private async generateUniqueShortCode(maxRetries = 5): Promise<string> {

        for (let attempt = 0; attempt < maxRetries; attempt++){
            const code = generateShortCode(6);
            const existing = await this.prisma.link.findUnique({
                where: {shortCode: code},
                select: {id: true}
            });

            if (!existing) {
                return code;
            }
            this.logger.warn(`Collison detected for code '${code}', retrying (attempt ${attempt + 1}/${maxRetries})`);
        }
        throw new InternalServerErrorException('Failed to generate a unique short code. Please retry.');

    }

>>>>>>> fresh
}