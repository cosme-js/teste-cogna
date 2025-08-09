import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDTO } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDTO extends PartialType(OmitType(CreateUserDTO, ['password'])) {
    @ApiPropertyOptional()
    name?: string;

    @ApiPropertyOptional()
    email?: string;

    @ApiPropertyOptional()
    zipCode?: string;
}
