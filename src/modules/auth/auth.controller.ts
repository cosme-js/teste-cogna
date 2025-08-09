import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserService } from '@modules/users/user.service';
import { LoginUserDTO } from './dto/login-user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ResponseDTO } from '@common/dto/response.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly userService: UserService
  ) { }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginUserDTO) {
    return new ResponseDTO(await this.authService.login(data.email), HttpStatus.OK);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  async getProfile(@Request() req) {
    return new ResponseDTO(await this.userService.getById(req.user.id), HttpStatus.OK);
  }
}
