import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from '@prisma/client';
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(configService: ConfigService) {
        const connectionString = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
        const adapter = new PrismaPg({ connectionString });

        super({adapter});
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Connected to PostgreSQL via Prisma');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Disconnected from PostgreSQL');
    }
}