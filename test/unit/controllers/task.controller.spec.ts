import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@modules/users/user.service';
import { PaginationDTO } from '@common/dto/pagination.dto';
import { ResponseDTO } from '@common/dto/response.dto';
import { HttpStatus } from '@nestjs/common';
import { TaskController } from '@modules/task/task.controller';
import { TaskService } from '@modules/task/task.service';
import { CreateTaskDto } from '@modules/task/dto/create-task.dto';
import { UpdateTaskDto } from '@modules/task/dto/update-task.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/users/guards/roles.guard';

describe('TaskController', () => {
    let taskController: TaskController;
    let taskService: Partial<TaskService>;
    let userService: Partial<UserService>;

    const mockJwtAuthGuard = {
        canActivate: jest.fn(() => true),
    };

    const mockRolesGuard = {
        canActivate: jest.fn(() => true),
    };

    beforeEach(async () => {
        userService = {
            getById: jest.fn().mockResolvedValue({ id: 'user123', name: 'User Test' }),
        };

        taskService = {
            create: jest.fn().mockImplementation((createDto: CreateTaskDto, user) =>
                Promise.resolve({ id: 'task123', ...createDto, user })),
            getAll: jest.fn().mockResolvedValue({ data: [{ id: 'task123', title: 'Test task' }], total: 1 }),
            getById: jest.fn().mockImplementation((id: string, userId: string) =>
                Promise.resolve({ id, title: 'Test task', userId })),
            update: jest.fn().mockImplementation((id: string, userId: string, updateDto: UpdateTaskDto) =>
                Promise.resolve({ id, ...updateDto })),
            delete: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [TaskController],
            providers: [
                { provide: TaskService, useValue: taskService },
                { provide: UserService, useValue: userService },
            ],
        })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .overrideGuard(RolesGuard)
        .useValue(mockRolesGuard)
        .compile();

        taskController = module.get<TaskController>(TaskController);
    });

    describe('create', () => {
        it('should create a task and return ResponseDTO with CREATED status', async () => {
            const createDto: CreateTaskDto = { title: 'New task', description: 'Task desc' };
            const req = { user: { id: 'user123' } };

            const response = await taskController.create(createDto, req);

            expect(userService.getById).toHaveBeenCalledWith('user123');
            expect(taskService.create).toHaveBeenCalledWith(createDto, { id: 'user123', name: 'User Test' });
            expect(response).toBeInstanceOf(ResponseDTO);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.data).toMatchObject({ id: 'task123', title: 'New task', description: 'Task desc' });
        });
    });

    describe('getAll', () => {
        it('should return paginated tasks with status', async () => {
            const req = { user: { id: 'user123' } };
            const pagination: PaginationDTO = { page: 1, limit: 10 };

            const result = await taskController.getAll(req, pagination);

            expect(taskService.getAll).toHaveBeenCalledWith('user123', pagination);
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('total', 1);
            expect(result).toHaveProperty('status', HttpStatus.OK);
        });
    });

    describe('getById', () => {
        it('should return a task by id wrapped in ResponseDTO', async () => {
            const req = { user: { id: 'user123' } };
            const id = 'task123';

            const response = await taskController.getById(id, req);

            expect(taskService.getById).toHaveBeenCalledWith(id, 'user123');
            expect(response).toBeInstanceOf(ResponseDTO);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.data).toMatchObject({ id, title: 'Test task' });
        });
    });

    describe('update', () => {
        it('should update a task and return success ResponseDTO', async () => {
            const id = 'task123';
            const updateDto: UpdateTaskDto = { title: 'Updated title' };
            const req = { user: { id: 'user123' } };

            const response = await taskController.update(id, updateDto, req);

            expect(taskService.update).toHaveBeenCalledWith(id, 'user123', updateDto);
            expect(response).toBeInstanceOf(ResponseDTO);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.data).toMatchObject({ id, title: 'Updated title' });
        });
    });

    describe('delete', () => {
        it('should delete a task and return success ResponseDTO', async () => {
            const id = 'task123';
            const req = { user: { id: 'user123' } };

            const response = await taskController.delete(id, req);

            expect(taskService.delete).toHaveBeenCalledWith(id, 'user123');
            expect(response).toBeInstanceOf(ResponseDTO);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.message).toBe('Successfully deleted task');
        });
    });
});
