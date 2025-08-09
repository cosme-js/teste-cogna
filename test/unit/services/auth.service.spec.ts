import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PasswordHelper } from '@helpers/password.helper';
import { UserService } from '@modules/users/user.service';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from '@modules/auth/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let passwordHelper: jest.Mocked<PasswordHelper>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: PasswordHelper,
          useValue: {
            comparePassword: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    passwordHelper = module.get(PasswordHelper);
    userService = module.get(UserService);
  });

  describe('generateToken', () => {
    it('should generate a JWT token with correct payload', () => {
      const user = {
        id: 'id1',
        name: 'User Name',
        email: 'user@example.com',
        role: 'admin',
        created_at: new Date(),
      };
      const token = 'jwt-token';
      jwtService.sign.mockReturnValue(token);

      const result = service.generateToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: user.name,
        email: user.email,
        sub: user.id,
        role: user.role,
        created_at: user.created_at,
      });
      expect(result).toEqual({ access_token: token });
    });
  });

  describe('validadeUser', () => {
    it('should throw BadRequestException if user not found', async () => {
      userService.getByEmail.mockResolvedValue(null);

      await expect(service.validadeUser({ email: 'a@b.com', password: '123' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password does not match', async () => {
      const user = { password: 'hashedpassword' };
      userService.getByEmail.mockResolvedValue(user as any);
      passwordHelper.comparePassword.mockResolvedValue(false);

      await expect(service.validadeUser({ email: 'a@b.com', password: 'wrongpass' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should return true if user is valid', async () => {
      const user = { password: 'hashedpassword' };
      userService.getByEmail.mockResolvedValue(user as any);
      passwordHelper.comparePassword.mockResolvedValue(true);

      const result = await service.validadeUser({ email: 'a@b.com', password: 'correctpass' });
      expect(result).toBe(true);
    });
  });

  describe('login', () => {
    it('should return access token after deleting password', async () => {
      const user = {
        id: 'id1',
        password: 'hashedpassword',
        name: 'User Name',
        email: 'user@example.com',
        role: 'user',
        created_at: new Date(),
      };
      const token = 'jwt-token';

      userService.getByEmail.mockResolvedValue({ ...user } as any);
      jwtService.sign.mockReturnValue(token);

      const result = await service.login(user.email);

      expect(userService.getByEmail).toHaveBeenCalledWith(user.email);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({ access_token: token });
    });
  });
});
