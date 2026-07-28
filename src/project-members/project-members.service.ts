import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ActivitiesService } from 'src/activities/activities.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async findAll(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async addMember(projectId: string, dto: CreateProjectMemberDto, creator: any) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: dto.userId,
      },
    });

    if (existing) {
      throw new BadRequestException('User already belongs to this project');
    }

    const newMember = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role,
      },

      include: {
        user: true,
      },
    });
    await this.activitiesService.create({
      type: 'PROJECT_MEMBER_ADDED',
      description: `Added ${user.name} to ${project.name}`,
      userId: creator.id,
      projectId: project.id,
    });

    await this.notificationsService.create({
      userId: dto.userId,
      type: 'PROJECT',
      title: 'Added to project',
      message: `You have been added to ${project.name}`,
    });

    return newMember
  }

  async updateRole(id: string, dto: UpdateProjectMemberDto) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        id,
      },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    const updatedMember = await this.prisma.projectMember.update({
      where: {
        id,
      },

      data: {
        role: dto.role,
      },

      include: {
        user: true,
      },
    });

    // await this.activitiesService.create({
    //   type: 'PROJECT_MEMBER_ADDED',
    //   description: `Added ${user.name} to ${project.name}`,
    //   userId: currentUser.id,
    //   projectId: project.id,
    // });

    await this.notificationsService.create({
      userId: updatedMember.userId,
      type: 'PROJECT',
      title: 'Role Changed',
      message: `Your role has been changed on a project`,
    });

    return updatedMember
  }

  async remove(id: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        id,
      },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    await this.prisma.projectMember.delete({
      where: {
        id,
      },
    });

    // await this.activitiesService.create({
    //   type: 'PROJECT_MEMBER_ADDED',
    //   description: `Added ${user.name} to ${project.name}`,
    //   userId: currentUser.id,
    //   projectId: project.id,
    // });

    await this.notificationsService.create({
      userId: member.userId,
      type: 'PROJECT',
      title: 'Removed',
      message: `You have been removed from a project`,
    });

    return {
      message: 'Member removed successfully',
    };
  }
}