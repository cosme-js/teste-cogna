import { PasswordHelper } from '@helpers/password.helper';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('PasswordHelper', () => {
  let passwordHelper: PasswordHelper;

  beforeEach(() => {
    passwordHelper = new PasswordHelper();
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash the password using bcrypt', async () => {
      const mockHashed = 'hashed_password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashed);

      const result = await passwordHelper.hashPassword('plain123');

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'plain123',
        process.env.SALT_PASSWORD ?? 10
      );
      expect(result).toBe(mockHashed);
    });
  });

  describe('comparePassword', () => {
    it('should return true if passwords match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await passwordHelper.comparePassword('plain123', 'hashed');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain123', 'hashed');
      expect(result).toBe(true);
    });

    it('should return false if passwords do not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await passwordHelper.comparePassword('plain123', 'hashed');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain123', 'hashed');
      expect(result).toBe(false);
    });
  });
});
