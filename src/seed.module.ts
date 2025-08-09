import { PasswordHelper } from '@helpers/password.helper';
import { DbModule } from '@infra/db/db.module';
import { CreateAdminUserSeed } from '@infra/db/seeds/create-root-user.seed';
import { AddressModule } from '@modules/address/address.module';
import { User } from '@modules/users/user.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [ConfigModule.forRoot(), DbModule, AddressModule, TypeOrmModule.forFeature([User])],
    controllers: [],
    providers: [CreateAdminUserSeed, PasswordHelper],
})
export class SeedModule { }
