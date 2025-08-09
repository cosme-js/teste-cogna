import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PasswordHelper } from '@helpers/password.helper';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthService } from './auth.service';
import { UserModule } from '@modules/users/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot(),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1h' },
        }),
        UserModule],
    controllers: [AuthController],
    providers: [PasswordHelper, AuthService, JwtStrategy, LocalStrategy]
})
export class AuthModule { }
