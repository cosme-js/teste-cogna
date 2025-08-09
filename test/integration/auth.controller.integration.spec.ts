import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { UserService } from '@modules/users/user.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthController } from '@modules/auth/auth.controller';
import { AuthService } from '@modules/auth/auth.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

describe('AuthController (integration)', () => {
  let app: INestApplication;

  const mockAuthService = {
    login: jest.fn(),
  };

  const mockUserService = {
    getById: jest.fn(),
  };

  const mockLocalAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockJwtAuthGuard = {
    canActivate: (context) => {
      const req = context.switchToHttp().getRequest();
      req.user = { id: 'user-123' };
      return true;
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
      ],
    })
      .overrideGuard(AuthGuard('local'))
      .useValue(mockLocalAuthGuard)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return JWT token on login', async () => {
      const loginEmail = 'user@example.com';
      const fakeToken = { 'access_token': 'fake-jwt-token' };
      mockAuthService.login.mockResolvedValueOnce(fakeToken);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: loginEmail, password: 'any-password' })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        data: fakeToken,
        status: HttpStatus.OK,
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginEmail);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile', async () => {
      const fakeUser = { id: 'user-123', name: 'Test User', email: 'user@example.com' };
      mockUserService.getById.mockResolvedValueOnce(fakeUser);

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer faketoken')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        data: fakeUser,
        status: HttpStatus.OK,
      });
      expect(mockUserService.getById).toHaveBeenCalledWith('user-123');
    });
  });
});
