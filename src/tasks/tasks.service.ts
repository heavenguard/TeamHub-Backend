import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { ActivitiesService } from 'src/activities/activities.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async create(dto: CreateTaskDto, creatorId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.assigneeId,
      },
    });

    if (!user) {
      throw new NotFoundException('Assignee not found');
    }

    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId: dto.projectId,
        userId: dto.assigneeId,
      },
    });

    if (!member && project.ownerId !== dto.assigneeId) {
      throw new BadRequestException('User is not a member of this project');
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: new Date(dto.dueDate),
        estimatedHours: dto.estimatedHours,
        tags: dto.tags ?? [],
        project: {
          connect: {
            id: dto.projectId,
          },
        },

        assignee: {
          connect: {
            id: dto.assigneeId,
          },
        },
      },

      include: {
        project: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    await this.activitiesService.create({
      type: 'TASK_CREATED',
      description: `Created task "${task.title}"`,
      userId: creatorId,
      projectId: task.projectId,
      taskId: task.id,
    });

    await this.notificationsService.create({
      userId: task.assigneeId,
      type: 'TASK',
      title: 'New task assigned',
      message: `You have been assigned "${task.title}"`,
    });

    return task;
  }

  async findAll(filters?: {
    projectId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    search?: string;
  }) {
    return this.prisma.task.findMany({
      where: {
        projectId: filters?.projectId ? filters.projectId : undefined,
        status: filters?.status ? (filters.status as any) : undefined,
        priority: filters?.priority ? (filters.priority as any) : undefined,
        assigneeId: filters?.assigneeId ? filters.assigneeId : undefined,
        OR: filters?.search
          ? [
              {
                title: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },

              {
                description: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
            ]
          : undefined,
      },

      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMyTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
      },
      include: {
        project: true,
        assignee: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findMyPendingTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: {
          not: 'DONE',
        },
      },
      include: {
        project: true,
        assignee: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findMyCompletedTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: 'DONE',
      },
      include: {
        project: true,
        assignee: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: {
        projectId,
      },
      include: {
        assignee: true,
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMyOverdueTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: 'DONE',
        },
      },
      include: {
        project: true,
      },
    });
  }

  async findUpcomingTasks(userId: string) {
    const now = new Date();

    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        dueDate: {
          gte: now,
          lte: nextWeek,
        },
        status: {
          not: 'DONE',
        },
      },
      include: {
        project: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },

      include: {
        project: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },

        assignee: {
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

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.update({
      where: {
        id,
      },

      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        estimatedHours: dto.estimatedHours,
        tags: dto.tags,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },

      include: {
        project: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Task deleted successfully',
    };
  }

  async assign(id: string, dto: AssignTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },

      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.assigneeId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: dto.assigneeId,
      },
    });

    if (!member && task.project.ownerId !== dto.assigneeId) {
      throw new BadRequestException('User is not part of this project');
    }

    return this.prisma.task.update({
      where: {
        id,
      },

      data: {
        assignee: {
          connect: {
            id: dto.assigneeId,
          },
        },
      },

      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },

        project: true,
      },
    });
  }

  async changeStatus(id: string, dto: UpdateTaskStatusDto) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const newTaskWithNewStatus = await this.prisma.task.update({
      where: {
        id,
      },

      data: {
        status: dto.status,
      },

      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
    await this.activitiesService.create({
      type: 'TASK_STATUS_CHANGED',
      description: `Changed "${task.title}" to ${task.status}`,
      userId: task.assigneeId,
      projectId: task.projectId,
      taskId: task.id,
    });

    return newTaskWithNewStatus;
  }
}
