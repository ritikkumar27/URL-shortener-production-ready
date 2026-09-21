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


  describe('create()', () => {
    it('should pass the DTO and UserId to LinksService.create() and return the result', async () => {
      const createDto = { originalUrl: 'https://github.com' };
      const mockUserId = 'user-123';
      
      const expectedResult = { id: '1', shortCode: 'git', originalUrl: 'https://github.com' };
      service.create.mockResolvedValue(expectedResult);
      const result = await controller.create(createDto, mockUserId);
      expect(result).toEqual(expectedResult);
      
      expect(service.create).toHaveBeenCalledWith(createDto, mockUserId);
    });
  });
})