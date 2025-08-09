import { Test, TestingModule } from '@nestjs/testing';
import { PaginationDTO } from '@common/dto/pagination.dto';
import { ResponseDTO } from '@common/dto/response.dto';
import { HttpStatus } from '@nestjs/common';
import { UserController } from '@modules/users/user.controller';
import { UserService } from '@modules/users/user.service';
import { CreateUserDTO } from '@modules/users/dto/create-user.dto';
import { UpdateUserDTO } from '@modules/users/dto/update-user.dto';
import { UpdatePasswordDTO } from '@modules/users/dto/update-password.dto';

describe('UserController', () => {
    let userController: UserController;
    let userService: Partial<UserService>;

    beforeEach(async () => {
        userService = {
            create: jest.fn().mockImplementation((data: CreateUserDTO) => Promise.resolve({ id: '123', ...data })),
            getAll: jest.fn().mockImplementation((pagination: PaginationDTO) => Promise.resolve({
                data: [{ id: '123', name: 'John' }],
                total: 1,
                page: 1,
                limit: 10,
            })),
            update: jest.fn().mockResolvedValue(undefined),
            updatePassword: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                { provide: UserService, useValue: userService },
            ],
        }).compile();

        userController = module.get<UserController>(UserController);
    });

    describe('create', () => {
        it('should create a new user and return ResponseDTO with CREATED status', async () => {
            const createDto: CreateUserDTO = { name: 'John', email: 'john@example.com', password: '123456', zipCode: '59920000' };

            const response = await userController.create(createDto);

            expect(userService.create).toHaveBeenCalledWith(createDto);
            expect(response).toBeInstanceOf(ResponseDTO);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.data).toMatchObject(createDto);
        });
    });

    describe('get', () => {
        it('should return a list of users', async () => {
            const pagination: PaginationDTO = { page: 1, limit: 10 };

            const { data } = await userController.get(pagination);

            expect(userService.getAll).toHaveBeenCalledWith(pagination);

            expect(Array.isArray(data)).toBe(true);
            expect(data[0]).toHaveProperty('id', '123');
        });
    });

    describe('update', () => {
        it('should update user and return success ResponseDTO', async () => {
            const updateDto: UpdateUserDTO = { name: 'John Updated' };
            const req = { user: { id: '123' } };

            const response = await userController.update(updateDto, req);

            expect(userService.update).toHaveBeenCalledWith('123', updateDto);
            expect(response).toBeInstanceOf(ResponseDTO);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.message).toBe('Successfully updated user');
        });
    });

    describe('updatePassword', () => {
        it('should update user password and return success ResponseDTO', async () => {
            const updatePassDto: UpdatePasswordDTO = { oldPassword: '123', newPassword: '456' };
            const req = { user: { id: '123' } };

            const response = await userController.updatePassoword(updatePassDto, req);

            expect(userService.updatePassword).toHaveBeenCalledWith('123', updatePassDto);
            expect(response).toBeInstanceOf(ResponseDTO);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.message).toBe('Successfully updated user password');
        });
    });

    describe('delete', () => {
        it('should delete user and return success ResponseDTO', async () => {
            const userId = '123';

            const response = await userController.delete(userId);

            expect(userService.delete).toHaveBeenCalledWith(userId);
            expect(response).toBeInstanceOf(ResponseDTO);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.message).toBe('Successfully deleted user');
        });
    });
});
