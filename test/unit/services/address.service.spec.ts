import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Address } from '@modules/address/address.entity';
import { AddressService } from '@modules/address/address.service';

describe('AddressService', () => {
  let service: AddressService;
  let repo: jest.Mocked<Repository<Address>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        {
          provide: getRepositoryToken(Address),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            merge: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AddressService);
    repo = module.get(getRepositoryToken(Address));
  });

  describe('create', () => {
    it('should create and save a new address', async () => {
      const dto = { zip_code: '12345', street: 'Street' } as any;
      const addressEntity = { id: '1', ...dto };

      repo.create.mockReturnValue(dto as any);
      repo.save.mockResolvedValue(addressEntity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(dto);
      expect(result).toBe(addressEntity);
    });
  });

  describe('getById', () => {
    it('should return address if found', async () => {
      const address = { id: '1', street: 'Street' } as any;
      repo.findOneBy.mockResolvedValue(address);

      const result = await service.getById('1');

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(result).toBe(address);
    });

    it('should throw NotFoundException if not found', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.getById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update address and return updated entity', async () => {
      const existing = { id: '1', street: 'Old Street' } as any;
      const updateData = { street: 'New Street' } as any;
      const merged = { ...existing, ...updateData };

      repo.findOneBy.mockResolvedValue(existing);
      repo.merge.mockReturnValue(merged);
      repo.update.mockResolvedValue(undefined as any);

      const result = await service.update('1', updateData);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(repo.merge).toHaveBeenCalledWith(existing, updateData);
      expect(repo.update).toHaveBeenCalledWith({ id: existing.id }, merged);
      expect(result).toBe(merged);
    });

    it('should throw NotFoundException if address not found', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('999', { street: 'New Street' } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw Error if update fails', async () => {
      const existing = { id: '1', street: 'Old Street' } as any;
      const updateData = { street: 'New Street' } as any;
      const merged = { ...existing, ...updateData };

      repo.findOneBy.mockResolvedValue(existing);
      repo.merge.mockReturnValue(merged);
      repo.update.mockRejectedValue(new Error('DB error'));

      await expect(service.update('1', updateData)).rejects.toThrow("Error when try update an existent address");
    });
  });
});
