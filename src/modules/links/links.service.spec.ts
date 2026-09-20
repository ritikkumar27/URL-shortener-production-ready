import { Test, TestingModule } from '@nestjs/testing';
import { LinksService } from './links.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';


// creating fake version of dependencies

const mockPrismaService = {
    link: {
        findUnique: jest.fn(),
        create: jest.fn(),
    }
}

const mockRedisService = {
    setCachedLink: jest.fn(),
    getCachedLink: jest.fn(),
}


const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:3000')
}

describe('LinksService', () => {
    let service: LinksService;
    let prisma: typeof mockPrismaService;
    let redis: typeof mockRedisService;

    beforeEach(async () => {
        //mini nest js environment specifically for this test
        
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LinksService,
                {provide: PrismaService, useValue: mockPrismaService},
                {provide: RedisService, useValue: mockRedisService},
                {provide: ConfigService, useValue: mockConfigService},
            ],
        }).compile();

        // grabbing instances
        service = module.get<LinksService>(LinksService);
        prisma = module.get(PrismaService);
        redis = module.get(RedisService);


        // clring historuy of mock fxn before every test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });



    describe('create()', () => {
        it('should successfully create a new link with a custom code', async () => {
            const createDto = {
                originalUrl: 'https://google.com',
                customCode: 'my-custom-code',
            };


            const expectedLink = {
                id: '123',
                originalUrl: 'https://google.com/', 
                shortCode: 'my-custom-code',
                isActive: true,
                passwordHash: null,
                expiresAt: null
            };


            prisma.link.findUnique.mockResolvedValue(null); 

            prisma.link.create.mockResolvedValue(expectedLink);

            const result = await service.create(createDto);

            expect(result).toEqual(expectedLink);

            expect(prisma.link.findUnique).toHaveBeenCalledWith({
                where: { shortCode: 'my-custom-code' }
            });

            expect(redis.setCachedLink).toHaveBeenCalledWith('my-custom-code', {
                id: '123',
                originalUrl: 'https://google.com/',
                isActive: true,
                expiresAt: null,
                passwordHash: null,
            });

        });

        it('should throw ConflictException if custom code is already taken', async () => {
            const createDto = {
                originalUrl: 'https://google.com',
                customCode: 'existing-code',
            };
            
            prisma.link.findUnique.mockResolvedValue({ id: '456', shortCode: 'existing-code' });
            await expect(service.create(createDto)).rejects.toThrow(ConflictException);
            
            expect(prisma.link.create).not.toHaveBeenCalled();
            expect(redis.setCachedLink).not.toHaveBeenCalled();
        });

    });


    describe('resolveShortCode()', () => {
        it('should return from cache immediately on a Cache Hit', async () => {
            redis.getCachedLink.mockResolvedValue({
                id: '999',
                originalUrl: 'https://github.com',
                isActive: true,
                expiresAt: null,
            });


            const result = await service.resolveShortCode('my-code');

            expect(result.originalUrl).toBe('https://github.com');


            expect(prisma.link.findUnique).not.toHaveBeenCalled();
        });


        it('should query the database on a Cache Miss, and then save to cache', async () => {

            redis.getCachedLink.mockResolvedValue(null);

            prisma.link.findUnique.mockResolvedValue({
                id: '888',
                originalUrl: 'https://nestjs.com',
                shortCode: 'nest-code',
                isActive: true,
                passwordHash: null,
                expiresAt: null,
            });

            const result = await service.resolveShortCode('nest-code');

            expect(result.originalUrl).toBe('https://nestjs.com');
            

            expect(prisma.link.findUnique).toHaveBeenCalledWith({
                where: { shortCode: 'nest-code' }
            });
            

            expect(redis.setCachedLink).toHaveBeenCalledWith('nest-code', expect.any(Object));
        });

    });

   
});

