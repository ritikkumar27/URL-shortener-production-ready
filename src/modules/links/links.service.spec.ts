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
    })

})

