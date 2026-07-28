import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all projects',
  })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('my')
  @ApiOperation({
    summary: 'Get All Projects You Are Linked To',
  })
  findMyProjects(@Req() req: any) {
    return this.projectsService.findMyProjects(req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Project by ID',
  })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create New Project',
  })
  create(@Body() dto: CreateProjectDto, @Req() req: any) {
    return this.projectsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Project by ID',
  })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete project By ID',
  })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(id, req.user.id);
  }
}
