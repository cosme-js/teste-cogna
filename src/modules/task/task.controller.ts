import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDTO } from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/users/guards/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ResponseDTO } from '@common/dto/response.dto';
import { UserService } from '@modules/users/user.service';
import { plainToInstance } from 'class-transformer';
import { TaskResponseDto } from './dto/task-response.dto';
import { Task } from './task.entity';
import { PaginatedResponse } from '@common/interfaces/list.response.interface';

type PaginatedResponseWithStatus<T> = PaginatedResponse<T> & { status: number };

@Controller('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskController {
    constructor(private readonly taskService: TaskService,
        private readonly userService: UserService
    ) { }

    @Post()
    async create(@Body() createTaskDto: CreateTaskDto, @Request() req: any): Promise<ResponseDTO> {
        const userId = req.user.id;
        const user = await this.userService.getById(userId);

        const task = await this.taskService.create(createTaskDto, user);

        return new ResponseDTO(plainToInstance(TaskResponseDto, task), HttpStatus.CREATED);
    }

    @Get()
    async getAll(@Request() req: any, @Query() pagination: PaginationDTO): Promise<PaginatedResponseWithStatus<Task>> {
        const result = await this.taskService.getAll(req.user.id, pagination);
        return { ...result, status: HttpStatus.OK };
    }

    @Get(':id')
    async getById(@Param('id') id: string, @Request() req: any): Promise<ResponseDTO> {
        const task = await this.taskService.getById(id, req.user.id);
        return new ResponseDTO(plainToInstance(TaskResponseDto, task), HttpStatus.OK);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
        @Request() req: any,
    ): Promise<ResponseDTO> {
        const updatedTask = await this.taskService.update(id, req.user.id, updateTaskDto);
        return new ResponseDTO(updatedTask, HttpStatus.OK);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any): Promise<ResponseDTO> {
        await this.taskService.delete(id, req.user.id);
        return new ResponseDTO('Successfully deleted task', HttpStatus.OK);
    }
}
