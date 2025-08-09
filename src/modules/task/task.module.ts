import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskService } from './task.service';
import { UserModule } from '@modules/users/user.module';
import { TaskController } from './task.controller';

@Module({
    imports: [UserModule, TypeOrmModule.forFeature([Task])],
    controllers: [TaskController],
    providers: [TaskService]
})
export class TaskModule { }
