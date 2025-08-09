import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@modules/users/user.service';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { ResponseDTO } from '@common/dto/response.dto';
import { AuthController } from '@modules/auth/auth.controller';
import { AuthService } from '@modules/auth/auth.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let userService: UserService;

  // Mock dos guards para bypassar a autenticação real
  const mockLocalAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getById: jest.fn(),
          },
        },
      ],
    })
      // Mock guards
      .overrideGuard(AuthGuard('local'))
      .useValue(mockLocalAuthGuard)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);
    userService = moduleRef.get<UserService>(UserService);
  });

  describe('login', () => {
    it('should return a ResponseDTO with token and status 200', async () => {
      const email = 'john@example.com';
      const loginUserDTO = { email, password: '123456' };
      const token = 'fake-jwt-token';

      jest.spyOn(authService, 'login').mockResolvedValue(token);

      const result = await authController.login(loginUserDTO);

      expect(authService.login).toHaveBeenCalledWith(email);
      expect(result).toEqual(new ResponseDTO(token, 200));
    });
  });

  describe('getProfile', () => {
    it('should return a ResponseDTO with user data and status 200', async () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      const req = { user: { id: 1 } };

      jest.spyOn(userService, 'getById').mockResolvedValue(mockUser);

      const result = await authController.getProfile(req);

      expect(userService.getById).toHaveBeenCalledWith(req.user.id);
      expect(result).toEqual(new ResponseDTO(mockUser, 200));
    });
  });
});
