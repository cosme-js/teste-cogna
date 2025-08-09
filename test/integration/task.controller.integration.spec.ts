import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, HttpStatus, ExecutionContext } from '@nestjs/common';
import { UserService } from '@modules/users/user.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/users/guards/roles.guard';
import { TaskController } from '@modules/task/task.controller';
import { TaskService } from '@modules/task/task.service';

describe('TaskController (integration)', () => {
  let app: INestApplication;

  const mockTaskService = {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserService = {
    getById: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = { id: 'user-123' };
      return true;
    },
  };

  const mockRolesGuard = {
    canActivate: () => true,
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: UserService, useValue: mockUserService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /tasks', () => {
    it('should create a task and return it with status 201', async () => {
      const createTaskDto = { title: 'Task 1', description: 'Desc 1' };
      const fakeUser = { id: 'user-123', name: 'Test User' };
      const createdTask = { id: 'task-1', title: 'Task 1', description: 'Desc 1', userId: 'user-123' };

      mockUserService.getById.mockResolvedValueOnce(fakeUser);
      mockTaskService.create.mockResolvedValueOnce(createdTask);

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send(createTaskDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        data: expect.objectContaining({
          id: createdTask.id,
          title: createdTask.title,
          description: createdTask.description,
        }),
        status: HttpStatus.CREATED,
      });

      expect(mockUserService.getById).toHaveBeenCalledWith('user-123');
      expect(mockTaskService.create).toHaveBeenCalledWith(createTaskDto, fakeUser);
    });
  });

  describe('GET /tasks', () => {
    it('should return paginated tasks with status 200', async () => {
      const paginationQuery = { page: "1", limit: "10" };
      const paginatedResult = {
        items: [
          { id: 'task-1', title: 'Task 1' },
          { id: 'task-2', title: 'Task 2' },
        ],
        meta: { totalItems: 2, itemCount: 2, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
      };

      mockTaskService.getAll.mockResolvedValueOnce(paginatedResult);

      const response = await request(app.getHttpServer())
        .get('/tasks')
        .query(paginationQuery)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        ...paginatedResult,
        status: HttpStatus.OK,
      });
      expect(mockTaskService.getAll).toHaveBeenCalledWith('user-123', paginationQuery);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a task by id with status 200', async () => {
      const taskId = 'task-1';
      const task = { id: taskId, title: 'Task 1', description: 'Desc 1' };

      mockTaskService.getById.mockResolvedValueOnce(task);

      const response = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        data: expect.objectContaining({
          id: taskId,
          title: 'Task 1',
          description: 'Desc 1',
        }),
        status: HttpStatus.OK,
      });

      expect(mockTaskService.getById).toHaveBeenCalledWith(taskId, 'user-123');
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update a task and return updated task with status 200', async () => {
      const taskId = 'task-1';
      const updateTaskDto = { title: 'Updated Task' };
      const updatedTask = { id: taskId, title: 'Updated Task', description: 'Desc 1' };

      mockTaskService.update.mockResolvedValueOnce(updatedTask);

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .send(updateTaskDto)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        data: updatedTask,
        status: HttpStatus.OK,
      });

      expect(mockTaskService.update).toHaveBeenCalledWith(taskId, 'user-123', updateTaskDto);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task and return success message with status 200', async () => {
      const taskId = 'task-1';

      mockTaskService.delete.mockResolvedValueOnce(undefined);

      const response = await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        message: 'Successfully deleted task',
        status: HttpStatus.OK,
      });

      expect(mockTaskService.delete).toHaveBeenCalledWith(taskId, 'user-123');
    });
  });
});
