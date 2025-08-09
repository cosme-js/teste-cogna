import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AddressStorageService } from '@modules/address-storage/address-storage.service';
import { AddressService } from '@modules/address/address.service';
import { PasswordHelper } from '@helpers/password.helper';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from '@modules/users/user.service';
import { User } from '@modules/users/user.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let addressStorageService: jest.Mocked<AddressStorageService>;
  let addressService: jest.Mocked<AddressService>;
  let passwordHelper: jest.Mocked<PasswordHelper>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            existsBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findOneBy: jest.fn(),
            merge: jest.fn(),
          },
        },
        {
          provide: AddressStorageService,
          useValue: {
            getByZipCode: jest.fn(),
            create: jest.fn(),
            getFromServer: jest.fn()
          },
        },
        {
          provide: AddressService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: PasswordHelper,
          useValue: {
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    addressStorageService = module.get(AddressStorageService);
    addressService = module.get(AddressService);
    passwordHelper = module.get(PasswordHelper);
  });

  describe('create', () => {
    it('should throw ConflictException if user already exists', async () => {
      userRepository.existsBy.mockResolvedValue(true);
      await expect(service.create({ email: 'a@b.com', zipCode: '12345', password: '123', name: 'Test' } as any))
        .rejects.toThrow(ConflictException);
      expect(userRepository.existsBy).toHaveBeenCalledWith({ email: 'a@b.com' });
    });

    it('should create user successfully', async () => {
      userRepository.existsBy.mockResolvedValue(false);
      addressStorageService.getByZipCode.mockResolvedValue({ street: 'Test St', city: 'Test City' } as any);
      addressService.create.mockResolvedValue({ id: 'addr1' } as any);
      passwordHelper.hashPassword.mockResolvedValue('hashedpass');
      userRepository.create.mockImplementation(data => data as any);
      userRepository.save.mockImplementation((async user => ({ ...user, id: 'user1', role: 'user', password: 'hashedpass' })) as any);

      const result = await service.create({ email: 'a@b.com', zipCode: '12345', password: '123', name: 'Test' } as any);

      expect(userRepository.existsBy).toHaveBeenCalledWith({ email: 'a@b.com' });
      expect(addressStorageService.getByZipCode).toHaveBeenCalledWith('12345');
      expect(addressService.create).toHaveBeenCalled();
      expect(passwordHelper.hashPassword).toHaveBeenCalledWith('123');
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('role');
      expect(result.id).toBe('user1');
    });
  });

  describe('getAll', () => {
    it('should return paginated users', async () => {
      const users = [{ id: '1' } as User];
      userRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.getAll({ page: 1, limit: 10 });
      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['address'],
        skip: 0,
        take: 10,
        order: { id: 'ASC' },
      });
      expect(result).toEqual({
        data: users,
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should return paginated users without pass pagination', async () => {
      const users = [{ id: '1' } as User];
      userRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.getAll();
      expect(result).toEqual({
        data: users,
        total: 1,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getById', () => {
    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.getById('id1')).rejects.toThrow(NotFoundException);
    });

    it('should return user if found', async () => {
      const user = { id: 'id1' } as User;
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getById('id1');
      expect(result).toBe(user);
    });
  });

  describe('getByEmail', () => {
    it('should return user by email', async () => {
      const user = { email: 'a@b.com' } as User;
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getByEmail('a@b.com');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
        select: ['password', 'name', 'id', 'email', 'created_at', 'role'],
      });
      expect(result).toBe(user);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.update('id1', { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new email already exists', async () => {
      const user = { id: 'id1', email: 'old@b.com', address: { zip_code: '12345' } } as any;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.existsBy.mockResolvedValue(true);
      await expect(service.update('id1', { email: 'new@b.com' })).rejects.toThrow(ConflictException);
    });

    it('should update address if zipCode changed', async () => {
      const user = { id: 'id1', email: 'old@b.com', address: { zip_code: '12345' } } as any;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.existsBy.mockResolvedValue(false);
      addressStorageService.getByZipCode.mockResolvedValue({ street: 'Test St' } as any);
      addressService.create.mockResolvedValue({ id: 'addr1' } as any);
      userRepository.merge.mockReturnValue(user);
      userRepository.update.mockResolvedValue(undefined as any);

      const result = await service.update('id1', { zipCode: '54321', name: 'New Name' });
      expect(addressStorageService.getByZipCode).toHaveBeenCalledWith('54321');
      expect(addressService.create).toHaveBeenCalled();
      expect(userRepository.merge).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should update email if different and no conflict', async () => {
      const user = { id: 'id1', email: 'old@b.com', address: { zip_code: '12345' } } as any;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.existsBy.mockResolvedValue(false);
      userRepository.merge.mockReturnValue(user);
      userRepository.update.mockResolvedValue(undefined as any);

      const result = await service.update('id1', { email: 'new@b.com' });
      expect(user.email).toBe('new@b.com');
      expect(userRepository.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should delete password field if present in update data', async () => {
      const user = { id: 'id1', email: 'old@b.com', address: { zip_code: '12345' } } as any;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.existsBy.mockResolvedValue(false);
      userRepository.merge.mockReturnValue(user);
      userRepository.update.mockResolvedValue(undefined as any);

      const data = { password: '123', name: 'New' };
      await service.update('id1', data as any);
      expect(data).not.toHaveProperty('password');
    });
  });

  describe('updatePassword', () => {
    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.updatePassword('id1', { oldPassword: 'old', newPassword: 'new' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if old password does not match', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'id1', password: 'hashed' } as any);
      passwordHelper.comparePassword.mockResolvedValue(false);

      await expect(service.updatePassword('id1', { oldPassword: 'wrong', newPassword: 'new' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should update password if old password matches', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'id1', password: 'hashed' } as any);
      passwordHelper.comparePassword.mockResolvedValue(true);
      passwordHelper.hashPassword.mockResolvedValue('newhashed');
      userRepository.update.mockResolvedValue(undefined as any);

      await service.updatePassword('id1', { oldPassword: 'old', newPassword: 'new' });
      expect(passwordHelper.comparePassword).toHaveBeenCalledWith('old', 'hashed');
      expect(passwordHelper.hashPassword).toHaveBeenCalledWith('new');
      expect(userRepository.update).toHaveBeenCalledWith({ id: 'id1' }, { password: 'newhashed' });
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      await expect(service.delete('id1')).rejects.toThrow(NotFoundException);
    });

    it('should remove user if found', async () => {
      const user = { id: 'id1' } as any;
      userRepository.findOneBy.mockResolvedValue(user);
      userRepository.remove.mockResolvedValue(undefined as any);

      await service.delete('id1');
      expect(userRepository.remove).toHaveBeenCalledWith(user);
    });
  });
});
