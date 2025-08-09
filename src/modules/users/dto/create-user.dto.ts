import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsStrongPassword, IsNumberString } from 'class-validator';


export class CreateUserDTO {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }, {
        message: "Password must be at least 8 characters long and include at least 1 lowercase letter, 1 number, and 1 symbol"
    })
    password: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsNumberString()
    zipCode: string
}