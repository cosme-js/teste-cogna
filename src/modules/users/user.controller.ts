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
  UseGuards
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { PaginationDTO } from '@common/dto/pagination.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { UpdatePasswordDTO } from './dto/update-password.dto';
import { Roles } from './decorators/roles.decorator';
import { User, UserRole } from './user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from './guards/roles.guard';
import { ResponseDTO } from '@common/dto/response.dto';
import { PaginatedResponse } from '@common/interfaces/list.response.interface';

type PaginatedResponseWithStatus<T> = PaginatedResponse<T> & { status: number };

@Controller('users')
export class UserController {

  constructor(private readonly userService: UserService) { }

  @Post()
  async create(@Body() data: CreateUserDTO) {
    return new ResponseDTO(await this.userService.create(data), HttpStatus.CREATED);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiBearerAuth()
  async get(@Query() pagination: PaginationDTO): Promise<PaginatedResponseWithStatus<User>> {
    const result = await this.userService.getAll(pagination);
    return { ...result, status: HttpStatus.OK };
  }

  @Patch()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Body() data: UpdateUserDTO, @Request() req: any): Promise<ResponseDTO> {
    const id = req.user.id;
    await this.userService.update(id, data);
    return new ResponseDTO("Successfully updated user", HttpStatus.OK);
  }

  @Patch('password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePassoword(@Body() data: UpdatePasswordDTO, @Request() req: any): Promise<ResponseDTO> {
    const id = req.user.id;
    await this.userService.updatePassword(id, data);
    return new ResponseDTO("Successfully updated user password", HttpStatus.OK);
  }

  @Delete(':user_id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('user_id') userId: string): Promise<ResponseDTO> {
    await this.userService.delete(userId);
    return new ResponseDTO("Successfully deleted user", HttpStatus.OK);
  }
}
