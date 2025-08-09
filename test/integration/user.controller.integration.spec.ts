import { Test, TestingModule } from '@nestjs/testing';
import {
    INestApplication,
    ExecutionContext,
    HttpStatus,
    ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/users/guards/roles.guard';
import { UserController } from '@modules/users/user.controller';
import { UserRole, User } from '@modules/users/user.entity';
import { UserService } from '@modules/users/user.service';
import { AddressStorageService } from '@modules/address-storage/address-storage.service';
import { AddressService } from '@modules/address/address.service';
import { PasswordHelper } from '@helpers/password.helper';

const userRepositoryMock = {
    existsBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    merge: jest.fn(),
};

const addressStorageServiceMock = { getByZipCode: jest.fn() };
const addressServiceMock = { create: jest.fn() };
const passwordHelperMock = { hashPassword: jest.fn(), comparePassword: jest.fn() };

const mockJwtAuthGuard = {
    canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { id: 'user-1', role: UserRole.ADMIN };
        return true;
    },
};

import { ForbiddenException } from '@nestjs/common';

class MockRolesGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || !user.role) {
      throw new ForbiddenException('User not authenticated or roles not found');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('Access denied: insufficient role');
    }

    return true;
  }
}

describe('UserController - Integration Test', () => {
    let app: INestApplication;

    const reflector = new Reflector();

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                UserService,
                Reflector,
                { provide: getRepositoryToken(User), useValue: userRepositoryMock },
                { provide: AddressStorageService, useValue: addressStorageServiceMock },
                { provide: AddressService, useValue: addressServiceMock },
                { provide: PasswordHelper, useValue: passwordHelperMock },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue(mockJwtAuthGuard)
            .overrideGuard(RolesGuard)
            .useValue(new MockRolesGuard(reflector))
            .compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();
    });

    afterEach(() => jest.clearAllMocks());

    afterAll(async () => {
        await app.close();
    });

    describe('POST /users', () => {
        it('should create user successfully', async () => {
            const createDto = { email: 'test@example.com', zipCode: '59920000', password: '@ASDAS!asdas123ZS!@', name: 'Test User' };
            userRepositoryMock.existsBy.mockResolvedValue(false);
            addressStorageServiceMock.getByZipCode.mockResolvedValue({ street: 'Street 1' });
            addressServiceMock.create.mockResolvedValue({ id: 'addr1', street: 'Street 1' });
            passwordHelperMock.hashPassword.mockResolvedValue('hashedpass');
            userRepositoryMock.create.mockReturnValue({ ...createDto, password: 'hashedpass', address: { id: 'addr1' } });
            userRepositoryMock.save.mockResolvedValue({ id: 'user1', ...createDto, password: undefined, role: undefined });

            const res = await request(app.getHttpServer())
                .post('/users')
                .send(createDto)
                .expect(HttpStatus.CREATED);

            expect(res.body).toEqual({
                data: expect.objectContaining({ id: 'user1', email: createDto.email, name: createDto.name }),
                status: HttpStatus.CREATED,
            });
        });

        it('should return conflict if user already exists', async () => {
            userRepositoryMock.existsBy.mockResolvedValue(true);

            const res = await request(app.getHttpServer())
                .post('/users')
                .send({ email: 'exist@example.com', zipCode: '59920000', password: '@ASDAS!asdas123ZS!@', name: 'Test' })
                .expect(HttpStatus.CONFLICT);

            expect(res.body.message).toBe('User with this email already exists');
        });
    });

    describe('GET /users', () => {
        it('should return paginated users for ADMIN', async () => {
            const users = [{ id: 'user1', name: 'User One', email: 'u1@example.com' }];
            userRepositoryMock.findAndCount.mockResolvedValue([users, users.length]);

            const res = await request(app.getHttpServer())
                .get('/users')
                .query({ page: 1, limit: 10 })
                .expect(HttpStatus.OK);

            expect(res.body).toEqual({
                data: users,
                total: users.length,
                page: 1,
                limit: 10,
                status: HttpStatus.OK,
            });
        });

        it('should deny access if user role invalid', async () => {
            const badJwtAuthGuard = {
                canActivate: (context: ExecutionContext) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { id: 'user-1', role: UserRole.USER };
                    return true;
                },
            };

            const moduleRef = await Test.createTestingModule({
                controllers: [UserController],
                providers: [
                    UserService,
                    Reflector,
                    { provide: getRepositoryToken(User), useValue: userRepositoryMock },
                    { provide: AddressStorageService, useValue: addressStorageServiceMock },
                    { provide: AddressService, useValue: addressServiceMock },
                    { provide: PasswordHelper, useValue: passwordHelperMock },
                ],
            })
                .overrideGuard(JwtAuthGuard)
                .useValue(badJwtAuthGuard)
                .overrideGuard(RolesGuard)
                .useValue(new MockRolesGuard(new Reflector()))
                .compile();

            const appWithBadGuard = moduleRef.createNestApplication();
            appWithBadGuard.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
            await appWithBadGuard.init();

            const res = await request(appWithBadGuard.getHttpServer())
                .get('/users')
                .expect(HttpStatus.FORBIDDEN);

            expect(res.body.message).toBe('Access denied: insufficient role');

            await appWithBadGuard.close();
        });

    });

    describe('PATCH /users', () => {
        it('should update user', async () => {
            const updateDto = { name: 'Updated User' };
            userRepositoryMock.findOne.mockResolvedValue({ id: 'user-1', email: 'old@example.com', address: { zip_code: '12345' } });
            userRepositoryMock.existsBy.mockResolvedValue(false);
            userRepositoryMock.merge.mockReturnValue(updateDto);
            userRepositoryMock.update.mockResolvedValue(undefined);

            const res = await request(app.getHttpServer())
                .patch('/users')
                .send(updateDto)
                .expect(HttpStatus.OK);

            expect(res.body).toEqual({ message: 'Successfully updated user', status: HttpStatus.OK });
        });

        it('should return not found if user does not exist', async () => {
            userRepositoryMock.findOne.mockResolvedValue(null);

            const res = await request(app.getHttpServer())
                .patch('/users')
                .send({ name: 'NonExistent' })
                .expect(HttpStatus.NOT_FOUND);

            expect(res.body.message).toContain('User with ID');
        });
    });

    describe('PATCH /users/password', () => {
        it('should update password successfully', async () => {
            const pwdDto = { oldPassword: 'oldpass', newPassword: 'newpa@!SAD12asqss' };
            userRepositoryMock.findOne.mockResolvedValue({ id: 'user-1', password: 'hashedoldpass' });
            passwordHelperMock.comparePassword.mockResolvedValue(true);
            passwordHelperMock.hashPassword.mockResolvedValue('hashednewpass');
            userRepositoryMock.update.mockResolvedValue(undefined);

            const res = await request(app.getHttpServer())
                .patch('/users/password')
                .send(pwdDto)
                .expect(HttpStatus.OK);

            expect(res.body).toEqual({ message: 'Successfully updated user password', status: HttpStatus.OK });
        });

        it('should return bad request if old password wrong', async () => {
            const pwdDto = { oldPassword: 'wrongpass', newPassword: 'newpa@!ASDAsasd123ss' };
            userRepositoryMock.findOne.mockResolvedValue({ id: 'user-1', password: 'hashedoldpass' });
            passwordHelperMock.comparePassword.mockResolvedValue(false);

            const res = await request(app.getHttpServer())
                .patch('/users/password')
                .send(pwdDto)
                .expect(HttpStatus.BAD_REQUEST);

            expect(res.body.message).toBe('Wrong password!');
        });

        it('should return not found if user not found', async () => {
            userRepositoryMock.findOne.mockResolvedValue(null);

            const res = await request(app.getHttpServer())
                .patch('/users/password')
                .send({ oldPassword: 'any', newPassword: 'newpa@!ASDAsasd123ss' })
                .expect(HttpStatus.NOT_FOUND);

            expect(res.body.message).toContain('User not found with ID');
        });
    });

    describe('DELETE /users/:user_id', () => {
        it('should delete user successfully', async () => {
            userRepositoryMock.findOneBy.mockResolvedValue({ id: 'user-1' });
            userRepositoryMock.remove.mockResolvedValue(undefined);

            const res = await request(app.getHttpServer())
                .delete('/users/user-1')
                .expect(HttpStatus.OK);

            expect(res.body).toEqual({ message: 'Successfully deleted user', status: HttpStatus.OK });
        });

        it('should return not found if user to delete not found', async () => {
            userRepositoryMock.findOneBy.mockResolvedValue(null);

            const res = await request(app.getHttpServer())
                .delete('/users/user-1')
                .expect(HttpStatus.NOT_FOUND);

            expect(res.body.message).toContain('User with ID');
        });
    });
});
