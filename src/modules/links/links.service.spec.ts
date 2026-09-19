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



