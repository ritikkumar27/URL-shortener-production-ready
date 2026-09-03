import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from 'ioredis';

export interface CachedLink {
    id: string;
    originalUrl: string;
    isActive: boolean;
    expiresAt: string | null;
    passwordHash: string | null;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);

    private client!: Redis;
    //! means we are telling TS that this property will be initialised before it is used.
    //it will be initialised on lifecycle hook OnModuleInit

    private readonly DEFAULT_LINK_TTL = 60*24*24;

    constructor(private readonly configService: ConfigService) {}

    onModuleInit() {
        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);
        const password = this.configService.get<string>('REDIS_PASSWORD');

        this.client = new Redis({
            host: host,
            port: port,
            password: password || undefined,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times*50, 2000),

        });

        this.client.on('connect', () => this.logger.log('Connected to Redis'));
        this.client.on('error', (err) => this.logger.log('Redis error:', err));

        return this.client.connect();
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
            this.logger.log('Disconnected from Redis');
        }
    }

    getClient(): Redis {
        return this.client;
    }

    // caching helpers

    private formatLinkKey(shortCode: string): string {
        return `link:code:${shortCode}`;
    }

    async getCachedLink(shortCode: string): Promise<CachedLink | null> {

        try {
            const data = await this.client.get(this.formatLinkKey(shortCode));
            if (!data) return null; //cache miss
            return JSON.parse(data) as CachedLink; //cache hit
            
        } catch (err) {
            this.logger.warn(`Failed to read cache for '${shortCode}':`, err);
            return null;
        }

    }


    async setCachedLink(shortCode: string, link: CachedLink, ttlSeconds = this.DEFAULT_LINK_TTL): Promise<void>{
        try {
            const key = this.formatLinkKey(shortCode);
            await this.client.set(key, JSON.stringify(link), 'EX', ttlSeconds);

        }catch (err) {
            this.logger.warn(`Failed to cache link '${shortCode}', err`);

        }
    }

    async invalidateCachedLink(shortCode: string) {
        try {
            await this.client.del(this.formatLinkKey(shortCode));
            this.logger.debug(`Cache invalidated for shortCode: ${shortCode}`);

        }catch (err) {
            this.logger.warn(`Failed to invalidate cache for '${shortCode}':`, err);

        }
    }




    


}