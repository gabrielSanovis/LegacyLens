import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

class AuthDto {
  email!: string;
  password!: string;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: AuthDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: AuthDto) {
    try {
      return await this.authService.login(dto.email, dto.password);
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
