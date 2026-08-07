import {
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

  async resolveShortCode(shortCode: string) {
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

    // Increment click counter asynchronously (In Phase 5, this will be handled via Redis + BullMQ Queue)
    this.prisma.link
      .update({
        where: { id: link.id },
        data: { clicksCount: { increment: 1 } },
      })
      .catch((err) => this.logger.error(`Failed to increment click count for ${link.id}:`, err));

    return link;
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

    return this.prisma.link.update({
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
}