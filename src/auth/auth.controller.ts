import {
  Body,
  Req,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,)
  async register(@Body() dto: RegisterDto, @Req() req:any) {
    console.log("user: ", req.user)
    return this.authService.register(dto, req.user);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Current authenticated user',
  })
  profile(@Req() req: any) {
    return this.authService.profile(req.user.id);
  }
}
