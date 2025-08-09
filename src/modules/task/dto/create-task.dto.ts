import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TaskStatus } from '../task.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsOptional()
    @IsDateString()
    due_date?: string;

    @ApiProperty()
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;
}
