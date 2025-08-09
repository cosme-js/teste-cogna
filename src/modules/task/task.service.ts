import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '@modules/users/user.entity';
import { PaginationDTO } from '@common/dto/pagination.dto';
import { PaginatedResponse } from '@common/interfaces/list.response.interface';

@Injectable()
export class TaskService {
    constructor(@InjectRepository(Task) private readonly taskRepository: Repository<Task>) { }

    async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
        const task = this.taskRepository.create({
            ...createTaskDto,
            user,
        });

        return await this.taskRepository.save(task);
    }

    async getById(id: string, userId: string): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id, user: { id: userId } }
        });

        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }

        return task;
    }

    async getAll(userId: string, pagination?: PaginationDTO): Promise<PaginatedResponse<Task>> {
        const { page = 1, limit = 10 } = pagination ?? {};

        const [data, total] = await this.taskRepository.findAndCount({
            where: { user: { id: userId } },
            skip: (page - 1) * limit,
            take: limit,
            order: { id: 'ASC' },
        });

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async update(id: string, userId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
        const task = await this.getById(id, userId);

        const taskUpdated = this.taskRepository.merge(task, updateTaskDto);

        return await this.taskRepository.save(taskUpdated);
    }

    async delete(id: string, userId: string): Promise<void> {
        const task = await this.getById(id, userId);
        await this.taskRepository.remove(task);
    }
}
