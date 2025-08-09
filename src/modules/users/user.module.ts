import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { AddressStorageModule } from 'src/modules/address-storage/address-storage.module';
import { PasswordHelper } from '@helpers/password.helper';
import { UserController } from './user.controller';
import { AddressModule } from '@modules/address/address.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        AddressStorageModule,
        AddressModule
    ],
    controllers: [UserController],
    providers: [
        UserService,
        PasswordHelper
    ],
    exports: [
        UserService
    ]
})
export class UserModule { }
