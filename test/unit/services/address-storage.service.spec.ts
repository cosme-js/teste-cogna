import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AddressStorageService } from '@modules/address-storage/address-storage.service';
import { AddressStorage } from '@modules/address-storage/address-storage.entity';
import { CreateAddressStorageDto } from '@modules/address-storage/dto/create-address-storage.dto';
import { IDataProvider } from '@modules/address-storage/interfaces/data.provider.interface';

describe('AddressStorageService', () => {
  let service: AddressStorageService;
  let repo: jest.Mocked<Repository<AddressStorage>>;

  const mockDataProviderA: IDataProvider<CreateAddressStorageDto> = {
    getData: jest.fn(),
  };

  const mockDataProviderB: IDataProvider<CreateAddressStorageDto> = {
    getData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressStorageService,
        {
          provide: getRepositoryToken(AddressStorage),
          useValue: {
            existsBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: 'DATA_PROVIDERS_TOKEN',
          useValue: [mockDataProviderA, mockDataProviderB],
        },
      ],
    }).compile();

    service = module.get(AddressStorageService);
    repo = module.get(getRepositoryToken(AddressStorage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if zip_code exists', async () => {
      repo.existsBy.mockResolvedValue(true);

      await expect(
        service.create({
          zip_code: '12345',
          street: 'Street',
          neighborhood: 'Neighborhood',
          city: 'City',
          region: 'Region',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repo.existsBy).toHaveBeenCalledWith({ zip_code: '12345' });
    });

    it('should create and save a new address', async () => {
      repo.existsBy.mockResolvedValue(false);
      const createDto = {
        zip_code: '12345',
        street: 'Street',
        neighborhood: 'Neighborhood',
        city: 'City',
        region: 'Region',
      };
      repo.create.mockReturnValue(createDto as any);
      repo.save.mockResolvedValue({ id: '1', ...createDto } as any);

      const result = await service.create(createDto);

      expect(repo.existsBy).toHaveBeenCalledWith({ zip_code: '12345' });
      expect(repo.create).toHaveBeenCalledWith(createDto);
      expect(repo.save).toHaveBeenCalledWith(createDto);
      expect(result).toHaveProperty('id', '1');
    });
  });

  describe('getByZipCode', () => {
    it('should return existing address if found in DB', async () => {
      const existing = { id: '1', zip_code: '12345' } as any;
      repo.findOneBy.mockResolvedValue(existing);

      const result = await service.getByZipCode('12345');

      expect(repo.findOneBy).toHaveBeenCalledWith({ zip_code: '12345' });
      expect(result).toBe(existing);

      expect(mockDataProviderA.getData).not.toHaveBeenCalled();
      expect(mockDataProviderB.getData).not.toHaveBeenCalled();
    });

    it('should try data providers in order and create on first that returns data', async () => {
      repo.findOneBy.mockResolvedValue(null);

      const dataFromProvider = {
        zip_code: '12345',
        street: 'Street A',
        neighborhood: 'Neighborhood A',
        city: 'City A',
        region: 'Region A',
      };

      (mockDataProviderA.getData as jest.Mock).mockResolvedValue(null);
      (mockDataProviderB.getData as jest.Mock).mockResolvedValue(dataFromProvider);

      repo.existsBy.mockResolvedValue(false);
      repo.create.mockReturnValue(dataFromProvider as any);
      repo.save.mockResolvedValue({ id: '10', ...dataFromProvider } as any);

      const result = await service.getByZipCode('12345');

      expect(repo.findOneBy).toHaveBeenCalledWith({ zip_code: '12345' });
      expect(mockDataProviderA.getData).toHaveBeenCalledWith('12345');
      expect(mockDataProviderB.getData).toHaveBeenCalledWith('12345');

      expect(repo.existsBy).toHaveBeenCalledWith({ zip_code: '12345' });
      expect(repo.create).toHaveBeenCalledWith(dataFromProvider);
      expect(repo.save).toHaveBeenCalledWith(dataFromProvider);

      expect(result).toHaveProperty('id', '10');
    });

    it('should throw NotFoundException if no providers return data', async () => {
      repo.findOneBy.mockResolvedValue(null);

      (mockDataProviderA.getData as jest.Mock).mockResolvedValue(null);
      (mockDataProviderB.getData as jest.Mock).mockResolvedValue(null);

      await expect(service.getByZipCode('12345')).rejects.toThrow(NotFoundException);

      expect(mockDataProviderA.getData).toHaveBeenCalledWith('12345');
      expect(mockDataProviderB.getData).toHaveBeenCalledWith('12345');
    });
  });
});
