import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDTO } from './dto/login-user.dto';
import { PasswordHelper } from '@helpers/password.helper';
import { UserService } from '@modules/users/user.service';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService,
        private readonly passwordHelper: PasswordHelper,
        private readonly userService: UserService
    ) { }

    public generateToken(user: any) {
        const payload = { username: user.name, email: user.email, sub: user.id, role: user.role, created_at: user.created_at };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async validadeUser({ email, password }: LoginUserDTO): Promise<boolean> {

        const user = await this.userService.getByEmail(email);

        const isValidUser = user && await this.passwordHelper.comparePassword(password, (user.password as any));

        if (!isValidUser) {
            throw new BadRequestException("User or password is incorrect");
        }

        return true
    }

    async login(email: string): Promise<{ access_token: string }> {
        const user = await this.userService.getByEmail(email);

        delete user?.password
        return this.generateToken(user)
    }
}
