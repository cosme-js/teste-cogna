import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TaskService } from '@modules/task/task.service';
import { Task } from '@modules/task/task.entity';

describe('TaskService', () => {
    let service: TaskService;
    let repo: jest.Mocked<Repository<Task>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TaskService,
                {
                    provide: getRepositoryToken(Task),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        findAndCount: jest.fn(),
                        merge: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get(TaskService);
        repo = module.get(getRepositoryToken(Task));
    });

    describe('create', () => {
        it('should create and save a new task', async () => {
            const createDto = { title: 'Test Task', description: 'Desc' } as any;
            const user = { id: 'user1' } as any;
            const taskEntity = { id: 'task1', ...createDto, user };

            repo.create.mockReturnValue(taskEntity);
            repo.save.mockResolvedValue(taskEntity);

            const result = await service.create(createDto, user);

            expect(repo.create).toHaveBeenCalledWith({ ...createDto, user });
            expect(repo.save).toHaveBeenCalledWith(taskEntity);
            expect(result).toBe(taskEntity);
        });
    });

    describe('getById', () => {
        it('should return task if found', async () => {
            const task = { id: 'task1', user: { id: 'user1' } } as any;
            repo.findOne.mockResolvedValue(task);

            const result = await service.getById('task1', 'user1');

            expect(repo.findOne).toHaveBeenCalledWith({
                where: { id: 'task1', user: { id: 'user1' } },
            });
            expect(result).toBe(task);
        });

        it('should throw NotFoundException if task not found', async () => {
            repo.findOne.mockResolvedValue(null);

            await expect(service.getById('task1', 'user1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getAll', () => {
        it('should return paginated tasks', async () => {
            const tasks = [{ id: 'task1' }] as Task[];
            repo.findAndCount.mockResolvedValue([tasks, 1]);

            const result = await service.getAll('user1', { page: 1, limit: 10 });

            expect(repo.findAndCount).toHaveBeenCalledWith({
                where: { user: { id: 'user1' } },
                skip: 0,
                take: 10,
                order: { id: 'ASC' },
            });

            expect(result).toEqual({
                data: tasks,
                total: 1,
                page: 1,
                limit: 10,
            });
        });

        it('should return paginated tasks without pass pagination', async () => {
            const tasks = [{ id: 'task1' }] as Task[];
            repo.findAndCount.mockResolvedValue([tasks, 1]);

            const result = await service.getAll('user1');

            expect(repo.findAndCount).toHaveBeenCalledWith({
                where: { user: { id: 'user1' } },
                skip: 0,
                take: 10,
                order: { id: 'ASC' },
            });

            expect(result).toEqual({
                data: tasks,
                total: 1,
                page: 1,
                limit: 10,
            });
        });
    });

    describe('update', () => {
        it('should update and save the task', async () => {
            const existingTask = { id: 'task1', title: 'Old Title' } as any;
            const updateDto = { title: 'New Title' } as any;
            const mergedTask = { ...existingTask, ...updateDto };

            repo.findOne.mockResolvedValue(existingTask);
            repo.merge.mockReturnValue(mergedTask);
            repo.save.mockResolvedValue(mergedTask);

            const result = await service.update('task1', 'user1', updateDto);

            expect(repo.findOne).toHaveBeenCalledWith({
                where: { id: 'task1', user: { id: 'user1' } },
            });
            expect(repo.merge).toHaveBeenCalledWith(existingTask, updateDto);
            expect(repo.save).toHaveBeenCalledWith(mergedTask);
            expect(result).toBe(mergedTask);
        });

        it('should throw NotFoundException if task not found', async () => {
            repo.findOne.mockResolvedValue(null);

            await expect(service.update('task1', 'user1', { title: 'New' } as any))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should remove the task if found', async () => {
            const task = { id: 'task1' } as any;

            repo.findOne.mockResolvedValue(task);
            repo.remove.mockResolvedValue(undefined as any);

            await service.delete('task1', 'user1');

            expect(repo.findOne).toHaveBeenCalledWith({
                where: { id: 'task1', user: { id: 'user1' } },
            });
            expect(repo.remove).toHaveBeenCalledWith(task);
        });

        it('should throw NotFoundException if task not found', async () => {
            repo.findOne.mockResolvedValue(null);

            await expect(service.delete('task1', 'user1')).rejects.toThrow(NotFoundException);
        });
    });
});
