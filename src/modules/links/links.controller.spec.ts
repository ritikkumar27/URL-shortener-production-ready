import { Test, TestingModule } from '@nestjs/testing';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';


const mockLinksService = {
  create: jest.fn(),
  resolveShortCode: jest.fn(),
};


describe('LinksController', () => {
    let controller: LinksController;
  let service: typeof mockLinksService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinksController],
      providers: [
        {
          provide: LinksService,
          useValue: mockLinksService,
        },
      ],
    }).compile();
    controller = module.get<LinksController>(LinksController);
    service = module.get(LinksService);
    
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
})