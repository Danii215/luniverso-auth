import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
    let service: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PrismaService],
        }).compile();

        service = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should connect successfully', async () => {
        await expect(service.$connect()).resolves.not.toThrow();
    });

    it('should execute query', async () => {
        const result = await service.$queryRaw`SELECT 1`;

        expect(result).toBeDefined();
    });

    it('should disconnect successfully', async () => {
        await service.$connect();

        await expect(service.$disconnect()).resolves.not.toThrow();
    });
});
