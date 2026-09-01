import {
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

}