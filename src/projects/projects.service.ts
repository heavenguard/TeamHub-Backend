import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ActivitiesService } from 'src/activities/activities.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async findAll() {
    const projects = await this.prisma.project.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },

        members: {
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
        },
        tasks: true,

        _count: {
          select: {
            tasks: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects.map(project => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length;
    
    // Optionally remove tasks from response if you don't need them
    const { tasks, ...projectWithoutTasks } = project;
    
    return {
      ...projectWithoutTasks,
      _count: {
        ...project._count,
        tasks: totalTasks,
        completedTasks: completedTasks,
        notCompletedTasks: totalTasks-completedTasks
      },
    };
  });
  }

  async findMyProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          {
            ownerId: userId,
          },
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },

      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },

        members: {
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
        },
        tasks: true,

        _count: {
          select: {
            tasks: true,
            members: true
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects.map(project => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length;
    
    // Optionally remove tasks from response if you don't need them
    const { tasks, ...projectWithoutTasks } = project;
    
    return {
      ...projectWithoutTasks,
      _count: {
        ...project._count,
        tasks: totalTasks,
        completedTasks: completedTasks,
        notCompletedTasks: totalTasks-completedTasks
      },
    };
  });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id,
      },

      include: {
        owner: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        startDate: new Date(dto.startDate),
        dueDate: new Date(dto.dueDate),
        gradient: dto.gradient,
        owner: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        owner: true,
      },
    });
    await this.activitiesService.create({
      type: 'PROJECT_CREATED',
      description: `Created project "${project.name}"`,
      userId: userId,
      projectId: project.id,
    });

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.update({
      where: {
        id,
      },

      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async remove(id: string, user: any) {
    const project = await this.prisma.project.findUnique({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({
      where: {
        id,
      },
    });

    await this.activitiesService.create({
      type: 'PROJECT_DELETED',
      description: `Deleted project "${project.name}"`,
      userId: user.id,
    });

    return {
      message: 'Project deleted successfully',
    };
  }
}
