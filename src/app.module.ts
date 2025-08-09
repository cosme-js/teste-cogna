import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { DbModule } from '@infra/db/db.module';
import { AddressModule } from '@modules/address/address.module';
import { AddressStorageModule } from '@modules/address-storage/address-storage.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '@modules/users/user.module';
import { TaskModule } from '@modules/task/task.module';

@Module({
  imports: [
    ConfigModule.forRoot(), AuthModule, DbModule, UserModule, AddressModule, AddressStorageModule, TaskModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
