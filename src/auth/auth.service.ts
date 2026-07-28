import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from 'src/email/email.service';
import { Role } from 'generated/prisma/enums';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ActivitiesService } from 'src/activities/activities.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async register(dto: RegisterDto, creator: any) {
    if (creator.role === Role.MANAGER && dto.role !== Role.MEMBER) {
      throw new ForbiddenException('Managers can only create members');
    }

    if (creator.role !== Role.ADMIN && creator.role !== Role.MANAGER) {
      throw new ForbiddenException('You cannot create users');
    }
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const generatedPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        department: dto.department,
        role: dto.role,
      },
    });

    await this.emailService.sendUserCredentials(
      user.email,
      generatedPassword,
      user.name,
    );

    await this.activitiesService.create({
      type: 'USER_CREATION',
      description: `Invited "${dto.name} to TeamHub"`,
      userId: creator.id,
    });

     await this.notificationsService.create({
      userId: creator.id,
      type: 'WELCOME',
      title: 'Welcome',
      message: `Welcome to TeamHub`,
    });

    return {
      message: 'User created successfully. Credentials sent by email.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user,
    });

    return {
      message: 'Login successful',
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  async profile(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });
  }

  private generatePassword() {
    return (
      Math.random().toString(36).slice(-10) + Math.floor(Math.random() * 100)
    );
  }
}
