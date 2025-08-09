import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';


export class UpdatePasswordDTO {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    oldPassword: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 1
    },
    { message: "Password must be at least 8 characters long and include at least 1 lowercase letter, 1 number, and 1 symbol" })
    newPassword: string
}