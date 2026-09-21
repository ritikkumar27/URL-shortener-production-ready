import { Test, TestingModule } from '@nestjs/testing';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';


const mockLinksService = {
  create: jest.fn(),
  resolveShortCode: jest.fn(),
};