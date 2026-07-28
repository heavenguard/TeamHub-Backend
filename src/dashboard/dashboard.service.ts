import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const [
      totalProjects,
      totalTasks,
      completedTasks,
      notifications,
      recentActivities,
      myProjects,
    ] = await Promise.all([
      this.prisma.project.count(),

      this.prisma.task.count(),

      this.prisma.task.count({
        where: {
          status: 'DONE',
        },
      }),

      this.prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      }),

      this.prisma.activity.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: true,
          project: true,
          task: true,
        },
      }),

      this.prisma.project.count({
        where: {
          OR: [
            {
              ownerId: userId,
            },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
      }),
    ]);

    const progress =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return {
      statistics: {
        totalProjects,
        myProjects,
        totalTasks,
        completedTasks,
        progress,
        unreadNotifications: notifications,
      },
      recentActivities,
    };
  }

  async findMyDashboard(userId: string) {
    const now = new Date();

    const [
      totalProjects,
      myProjects,
      totalTasks,
      completedTasks,
      todoTasks,
      inProgressTasks,
      pendingTasks,
      reviewTasks,
      overdueTasks,
      teamSize,
      totalMembers,
      unreadNotifications,
      projects,
      notifications,
      activities,
    ] = await Promise.all([
      this.prisma.project.count(),
      
      this.prisma.project.count({
        where: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
      }),

      // Total tasks
      this.prisma.task.count({
        where: {
          assigneeId: userId,
        },
      }),

      // Completed tasks
      this.prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'DONE',
        },
      }),

      this.prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'TODO',
        },
      }),

      this.prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'IN_PROGRESS',
        },
      }),
      
      // Pending tasks
      this.prisma.task.count({
        where: {
          assigneeId: userId,
          status: {
            not: 'DONE',
          },
        },
      }),

      // Review tasks
      this.prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'REVIEW',
        },
      }),

      // Overdue tasks
      this.prisma.task.count({
        where: {
          assigneeId: userId,
          status: {
            not: 'DONE',
          },
          dueDate: {
            lt: now,
          },
        },
      }),

      // Team size (members of projects you own)
      this.prisma.projectMember.count({
        where: {
          project: {
            ownerId: userId,
          },
        },
      }),

      this.prisma.users.count()

      // Unread notifications
      this.prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      }),

      // Latest 2 projects
      this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
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
                  avatar: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 2,
      }),

      // Latest notifications
      this.prisma.notification.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      // Latest activities
      this.prisma.activity.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return {
      stats: {
        totalProjects,
        myProjects,
        totalTasks,
        completedTasks,
        todoTasks,
        inProgressTasks,
        pendingTasks,
        reviewTasks,
        overdueTasks,
        teamSize,
        totalMembers,
        unreadNotifications,
        completionRate:
          totalTasks === 0
            ? 0
            : Math.round((completedTasks / totalTasks) * 100),
      },

      projects,
      notifications,
      activities,
    };
  }
}
