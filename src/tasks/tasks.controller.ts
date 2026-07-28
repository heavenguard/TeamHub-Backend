import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(dto, req.user.id);
  }

  @Get()
  @ApiQuery({
    name: 'projectId',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    required: false,
  })
  @ApiQuery({
    name: 'priority',
    required: false,
  })
  @ApiQuery({
    name: 'assigneeId',
    required: false,
  })
  @ApiQuery({
    name: 'search',
    required: false,
  })
  @ApiOperation({
    summary: 'Get All',
  })
  findAll(@Query() query: any) {
    return this.tasksService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my tasks' })
  findMyTasks(@Req() req: any) {
    return this.tasksService.findMyTasks(req.user.id);
  }

  @Get('my/pending')
  @ApiOperation({ summary: 'Get my pending tasks' })
  findMyPendingTasks(@Req() req: any) {
    return this.tasksService.findMyPendingTasks(req.user.id);
  }

  @Get('my/completed')
  @ApiOperation({ summary: 'Get my completed tasks' })
  findMyCompletedTasks(@Req() req: any) {
    return this.tasksService.findMyCompletedTasks(req.user.id);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get tasks by project id' })
  findByProject(@Param('projectId') projectId: string) {
    return this.tasksService.findByProject(projectId);
  }

  @Get("my/overdue")
  @ApiOperation({ summary: 'Get  my overdue tasks' })
findMyOverdueTasks(@Req() req: any) {
  return this.tasksService.findMyOverdueTasks(req.user.id);
}

@Get("my/upcoming")
  @ApiOperation({ summary: 'Get my upcoming tasks' })
findUpcomingTasks(@Req() req: any) {
  return this.tasksService.findUpcomingTasks(req.user.id);
}

  @Get(':id')
  @ApiOperation({
    summary: 'Get One',
  })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Task By ID',
  })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update A Task Status',
  })
  changeStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.tasksService.changeStatus(id, dto);
  }

  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Assign New Member To Task',
  })
  assign(@Param('id') id: string, @Body() dto: AssignTaskDto) {
    return this.tasksService.assign(id, dto);
  }
}
